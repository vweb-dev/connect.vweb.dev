#!/usr/bin/env python3
"""Read-only MikroTik/FreeRADIUS account reporter.

Runs on an *existing ISP-controlled host*, not Hostinger or customer routers.
Install free dependency: python3 -m pip install -r requirements.txt
Set environment variables via an OS-protected file or service config:
RADIUS_DB_HOST, RADIUS_DB_USER, RADIUS_DB_PASSWORD, RADIUS_DB_NAME,
CONNECT_API_URL=https://connect.vweb.dev/api/isp-sync.php,
CONNECT_SYNC_KEY=<long private secret>,
CONNECT_TARGETS_URL=https://connect.vweb.dev/api/isp-targets.php.

Default radacct query is an ESTIMATE for sessions starting during current UTC
month; it is not authoritative usage if sessions span billing periods.
Never expose router, PPPoE or RADIUS credentials in PWA or Git.
"""
import os, json, time, hmac, hashlib, secrets, datetime
import urllib.request
from decimal import Decimal

def required(name):
    value = os.environ.get(name, '').strip()
    if not value:
        raise RuntimeError(f"Missing private environment variable: {name}")
    return value

def signed_post(url, key, payload):
    body=json.dumps(payload,separators=(',',':'),ensure_ascii=False).encode('utf-8')
    timestamp=str(int(time.time()))
    nonce=secrets.token_hex(16)
    from urllib.parse import urlsplit
    path=urlsplit(url).path
    data=b'POST\n'+path.encode()+b'\n'+timestamp.encode()+b'\n'+nonce.encode()+b'\n'+body
    signature=hmac.new(key.encode(),data,hashlib.sha256).hexdigest()
    headers={'Content-Type':'application/json','X-Connect-Timestamp':timestamp,
        'X-Connect-Nonce':nonce,'X-Connect-Signature':signature}
    req=urllib.request.Request(url,data=body,headers=headers,method='POST')
    with urllib.request.urlopen(req,timeout=20) as response:
        return json.loads(response.read().decode('utf-8'))

def main():
    import pymysql
    url=required('CONNECT_API_URL')
    key=required('CONNECT_SYNC_KEY')
    if not url.startswith('https://'):
        raise RuntimeError('HTTPS required for sync.')
    target_url=required('CONNECT_TARGETS_URL')
    from urllib.parse import urlsplit
    ts=str(int(time.time()));nonce=secrets.token_hex(16)
    path=urlsplit(target_url).path
    signature=hmac.new(key.encode(),('GET\n'+path+'\n'+ts+'\n'+nonce+'\n').encode(),hashlib.sha256).hexdigest()
    with urllib.request.urlopen(urllib.request.Request(target_url,headers={
        'X-Connect-Timestamp':ts,'X-Connect-Nonce':nonce,'X-Connect-Signature':signature}),timeout=20) as response:
        targets=json.loads(response.read().decode('utf-8'))
    if not targets.get('ok'):raise RuntimeError('Approved account lookup rejected.')
    usernames=list(dict.fromkeys(str(s) for s in targets.get('usernames',[]) if isinstance(s,str)))
    if not usernames:
        print('No approved subscriber links to synchronize.');return
    if len(usernames)>2000:raise RuntimeError('Too many authorized subscriber names.')
    db=pymysql.connect(
        host=required('RADIUS_DB_HOST'),port=int(os.getenv('RADIUS_DB_PORT','3306')),
        user=required('RADIUS_DB_USER'),password=required('RADIUS_DB_PASSWORD'),
        database=required('RADIUS_DB_NAME'),charset='utf8mb4',
        cursorclass=pymysql.cursors.DictCursor,connect_timeout=10,read_timeout=20)
    try:
        with db.cursor() as cur:
            # FreeRADIUS default radacct columns. Check schema first. NAS
            # input bytes = subscriber upload; NAS output = subscriber download.
            # No live MikroTik sessions are modified.
            placeholders=','.join(['%s']*len(usernames))
            cur.execute("""
            SELECT username,
             MAX(CASE WHEN acctstoptime IS NULL THEN 1 ELSE 0 END) AS is_online,
             MAX(CASE WHEN acctstoptime IS NULL THEN acctsessiontime ELSE NULL END) AS session_uptime_seconds,
             SUM(CASE WHEN acctstoptime IS NULL THEN COALESCE(acctoutputoctets,0) ELSE 0 END) AS session_download_bytes,
             SUM(CASE WHEN acctstoptime IS NULL THEN COALESCE(acctinputoctets,0) ELSE 0 END) AS session_upload_bytes,
             SUM(CASE WHEN acctstarttime >= DATE_FORMAT(UTC_TIMESTAMP(),'%Y-%m-01')
               THEN COALESCE(acctoutputoctets,0) ELSE 0 END) AS reported_download_bytes,
             SUM(CASE WHEN acctstarttime >= DATE_FORMAT(UTC_TIMESTAMP(),'%Y-%m-01')
               THEN COALESCE(acctinputoctets,0) ELSE 0 END) AS reported_upload_bytes
            FROM radacct WHERE username IN ("""+placeholders+""")
              AND (acctstarttime >= DATE_SUB(UTC_TIMESTAMP(),INTERVAL 40 DAY)
                OR acctstoptime IS NULL)
              GROUP BY username
            """, usernames)
            rows=cur.fetchall()
        period=datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m')
        accounts=[]
        for row in rows:
            name=str(row.get('username') or '')
            if not name: continue
            def number(k):
                value=row.get(k)
                return max(0,int(value)) if isinstance(value,(int,float,Decimal)) else None
            accounts.append({
                'username':name,'is_online':bool(row.get('is_online')),
                'session_uptime_seconds':number('session_uptime_seconds'),
                'session_download_bytes':number('session_download_bytes'),
                'session_upload_bytes':number('session_upload_bytes'),
                'reported_download_bytes':number('reported_download_bytes'),
                'reported_upload_bytes':number('reported_upload_bytes'),
                'reported_period':period,'reported_basis':'session_start_estimate',
                'plan_name':None,'renewal_date':None})
        for i in range(0,len(accounts),250):
            report=signed_post(url,key,{'accounts':accounts[i:i+250]})
            if not report.get('ok'):
                raise RuntimeError('Remote sync rejected.')
        print(f"Synced {len(accounts)} anonymized-to-public (private API) records; only linked users can view them.")
    finally:
        db.close()

if __name__=='__main__':
    main()
