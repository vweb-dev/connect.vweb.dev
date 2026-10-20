import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const html=read('index.html'),app=read('assets/app.js'),hub=read('assets/hub.js'),
 media=read('assets/entertainment.js'),admin=read('admin/operations.php'),
 privacy=read('privacy.html'),sw=read('sw.js'),schema=read('db/community.sql');
test('Free Internet and rewards are absent from public navigation and markup',()=>{
 for(const section of ['internet','rewards']){
  assert.ok(!html.includes('id="page-'+section+'"'));
  assert.ok(!html.includes('href="#'+section+'"'));
  assert.ok(!app.includes("connectGet('"+section+".php')"));
 }
 assert.ok(html.includes('id="page-account"'));
 assert.ok(html.includes('id="page-dashboard"'));
 assert.ok(!html.includes('PPPoE'));
});
test('retired network and rewards API paths short circuit without DB calls',()=>{
 for(const path of ['api/rewards.php','api/dashboard.php','api/isp-sync.php','api/isp-targets.php','api/gateway.php']){
  const source=read(path);
  assert.match(source,/http_response_code\(410\)/);
  assert.doesNotMatch(source,/connect_db\(/);
 }
 assert.doesNotMatch(read('api/member.php'),/if \(\$action==='link_isp'\)/);
 assert.match(read('api/member-tickets.php'),/member_required\(\)/);
});
test('anonymous visitors do not initiate optional PHP calls',()=>{
 assert.ok(app.includes('loadPublishedWhenNeeded'));
 assert.ok(app.includes("destination==='offers'||destination==='community'")||
           app.includes("section==='offers'||section==='community'"));
 assert.ok(!media.includes('openDiscoveryWhenNeeded'));
 assert.ok(!media.includes('data/entertainment.json'));
 assert.ok(!html.includes('id="page-watch"')&&!html.includes('id="page-discover"'));
 assert.ok(html.includes('id="page-play"'));
 assert.ok(app.includes('openAccountIfRequested'));
 assert.ok(app.includes("location.hash==='#account'"));
 assert.ok(!app.includes('loadRewards();'));
 assert.ok(!app.includes('loadDashboard();'));
});
test('mobile app directory paginates and filters by kind',()=>{
 for(const id of ['hub-app-kind','hub-app-sort','hub-app-search','hub-app-more','hub-app-reset'])
  assert.ok(html.includes('id="'+id+'"'));
 assert.match(hub,/appLimit=12/);
 assert.match(hub,/appLimit\+=12/);
 assert.match(hub,/appKind==='All'/);
 assert.match(hub,/appSort==='az'/);
 assert.match(hub,/hub-search-suggestions|data-hub-search/);
});
test('community admin preserves support, merchant and optional notifications',()=>{
 assert.match(admin,/Community & member operations/);
 assert.match(admin,/merchant_status/);
 assert.match(admin,/ticket_resolve/);
 assert.match(admin,/create_notification/);
 assert.doesNotMatch(admin,/approve_link|create_task|toggle_task|quota_mb/);
 for(const table of ['app_users','support_tickets','merchant_submissions','notification_jobs'])
  assert.ok(schema.includes('CREATE TABLE IF NOT EXISTS '+table));
 assert.doesNotMatch(schema,/CREATE TABLE IF NOT EXISTS (?:reward_tasks|isp_accounts|gateway_jobs)/);
 assert.match(privacy,/Retired Internet and Rewards features/);
});
test('cache invalidated and updated assets remain static',()=>{
 assert.match(sw,/vweb-connect-static-v23/);
 assert.match(html,/hub\.js\?v=(?:connect20-focus-|(?:tools-(?:recovery|fix|tabs)-|(?:connect-refresh-|(?:connect-focus-|connect-activation-))))/);
 assert.match(read('.github/workflows/checks.yml'),/tests\/focus\.test\.mjs/);
});
