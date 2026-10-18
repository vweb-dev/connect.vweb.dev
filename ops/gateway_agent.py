#!/usr/bin/env python3
"""ISP-side *opt-in* guest-voucher provisioning, RouterOS v7 REST.

Only for a separately authorized and isolated guest HotSpot on the central ISP
router. It never touches existing PPPoE customer secrets or router settings.
Expected env: CONNECT_GATEWAY_API_URL, CONNECT_GATEWAY_KEY,
MIKROTIK_REST_BASE=https://private-router:port/rest,
MIKROTIK_REST_USER, MIKROTIK_REST_PASSWORD,
CONNECT_VOUCHER_KEY (private unique 32+ char seed), HOTSPOT_PROFILE (configured).
Run behind ISP VPN/private management network with valid TLS certificate.
If HotSpot is NOT installed, do not enable gateway_enabled in PHP config.
"""
import os, json, hmac, hashlib, base64, secrets, time, urllib.request, urllib.parse, ssl

def must(key):
    value=os.environ.get(key,'').strip()
    if not value:raise RuntimeError('Missing '+key)
    return value

def signed(url,key,method='GET',body=b''):
    timestamp=str(int(time.time()));nonce=secrets.token_hex(16)
    path=urllib.parse.urlsplit(url).path
    msg=(method+'\n'+path+'\n'+timestamp+'\n'+nonce+'\n').encode()+body
    signature=hmac.new(key.encode(),msg,hashlib.sha256).hexdigest()
    headers={'X-Connect-Timestamp':timestamp,'X-Connect-Nonce':nonce,
        'X-Connect-Signature':signature,'Content-Type':'application/json'}
    with urllib.request.urlopen(urllib.request.Request(url,data=body if method=='POST' else None,
        method=method,headers=headers),timeout=20) as response:
        return json.loads(response.read().decode())

def router_call(base,user,password,path,method='GET',obj=None):
    url=base.rstrip('/')+path
    auth=base64.b64encode((user+':'+password).encode()).decode()
    data=json.dumps(obj).encode() if obj is not None else None
    request=urllib.request.Request(url,data=data,method=method,
        headers={'Authorization':'Basic '+auth,'Content-Type':'application/json'})
    with urllib.request.urlopen(request,timeout=15) as result:
        raw=result.read();return json.loads(raw) if raw else {}

def main():
    url=must('CONNECT_GATEWAY_API_URL');key=must('CONNECT_GATEWAY_KEY')
    base=must('MIKROTIK_REST_BASE');user=must('MIKROTIK_REST_USER')
    password=must('MIKROTIK_REST_PASSWORD');seed=must('CONNECT_VOUCHER_KEY')
    profile=must('HOTSPOT_PROFILE')
    if not url.startswith('https://') or not base.startswith('https://'):
        raise RuntimeError('HTTPS endpoints only; keep RouterOS on private VPN.')
    if len(seed)<32:raise RuntimeError('Voucher seed must be long and private.')
    todo=signed(url,key).get('jobs',[])
    completed=[]
    for job in todo:
        ident=int(job['id']);mb=int(job['quota_mb'])
        if ident<=0 or mb<=0 or mb>1024:continue
        name='vw'+str(ident)
        digest=hmac.new(seed.encode(),str(ident).encode(),hashlib.sha256).hexdigest()
        code=digest[:18].upper()   # deterministic retry-safe secret
        try:
            all_users=router_call(base,user,password,'/ip/hotspot/user')
            existing=next((x for x in all_users if x.get('name')==name),None)
            if not existing:
                router_call(base,user,password,'/ip/hotspot/user','PUT',{
                    'name':name,'password':code,'profile':profile,
                    'limit-bytes-total':str(mb*1024*1024),'comment':'VWEB Connect voucher '+str(ident)})
            completed.append({'id':ident,'voucher_code':name+':'+code})
        except Exception as exc:
            # Never acknowledge provisioning on failed router operations.
            print('Job provisioning unsuccessful:',ident,type(exc).__name__)
    # The API voucher code currently expects /^[A-Za-z0-9_-]+$/, so don't
    # acknowledge a compound string until your gateway display scheme is
    # configured to handle issued credentials correctly. Enable after testing.
    for entry in completed:
        entry['voucher_code']=entry['voucher_code'].replace(':','-')
    if completed:
        response=signed(url,key,'POST',json.dumps({'completed':completed},separators=(',',':')).encode())
        print('Acknowledged',response.get('issued',0),'voucher(s)')
    else: print('No guest voucher operations completed.')

if __name__=='__main__':
    main()
