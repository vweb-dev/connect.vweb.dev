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

  function bind(id, fn) {
    const button = $(id);
    button.addEventListener('click', async () => {
      button.disabled = true;
      try { await fn(); }
      finally { button.disabled = false; }
    });
  }

  bind('#puter-test', async () => {
    const status = $('#puter-auth-message');
    status.textContent = 'Testing with a tiny AI request. This may count toward Puter usage…';
    try {
      const result = await aiReady().ai.chat('Reply with the single word READY.');
      status.textContent = 'AI request successful: ' + chatText(result).slice(0,160);
    } catch (err) {
      status.textContent = 'Puter signed in, but AI request failed: ' + getError(err) +
        '. Check model access, allowance/credits and network connectivity.';
    }
  });

  bind('#ask-ai', async () => {
    const prompt = $('#chat-prompt').value.trim();
    const out = $('#chat-result');
    if (!prompt) { out.textContent = 'Enter a question first.'; return; }
    try {
      out.textContent = 'Generating answer through Puter…';
      out.textContent = chatText(await aiReady().ai.chat(prompt)) || 'No response returned.';
    } catch (err) { out.textContent = 'Cannot generate: ' + getError(err); }
  });

  bind('#generate-ai-image', async () => {
    const prompt = $('#image-prompt').value.trim();
    const out = $('#image-result');
    if (!prompt) { out.textContent = 'Describe an image first.'; return; }
    try {
      out.textContent = 'Generating image through Puter…';
      const result = await aiReady().ai.txt2img(prompt);
      out.replaceChildren();
      if (result instanceof HTMLImageElement) {
        result.alt = 'AI-generated image';
        out.append(result);
      } else if (typeof result === 'string' && /^(https:\/\/|data:image\/)/.test(result)) {
        const img = new Image(); img.alt = 'AI-generated image'; img.src = result; out.append(img);
      } else if (result && typeof result.url === 'string') {
        const img = new Image(); img.alt = 'AI-generated image'; img.src = result.url; out.append(img);
      } else throw new Error('Unexpected image response format.');
    } catch (err) { out.textContent = 'Cannot generate image: ' + getError(err); }
  });

  bind('#generate-ai-video', async () => {
    const prompt = $('#video-prompt').value.trim();
    const out = $('#video-result');
    if (!prompt) { out.textContent = 'Describe a video first.'; return; }
    try {
      out.textContent = 'Generating video through Puter (availability and credits vary)…';
      const sdk = aiReady();
      if (typeof sdk.ai.txt2vid !== 'function') throw new Error('Video generation is not supported by this Puter SDK.');
      const result = await sdk.ai.txt2vid(prompt);
      out.replaceChildren();
      if (result instanceof HTMLVideoElement) { result.controls = true; out.append(result); }
      else {
        const url = typeof result === 'string' ? result : result && result.url;
        if (!url || !/^https:\/\//.test(url)) throw new Error('Video response format is unavailable.');
        const video = document.createElement('video');video.controls=true;video.playsInline=true;
        video.src=url;video.style.maxWidth='100%';out.append(video);
      }
    } catch (err) { out.textContent = 'Cannot generate video: ' + getError(err); }
  });

  bind('#generate-caption', async () => {
    const topic = $('#caption-topic').value.trim();
    const out = $('#caption-result');
    if (!topic) { out.textContent = 'Describe your post first.'; return; }
    try {
      out.textContent = 'Writing a caption through Puter…';
      out.textContent = chatText(await aiReady().ai.chat(
        'Write a useful original social-media caption with a clear call to action and no invented discount for: ' + topic));
    } catch (err) { out.textContent = 'Cannot generate caption: ' + getError(err); }
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
