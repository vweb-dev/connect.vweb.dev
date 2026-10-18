<?php
declare(strict_types=1);
/**
 * Run from CLI on an existing Hostinger cron (for example every 10–15 min).
 * Requires composer install of free minishlink/web-push in website root.
 * Never invoke through a browser. Sends only to active explicit opt-in accounts.
 */
if (PHP_SAPI!=='cli') {http_response_code(403);exit('CLI only');}
require dirname(__DIR__).'/api/_boot.php';
$vendor=dirname(__DIR__).'/vendor/autoload.php';
if(!is_file($vendor)){fwrite(STDERR,"Composer dependencies not installed.\n");exit(2);}
require $vendor;
use Minishlink\WebPush\WebPush;
use Minishlink\WebPush\Subscription;
try {
    $config=connect_config();
    foreach(['vapid_public_key','vapid_private_key'] as $key){
        if(empty($config[$key]))throw new RuntimeException('Private VAPID credentials not configured.');
    }
    $db=connect_db();
    // One campaign at a time. No implied delivery if sending cannot complete.
    $db->beginTransaction();
    $job=$db->query("SELECT id,title,body,target_url FROM notification_jobs WHERE status='queued' ORDER BY id LIMIT 1 FOR UPDATE")->fetch();
    if(!$job){$db->commit();echo "No queued notifications.\n";exit(0);}
    $db->prepare("UPDATE notification_jobs SET status='failed' WHERE id=?")->execute([$job['id']]);
    $db->commit();
    $webPush=new WebPush(['VAPID'=>[
        'subject'=>'mailto:info@vweb.dev',
        'publicKey'=>$config['vapid_public_key'],'privateKey'=>$config['vapid_private_key']
    ]]);
    $webPush->setAutomaticPadding(false);
    $payload=json_encode([
        'title'=>$job['title'],'body'=>$job['body'],'url'=>$job['target_url']],
        JSON_UNESCAPED_SLASHES);
    $subs=$db->query("SELECT s.endpoint_hash,s.subscription_json FROM push_subscriptions s
      JOIN app_users u ON u.id=s.user_id WHERE s.enabled=1 AND u.status='active'
        AND u.marketing_opt_in=1 LIMIT 3000")->fetchAll();
    $queued=0;
    foreach($subs as $sub){
        try {
            $subscription=Subscription::create(json_decode($sub['subscription_json'],true));
            $webPush->queueNotification($subscription,$payload);
            $queued++;
        }catch(Throwable $e){error_log('Ignored malformed browser subscription.');}
    }
    $delivered=0;
    foreach($webPush->flush() as $report){
        if($report->isSuccess())$delivered++;
        elseif($report->isSubscriptionExpired()) {
            $hash=hash('sha256',$report->getEndpoint());
            $db->prepare('DELETE FROM push_subscriptions WHERE endpoint_hash=?')->execute([$hash]);
        }
    }
    $db->prepare("UPDATE notification_jobs SET attempted=?,delivered=?,status='sent',sent_at=UTC_TIMESTAMP() WHERE id=?")
        ->execute([$queued,$delivered,$job['id']]);
    echo "Attempted $queued subscriptions, push provider accepted $delivered.\n";
} catch(Throwable $e){
    fwrite(STDERR,"Web Push sending failed. See private server logs.\n");
    error_log('VWEB push sender: '.$e->getMessage());
    exit(1);
}
