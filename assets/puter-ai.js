'use strict';
/**
 * Standalone Puter integration for VWEB.DEV Connect.
 *
 * Deliberately independent from assets/app.js so a different PWA module
 * cannot prevent the Puter sign-in UI from booting. No credentials, secrets
 * or tokens are stored by VWEB.DEV Connect.
 */
(function () {
  const $ = (selector) => document.querySelector(selector);
  const sdkUrl = 'https://js.puter.com/v2/';
  let loadPromise = null;
  let loadTimer = null;
  let signedIn = false;

  function setStatus(title, message) {
    $('#puter-auth-label').textContent = title;
    $('#puter-auth-message').textContent = message;
  }

  function getError(err) {
    const code = err && (err.error || err.code || '');
    const msg = err && (err.msg || err.message || '') || String(err || 'Unknown error');
    if (code === 'popup_blocked') return 'Browser blocked the Puter popup. Open this site directly in Chrome or Edge and allow pop-ups.';
    if (code === 'auth_window_closed') return 'Puter sign-in was closed or cancelled. Tap Connect and try again.';
    if (code === 'unsupported_origin') return 'Puter requires a direct HTTPS site, not an embedded or sandboxed preview.';
    if (code === 'not_available_in_app') return 'Puter-hosted apps sign in automatically. Try Test AI connection.';
    return msg;
  }

  function showRetry(err) {
    setStatus('Puter connection unavailable', getError(err));
    $('#puter-signin').hidden = true;
    $('#puter-switch').hidden = true;
    $('#puter-signout').hidden = true;
    $('#puter-test').hidden = true;
    $('#puter-retry').hidden = false;
  }

  function loadPuter() {
    if (window.puter && window.puter.auth && window.puter.ai) return Promise.resolve(window.puter);
    if (loadPromise) return loadPromise;

    setStatus('Loading Puter service…', 'Checking js.puter.com. This can take a few seconds on mobile.');
    $('#puter-signin').disabled = true;
    $('#puter-retry').hidden = true;

    loadPromise = new Promise((resolve, reject) => {
      let finished = false;
      const script = document.createElement('script');
      script.src = sdkUrl;
      script.async = true;

      function done(error) {
        if (finished) return;
        finished = true;
        clearTimeout(loadTimer);
        if (error) {
          loadPromise = null;
          script.remove();
          reject(error);
        } else resolve(window.puter);
      }
      async function checkSDK() {
        for (let i = 0; i < 15; i++) {
          if (window.puter && window.puter.auth &&
              typeof window.puter.auth.signIn === 'function' && window.puter.ai) {
            done(null); return;
          }
          await new Promise((resolve) => setTimeout(resolve, 160));
        }
        done(new Error('Puter script loaded, but its SDK did not initialize. Disable blockers and retry.'));
      }
      loadTimer = setTimeout(() => done(new Error('Puter SDK timed out. Check access to js.puter.com and reload.')), 18000);
      script.onload = () => { checkSDK(); };
      script.onerror = () => done(new Error('Puter JavaScript could not load. Try Chrome and check DNS/network filters for js.puter.com.'));
      document.head.append(script);
    });
    return loadPromise;
  }

  async function refreshAuth() {
    const sdk = window.puter;
    if (!sdk || !sdk.auth) throw new Error('Puter SDK not initialized.');
    // isSignedIn() is synchronous in Puter v2; Promise.resolve supports
    // alternate compatible versions without treating Promise as "true".
    signedIn = Boolean(await Promise.resolve(sdk.auth.isSignedIn()));
    $('#puter-signin').hidden = signedIn;
    $('#puter-signin').disabled = false;
    $('#puter-switch').hidden = !signedIn;
    $('#puter-signout').hidden = !signedIn;
    $('#puter-test').hidden = !signedIn;
    $('#puter-retry').hidden = true;

    if (signedIn) {
      let username = 'Puter user';
      try {
        const user = await Promise.resolve(sdk.auth.getUser());
        username = user && (user.username || user.name) || username;
      } catch (err) {}
      setStatus('Connected: ' + username,
        'Puter sign-in is confirmed for this website. Tap Test AI connection to check actual model availability.');
    } else {
      setStatus('Puter account not connected',
        'Your puter.com login does not automatically authorize every website. Tap Connect Puter Account to authorize VWEB.DEV Connect.');
    }
    return signedIn;
  }

  function prepare() {
    loadPuter()
      .then(refreshAuth)
      .catch(showRetry);
  }

  // Direct click handler, with no await before calling signIn().
  // Critical for browser popup user activation on Android.
  function signIn(switchAccount) {
    const sdk = window.puter;
    if (!sdk || !sdk.auth) { prepare(); return; }
    setStatus('Opening official Puter login…',
      'Complete the Puter permission or login window. VWEB.DEV does not receive your password.');
    $('#puter-signin').disabled = true;
    $('#puter-switch').disabled = true;

    let promise;
    try {
      promise = sdk.auth.signIn(switchAccount ? {request_auth: true} : undefined);
    } catch (err) {
      showRetry(err);
      $('#puter-signin').disabled = false;
      $('#puter-switch').disabled = false;
      return;
    }
    Promise.resolve(promise).then(refreshAuth).catch((err) => {
      setStatus('Puter login did not finish', getError(err));
      $('#puter-signin').hidden = false;
      $('#puter-signin').disabled = false;
      $('#puter-retry').hidden = false;
    }).finally(() => {
      $('#puter-signin').disabled = false;
      $('#puter-switch').disabled = false;
    });
  }

  function aiReady() {
    if (!window.puter || !window.puter.ai || !signedIn) {
      throw new Error('Connect your Puter account above first. Login to puter.com alone is not enough to authorize this site.');
    }
    return window.puter;
  }

  function chatText(value) {
    if (typeof value === 'string') return value;
    const content = value && value.message && value.message.content;
    if (typeof content === 'string') return content;
    if (Array.isArray(content)) return content.map((x) => typeof x === 'string' ? x : x && x.text || '').join('\n');
    if (value && typeof value.text === 'string') return value.text;
    return value == null ? 'No text was returned.' : JSON.stringify(value);
  }

  // Model APIs return one completed response, rather than a live percentage.
  // Track elapsed real time and the state of each local request; never fabricate
  // remote rendering stages or guarantee that closing the tab cancels a charge.
  const aiJobs = new Map();
  const taskKinds = {
    chat: {label:'AI answer',waiting:'Waiting for the AI answer…',late:'The AI answer is taking longer than usual.'},
    image: {label:'AI image',waiting:'Waiting for the generated image…',late:'The image is taking longer than usual.'},
    video: {label:'AI video',waiting:'Waiting for Puter to return the video…',late:'Video rendering can take several minutes. Keep this tab open.'},
    caption: {label:'Social caption',waiting:'Waiting for the generated caption…',late:'The caption is taking longer than usual.'}
  };
  const tray = document.createElement('aside');
  tray.className = 'ai-job-tray';
  tray.setAttribute('aria-label','AI generation activity');
  tray.hidden = true;
  document.body.append(tray);

  function formatElapsed(seconds) {
    const n = Math.max(0, Math.floor(seconds));
    return String(Math.floor(n / 60)).padStart(2,'0') + ':' + String(n % 60).padStart(2,'0');
  }
  function duration(job) {
    return Math.round((performance.now() - job.started) / 1000);
  }
  function jobMessage(job,elapsed) {
    const messages = taskKinds[job.kind];
    if(elapsed < 10) return 'Connecting to Puter and requesting generation…';
    if(elapsed < 50) return messages.waiting;
    if(elapsed < 150) return messages.late;
    return job.kind === 'video'
      ? 'Still awaiting the Puter video response. This does not confirm progress or failure. Check your Puter allowance if the wait is excessive.'
      : 'Still waiting for Puter. The request has not returned a result or error yet.';
  }
  function createBusyPanel(job) {
    const panel = document.createElement('div');
    panel.className = 'ai-busy-panel';
    panel.setAttribute('role','status');
    const top = document.createElement('div');
    top.className = 'ai-busy-top';
    const spinner = document.createElement('span');
    spinner.className = 'ai-loader';
    spinner.setAttribute('aria-hidden','true');
    const heading = document.createElement('div');
    heading.className = 'ai-busy-heading';
    heading.textContent = 'Generating ' + taskKinds[job.kind].label.toLowerCase() + '…';
    const timer = document.createElement('span');
    timer.className = 'ai-time';
    timer.textContent = '00:00';
    timer.setAttribute('aria-label','Elapsed time');
    top.append(spinner,heading,timer);
    const track = document.createElement('div');
    track.className = 'ai-activity-track';
    track.setAttribute('role','progressbar');
    track.setAttribute('aria-label','Generation in progress; exact percentage unavailable');
    const shimmer = document.createElement('span');
    track.append(shimmer);
    const message = document.createElement('p');
    message.className = 'ai-busy-detail';
    message.textContent = jobMessage(job,0);
    message.setAttribute('aria-live','polite');
    const foot = document.createElement('small');
    foot.textContent = 'Puter has not supplied a progress percentage. Avoid resubmitting while this request is running.';
    panel.append(top,track,message,foot);
    job.ui = {timer,message,panel};
    job.output.replaceChildren(panel);
  }
  function drawTray() {
    tray.replaceChildren();
    const active = Array.from(aiJobs.values()).filter((job) => job.active);
    if(!active.length){tray.hidden=true;return;}
    tray.hidden=false;
    const title=document.createElement('div');
    title.className='ai-tray-title';
    title.textContent='✦  ' + active.length + (active.length===1?' AI generation running':' AI generations running');
    tray.append(title);
    active.forEach((job) => {
      const line=document.createElement('a');
      line.className='ai-tray-item';
      line.href='#ai';
      const label=document.createElement('span');
      label.textContent=taskKinds[job.kind].label;
      const time=document.createElement('strong');
      time.textContent=formatElapsed(duration(job))+'  ↗';
      line.append(label,time);
      line.addEventListener('click',() => {
        // On a different route, wait for hashchange to reveal the panel first.
        requestAnimationFrame(() => requestAnimationFrame(() => job.output.scrollIntoView({
          behavior: matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',
          block:'center'
        })));
      });
      tray.append(line);
    });
  }
  function updateBusy(job) {
    if(!job.active)return;
    const elapsed=duration(job);
    job.ui.timer.textContent=formatElapsed(elapsed);
    const message=jobMessage(job,elapsed);
    if(job.ui.message.textContent!==message)job.ui.message.textContent=message;
    drawTray();
  }
  function resultHeader(kind,ok,seconds,message) {
    const header=document.createElement('div');
    header.className='ai-result-state ' + (ok?'is-complete':'is-error');
    const marker=document.createElement('span');
    marker.textContent=ok?'✓':'!';
    marker.setAttribute('aria-hidden','true');
    const text=document.createElement('span');
    text.textContent=message+' · '+formatElapsed(seconds);
    header.append(marker,text);
    return header;
  }
  async function generate(kind,buttonSelector,outputSelector,executor,render) {
    const button=$(buttonSelector),out=$(outputSelector);
    if(button.disabled)return;
    let sdk;
    try{sdk=aiReady();}
    catch(err){
      out.replaceChildren(resultHeader(kind,false,0,getError(err)));
      return;
    }
    const job={kind,output:out,started:performance.now(),active:true};
    aiJobs.set(kind,job);
    button.disabled=true;button.classList.add('is-generating');button.setAttribute('aria-busy','true');
    createBusyPanel(job);
    drawTray();
    const ticker=window.setInterval(() => updateBusy(job),1000);
    try{
      // The returned Promise is the only source of generation completion.
      const result=await executor(sdk);
      const endSeconds=duration(job);
      const rendered=await render(out,result);
      out.prepend(resultHeader(kind,true,endSeconds,rendered||'Generation completed'));
    }catch(err){
      const seconds=duration(job);
      out.replaceChildren(
        resultHeader(kind,false,seconds,'Generation failed'),
        (()=>{const p=document.createElement('p');p.className='ai-error-description';p.textContent=getError(err);return p;})()
      );
    }finally{
      job.active=false;
      window.clearInterval(ticker);
      aiJobs.delete(kind);
      button.disabled=false;button.classList.remove('is-generating');button.removeAttribute('aria-busy');
      drawTray();
    }
  }
  $('#puter-test').addEventListener('click', async () => {
    const button=$('#puter-test'),status=$('#puter-auth-message');
    button.disabled=true;
    status.textContent='Testing Puter with a short AI request (may use credits)…';
    try {
      const result=await aiReady().ai.chat('Reply with the single word READY.');
      status.textContent='AI request successful: '+chatText(result).slice(0,160);
    } catch(err){
      status.textContent='AI request failed: '+getError(err);
    }finally{button.disabled=false;}
  });
  $('#ask-ai').addEventListener('click',() => {
    const prompt=$('#chat-prompt').value.trim(),out=$('#chat-result');
    if(!prompt){out.textContent='Enter a question first.';return;}
    generate('chat','#ask-ai','#chat-result',
      (sdk) => sdk.ai.chat(prompt),
      async (target,result) => {
        const p=document.createElement('div');
        p.textContent=chatText(result)||'The model returned no text.';
        target.replaceChildren(p);
        return 'AI answer ready';
      });
  });
  $('#generate-ai-image').addEventListener('click',() => {
    const prompt=$('#image-prompt').value.trim(),out=$('#image-result');
    if(!prompt){out.textContent='Describe an image first.';return;}
    generate('image','#generate-ai-image','#image-result',
      (sdk)=>sdk.ai.txt2img(prompt),
      async (target,result)=>{
        let image;
        if(result instanceof HTMLImageElement)image=result;
        else{
          const src=typeof result==='string'?result:result&&result.url;
          if(!src || !/^(https:\/\/|blob:|data:image\/)/.test(src))
            throw new Error('Puter returned an unsupported image format.');
          image=new Image();image.src=src;
        }
        image.alt='AI-generated image';
        image.classList.add('ai-media-output');
        image.loading='eager';
        target.replaceChildren(image);
        return 'Image generated';
      });
  });
  $('#generate-ai-video').addEventListener('click',() => {
    const prompt=$('#video-prompt').value.trim(),out=$('#video-result');
    if(!prompt){out.textContent='Describe a video first.';return;}
    const test=$('#video-test-mode')&&$('#video-test-mode').checked;
    generate('video','#generate-ai-video','#video-result',
      (sdk)=>{
        if(typeof sdk.ai.txt2vid!=='function')
          throw new Error('Video generation is not supported by the active Puter SDK.');
        return sdk.ai.txt2vid(prompt,test?true:undefined);
      },
      async (target,result)=>{
        let video;
        if(result instanceof HTMLVideoElement)video=result;
        else{
          const src=typeof result==='string'?result:result&&result.url;
          if(!src || !/^(https:\/\/|blob:|data:video\/)/.test(src))
            throw new Error('Puter returned an unsupported video format.');
          video=document.createElement('video');video.src=src;
        }
        video.controls=true;
        video.playsInline=true;
        video.preload='metadata';
        video.classList.add('ai-media-output');
        target.replaceChildren(video);
        const note=document.createElement('small');
        note.className='ai-media-note';
        note.textContent=test?
          'Puter test-mode sample returned. This is not a newly generated video.' :
          'Puter returned a video. Press Play; preview buffering depends on your connection.';
        target.append(note);
        video.addEventListener('error',()=>{
          note.textContent='Video returned, but your browser could not load/play it. Check connectivity and media permissions.';
        },{once:true});
        return test?'Video test sample ready':'Video generated — preview ready';
      });
  });
  $('#generate-caption').addEventListener('click',() => {
    const topic=$('#caption-topic').value.trim(),out=$('#caption-result');
    if(!topic){out.textContent='Describe your post first.';return;}
    generate('caption','#generate-caption','#caption-result',
      (sdk)=>sdk.ai.chat('Write a useful original social-media caption with a clear call to action and no invented discount for: '+topic),
      async (target,result)=>{
        const p=document.createElement('div');p.textContent=chatText(result)||'The model returned no text.';
        target.replaceChildren(p);
        return 'Caption ready';
      });
  });

  $('#puter-signin').addEventListener('click', () => signIn(false));
  $('#puter-switch').addEventListener('click', () => signIn(true));
  $('#puter-retry').addEventListener('click', prepare);
  $('#puter-signout').addEventListener('click', () => {
    try {
      Promise.resolve(window.puter.auth.signOut()).then(refreshAuth)
        .catch((err) => setStatus('Puter sign-out failed', getError(err)));
    } catch (err) { setStatus('Puter sign-out failed', getError(err)); }
  });

  function onRoute() {
    if ((location.hash || '#home').replace('#','') === 'ai') prepare();
  }
  // The script is deferred; all AI nodes exist now. This also works even if
  // assets/app.js failed to initialize other unrelated sections.
  window.addEventListener('hashchange', onRoute);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', onRoute);
  else onRoute();

  window.addEventListener('unhandledrejection', (event) => {
    if (String(event.reason && event.reason.message || '').includes('Puter')) {
      $('#puter-auth-message').textContent = getError(event.reason);
    }
  });
})();
