<?php
declare(strict_types=1);
require __DIR__.'/_member.php';
member_session();
header('Cache-Control: no-store');
try {
    $db=connect_db();
    if ($_SERVER['REQUEST_METHOD']==='GET') {
        $user=member_id()?member_user($db,member_id()):null;
        if (member_id() && (!$user || $user['status']!=='active')) {$_SESSION=[];$user=null;}
        connect_json(['ok'=>true,'csrf'=>member_csrf(),'user'=>$user]);
    }
    $data=member_post();$action=(string)($data['action']??'');
    if ($action==='logout') {
        $_SESSION=[];
        session_regenerate_id(true);
        connect_json(['ok'=>true,'csrf'=>member_csrf()]);
    }
    if ($action==='register') {
        $name=trim((string)($data['name']??''));
        $email=strtolower(trim((string)($data['email']??'')));
        $password=(string)($data['password']??'');
        if (mb_strlen($name)<2 || mb_strlen($name)>100 || !filter_var($email,FILTER_VALIDATE_EMAIL)
            || strlen($email)>190 || strlen($password)<12 || strlen($password)>72)
            connect_json(['ok'=>false,'message'=>'Provide your name, valid email and a password of 12–72 characters.'],422);
        // Existing accounts cannot be taken over through registration.
        $stmt=$db->prepare('SELECT id FROM app_users WHERE email=?');
        $stmt->execute([$email]);
        if ($stmt->fetch()) connect_json(['ok'=>false,'message'=>'Account already exists. Sign in instead.'],409);
        $stmt=$db->prepare('INSERT INTO app_users(name,email,password_hash,marketing_opt_in) VALUES(?,?,?,?)');
        $stmt->execute([$name,$email,password_hash($password,PASSWORD_DEFAULT),!empty($data['marketing_opt_in'])?1:0]);
        session_regenerate_id(true);
        $_SESSION['member_id']=(int)$db->lastInsertId();
        connect_json(['ok'=>true,'user'=>member_user($db,member_id())]);
    }
    if ($action==='login') {
        $email=strtolower(trim((string)($data['email']??'')));
        $password=(string)($data['password']??'');
        $fails=(int)($_SESSION['login_failures']??0);
        if ($fails>=6 && time()<(int)($_SESSION['lock_until']??0))
            connect_json(['ok'=>false,'message'=>'Too many attempts. Try again later.'],429);
        $stmt=$db->prepare('SELECT id,password_hash,status FROM app_users WHERE email=? LIMIT 1');$stmt->execute([$email]);$row=$stmt->fetch();
        if (!$row || !password_verify($password,$row['password_hash']) || $row['status']!=='active') {
            $_SESSION['login_failures']=$fails+1;
            if($_SESSION['login_failures']>=6)$_SESSION['lock_until']=time()+900;
            usleep(300000);
            connect_json(['ok'=>false,'message'=>'Invalid sign-in details.'],401);
        }
        session_regenerate_id(true);
        unset($_SESSION['login_failures'],$_SESSION['lock_until']);
        $_SESSION['member_id']=(int)$row['id'];
        $db->prepare('UPDATE app_users SET last_login_at=UTC_TIMESTAMP() WHERE id=?')->execute([member_id()]);
        connect_json(['ok'=>true,'user'=>member_user($db,member_id())]);
    }
    $id=member_required();
    $current=member_user($db,$id);
    if (!$current || $current['status']!=='active') connect_json(['ok'=>false,'message'=>'Account not active.'],403);
    if ($action==='prefs') {
        $optin=!empty($data['marketing_opt_in'])?1:0;
        $db->prepare('UPDATE app_users SET marketing_opt_in=? WHERE id=?')->execute([$optin,$id]);
        connect_json(['ok'=>true,'user'=>member_user($db,$id)]);
    }
    if ($action==='link_isp') {
        $username=trim((string)($data['pppoe_username']??''));
        if (!preg_match('/^[A-Za-z0-9@._:-]{3,190}$/D',$username))
            connect_json(['ok'=>false,'message'=>'Enter a valid PPPoE username. Do not enter its password.'],422);
        $stmt=$db->prepare('SELECT COUNT(*) FROM isp_account_links WHERE user_id=? AND status=?');$stmt->execute([$id,'pending']);
        if ((int)$stmt->fetchColumn()>=2)connect_json(['ok'=>false,'message'=>'You have pending account requests.'],429);
        // A username claim NEVER discloses traffic until ISP staff verify ownership independently.
        $stmt=$db->prepare("INSERT INTO isp_account_links(user_id,pppoe_username,status) VALUES(?,?,'pending')
          ON DUPLICATE KEY UPDATE status=IF(status='approved','approved','pending'),reviewer_note=IF(status='approved',reviewer_note,'')");
        $stmt->execute([$id,$username]);connect_json(['ok'=>true,'message'=>'Verification request submitted. ISP staff must confirm account ownership.']);
    }
    if ($action==='merchant') {
        $name=trim((string)($data['business_name']??''));$title=trim((string)($data['offer_title']??''));
        $description=trim((string)($data['description']??''));$url=trim((string)($data['website']??''));
        if (mb_strlen($name)<2||mb_strlen($name)>140||mb_strlen($title)<4||mb_strlen($title)>180
            ||mb_strlen($description)<10||mb_strlen($description)>1800||!connect_safe_url($url))
            connect_json(['ok'=>false,'message'=>'Provide business, offer details and a public HTTPS website.'],422);
        $stmt=$db->prepare('INSERT INTO merchant_submissions(user_id,business_name,offer_title,description,website) VALUES(?,?,?,?,?)');
        $stmt->execute([$id,$name,$title,$description,$url]);
        connect_json(['ok'=>true,'message'=>'Submitted for editorial review.']);
    }
    if ($action==='support') {
        $subject=trim((string)($data['subject']??''));$message=trim((string)($data['message']??''));
        if (mb_strlen($subject)<4||mb_strlen($subject)>180||mb_strlen($message)<10||mb_strlen($message)>2000)
            connect_json(['ok'=>false,'message'=>'Please provide a subject and a meaningful message.'],422);
        $stmt=$db->prepare("SELECT COUNT(*) FROM support_tickets WHERE user_id=? AND status='open'");
        $stmt->execute([$id]);if((int)$stmt->fetchColumn()>=5)connect_json(['ok'=>false,'message'=>'Resolve existing support requests first.'],429);
        $stmt=$db->prepare('INSERT INTO support_tickets(user_id,subject,message) VALUES(?,?,?)');
        $stmt->execute([$id,$subject,$message]);connect_json(['ok'=>true,'message'=>'Support request created.']);
    }
    connect_json(['ok'=>false,'message'=>'Unsupported action.'],422);
} catch (Throwable $e) {member_fail($e);}
