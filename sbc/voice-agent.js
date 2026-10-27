/* Shantiban City - assistant panel for the mascot (chat + voice).
   The mascot button (app layout chunk) dispatches "shantiban:voice-toggle" on
   click. The panel opens in chat mode: typed questions go to /api/chat and the
   reply streams back. The mic button starts a voice conversation through
   /api/voice-token + LiveKit with the "shantiban-agent" voice agent. Both reply
   in Bengali, Hindi or English to match the visitor. */
(function () {
  if (window.__sbcVoiceAgent) return;
  window.__sbcVoiceAgent = true;

  var CLIENT_SRC = 'https://cdn.jsdelivr.net/npm/livekit-client@2.22.4/dist/livekit-client.umd.js';
  var GREETING = 'Namaskar! Ask me anything about Shantiban City — in বাংলা, हिन्दी or English. ' +
    'Type below, or tap the mic to talk.';
  var STATES = {
    connecting: 'Connecting…',
    initializing: 'Getting ready…',
    listening: 'Listening — speak now',
    thinking: 'Thinking…',
    speaking: 'Speaking…'
  };

  var panel, logEl, form, input, sendBtn, micBtn, voiceBar, voiceText, muteBtn, retryBtn;
  var history = [], chatBusy = false;
  var room = null, clientPromise = null, voiceId = 0, muted = false, segments = {}, readyTimer = null;
  var AGENT_READY_MS = 20000;
  var VOICE_DOWN = 'Voice is not available right now. You can still type below.';

  /* ---------- panel ---------- */

  function injectStyles() {
    var css =
      '.sbc-va{--va-paper:var(--color-paper,#faf7f0);--va-ink:var(--color-green-950,#10261a);' +
      '--va-soft:var(--color-ink-soft,#5b6b60);--va-green:#1f4e33;--va-gold:#c29b45;' +
      'position:fixed;right:16px;bottom:224px;z-index:103;width:min(360px,calc(100vw - 32px));' +
      'display:flex;flex-direction:column;max-height:calc(100vh - 320px);min-height:min(300px,calc(100vh - 320px));' +
      'background:var(--va-paper);color:var(--va-ink);border-radius:18px;' +
      'box-shadow:0 18px 48px -18px rgba(15,26,18,.45),0 0 0 1px rgba(31,78,51,.12);' +
      'font-family:var(--font-sans,system-ui,sans-serif);overflow:hidden;' +
      'opacity:0;transform:translateY(12px) scale(.98);pointer-events:none;' +
      'transition:opacity .25s ease,transform .25s ease}' +
      '@media (min-width:768px){.sbc-va{right:24px;bottom:200px;max-height:calc(100vh - 300px)}}' +
      '.sbc-va.is-open{opacity:1;transform:none;pointer-events:auto}' +
      '.sbc-va__head{flex:none;display:flex;align-items:flex-start;gap:12px;padding:14px 16px 12px;' +
      'background:var(--va-green);color:#fff}' +
      '.sbc-va__title{margin:0;font-family:var(--font-bodoni,Georgia,serif);font-size:18px;line-height:1.2}' +
      '.sbc-va__sub{margin:4px 0 0;font-size:12px;opacity:.85}' +
      '.sbc-va__x{margin-left:auto;flex:none;width:32px;height:32px;border:0;border-radius:50%;' +
      'background:rgba(255,255,255,.14);color:#fff;font-size:18px;line-height:32px;cursor:pointer}' +
      '.sbc-va__x:hover{background:rgba(255,255,255,.26)}' +
      '.sbc-va__log{flex:1 1 auto;min-height:120px;max-height:320px;overflow-y:auto;padding:12px 16px;' +
      'display:flex;flex-direction:column;gap:8px}' +
      '.sbc-va__msg{margin:0;font-size:14px;line-height:1.45;padding:8px 11px;border-radius:12px;max-width:88%;' +
      'white-space:pre-wrap;overflow-wrap:anywhere}' +
      '.sbc-va__msg--you{align-self:flex-end;background:var(--va-green);color:#fff;border-bottom-right-radius:4px}' +
      '.sbc-va__msg--agent{align-self:flex-start;background:#fff;box-shadow:0 0 0 1px rgba(31,78,51,.1);' +
      'border-bottom-left-radius:4px}' +
      '.sbc-va__msg--error{color:#912018;background:#fdf1f0;box-shadow:0 0 0 1px rgba(180,35,24,.18)}' +
      '.sbc-va__typing::after{content:"•••";letter-spacing:2px;animation:sbc-va-blink 1s ease-in-out infinite}' +
      '.sbc-va__voice{flex:none;display:flex;align-items:center;gap:10px;padding:10px 16px;font-size:13px;' +
      'font-weight:500;border-top:1px solid rgba(31,78,51,.1);background:rgba(31,78,51,.04)}' +
      '.sbc-va__voice[hidden]{display:none}' +
      '.sbc-va__vtext{flex:1;min-width:0}' +
      '.sbc-va__dot{flex:none;width:10px;height:10px;border-radius:50%;background:var(--va-gold)}' +
      '.sbc-va[data-voice=listening] .sbc-va__dot{background:#2f8f5b;animation:sbc-va-pulse 1.4s ease-in-out infinite}' +
      '.sbc-va[data-voice=speaking] .sbc-va__dot{background:var(--va-green);animation:sbc-va-pulse .7s ease-in-out infinite}' +
      '.sbc-va[data-voice=thinking] .sbc-va__dot,.sbc-va[data-voice=connecting] .sbc-va__dot,' +
      '.sbc-va[data-voice=initializing] .sbc-va__dot{animation:sbc-va-blink 1s ease-in-out infinite}' +
      '.sbc-va[data-voice=error] .sbc-va__dot{background:#b42318}' +
      '@keyframes sbc-va-pulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.45);opacity:.55}}' +
      '@keyframes sbc-va-blink{0%,100%{opacity:1}50%{opacity:.3}}' +
      '@media (prefers-reduced-motion:reduce){.sbc-va,.sbc-va *{animation:none!important;transition:none!important}}' +
      '.sbc-va__chip{flex:none;min-height:32px;padding:0 12px;border-radius:999px;font:inherit;font-size:12px;' +
      'font-weight:500;cursor:pointer;border:1px solid rgba(31,78,51,.25);background:#fff;color:var(--va-ink)}' +
      '.sbc-va__chip[hidden]{display:none}' +
      '.sbc-va__chip--end{background:#b42318;border-color:#b42318;color:#fff}' +
      '.sbc-va__chip[aria-pressed=true]{background:var(--va-gold);border-color:var(--va-gold);color:#fff}' +
      '.sbc-va__form{flex:none;display:flex;align-items:center;gap:8px;padding:10px 12px 12px;' +
      'border-top:1px solid rgba(31,78,51,.1)}' +
      '.sbc-va__input{flex:1;min-width:0;height:44px;padding:0 14px;border-radius:999px;' +
      'border:1px solid rgba(31,78,51,.2);background:#fff;color:var(--va-ink);font:inherit;font-size:14px}' +
      '.sbc-va__input:focus{outline:2px solid var(--va-gold);outline-offset:1px;border-color:transparent}' +
      '.sbc-va__icon{flex:none;width:44px;height:44px;border-radius:50%;border:0;cursor:pointer;' +
      'display:grid;place-items:center;background:var(--va-green);color:#fff}' +
      '.sbc-va__icon:disabled{opacity:.45;cursor:default}' +
      '.sbc-va__icon--mic{background:#fff;color:var(--va-green);box-shadow:inset 0 0 0 1px rgba(31,78,51,.25)}' +
      '.sbc-va__icon--mic[aria-pressed=true]{background:var(--va-gold);color:#fff;box-shadow:none}' +
      '.sbc-va__icon svg{width:20px;height:20px}' +
      '.sbc-va button:focus-visible{outline:2px solid var(--va-gold);outline-offset:2px}';
    var style = document.createElement('style');
    style.id = 'sbc-voice-agent-css';
    style.textContent = css;
    document.head.appendChild(style);
  }

  var ICON_SEND = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" ' +
    'stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  var ICON_MIC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" ' +
    'stroke-linejoin="round" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/>' +
    '<path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>';

  function build() {
    injectStyles();
    panel = document.createElement('section');
    panel.className = 'sbc-va';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Shantiban City assistant');
    panel.hidden = true;
    panel.innerHTML =
      '<div class="sbc-va__head"><div>' +
      '<p class="sbc-va__title">Shantiban City Assistant</p>' +
      '<p class="sbc-va__sub">Chat or talk in বাংলা, हिन्दी or English</p></div>' +
      '<button type="button" class="sbc-va__x" aria-label="Close assistant">×</button></div>' +
      '<div class="sbc-va__log" aria-live="polite"></div>' +
      '<div class="sbc-va__voice" hidden><span class="sbc-va__dot" aria-hidden="true"></span>' +
      '<span class="sbc-va__vtext" aria-live="polite"></span>' +
      '<button type="button" class="sbc-va__chip sbc-va__mute" aria-pressed="false">Mute</button>' +
      '<button type="button" class="sbc-va__chip sbc-va__retry" hidden>Try again</button>' +
      '<button type="button" class="sbc-va__chip sbc-va__chip--end">End voice</button></div>' +
      '<form class="sbc-va__form">' +
      '<input class="sbc-va__input" type="text" name="q" autocomplete="off" maxlength="1000" ' +
      'placeholder="Type your question…" aria-label="Type your question">' +
      '<button type="submit" class="sbc-va__icon" aria-label="Send">' + ICON_SEND + '</button>' +
      '<button type="button" class="sbc-va__icon sbc-va__icon--mic" aria-pressed="false" ' +
      'aria-label="Talk to the assistant">' + ICON_MIC + '</button></form>';
    document.body.appendChild(panel);

    logEl = panel.querySelector('.sbc-va__log');
    form = panel.querySelector('.sbc-va__form');
    input = panel.querySelector('.sbc-va__input');
    sendBtn = panel.querySelector('button[type=submit]');
    micBtn = panel.querySelector('.sbc-va__icon--mic');
    voiceBar = panel.querySelector('.sbc-va__voice');
    voiceText = panel.querySelector('.sbc-va__vtext');
    muteBtn = panel.querySelector('.sbc-va__mute');
    retryBtn = panel.querySelector('.sbc-va__retry');

    panel.querySelector('.sbc-va__x').addEventListener('click', close);
    panel.querySelector('.sbc-va__chip--end').addEventListener('click', stopVoice);
    muteBtn.addEventListener('click', toggleMute);
    retryBtn.addEventListener('click', startVoice);
    micBtn.addEventListener('click', function () {
      if (room || !voiceBar.hidden) stopVoice();
      else startVoice();
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      sendChat(input.value);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isOpen()) close();
    });

    addMessage('agent', GREETING);
  }

  function isOpen() {
    return panel && panel.classList.contains('is-open');
  }

  function open() {
    if (!panel) build();
    panel.hidden = false;
    requestAnimationFrame(function () {
      panel.classList.add('is-open');
      input.focus({ preventScroll: true });
    });
  }

  function close() {
    stopVoice();
    if (!panel) return;
    panel.classList.remove('is-open');
    setTimeout(function () { if (!isOpen()) panel.hidden = true; }, 260);
  }

  function addMessage(who, text) {
    var p = document.createElement('p');
    p.className = 'sbc-va__msg sbc-va__msg--' + who;
    p.textContent = text || '';
    logEl.appendChild(p);
    while (logEl.children.length > 40) logEl.removeChild(logEl.firstChild);
    logEl.scrollTop = logEl.scrollHeight;
    return p;
  }

  /* ---------- chat ---------- */

  function sendChat(text) {
    text = (text || '').trim();
    if (!text || chatBusy) return;
    chatBusy = true;
    sendBtn.disabled = true;
    input.value = '';
    addMessage('you', text);
    history.push({ role: 'user', content: text });

    var bubble = addMessage('agent', '');
    bubble.classList.add('sbc-va__typing');
    var reply = '';

    fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: history.slice(-12) })
    })
      .then(function (res) {
        if (!res.ok) {
          return res.json().catch(function () { return {}; }).then(function (j) {
            throw new Error(j.error || 'The assistant is not available right now.');
          });
        }
        var reader = res.body.getReader();
        var decoder = new TextDecoder();
        function read() {
          return reader.read().then(function (r) {
            if (r.done) return;
            reply += decoder.decode(r.value, { stream: true });
            bubble.classList.remove('sbc-va__typing');
            bubble.textContent = reply;
            logEl.scrollTop = logEl.scrollHeight;
            return read();
          });
        }
        return read();
      })
      .then(function () {
        if (!reply.trim()) throw new Error('Sorry, I could not answer that. Please try again.');
        history.push({ role: 'assistant', content: reply.trim() });
      })
      .catch(function (err) {
        history.pop();
        bubble.classList.remove('sbc-va__typing');
        bubble.classList.add('sbc-va__msg--error');
        bubble.textContent = err && err.message && !/fetch|network/i.test(err.message)
          ? err.message
          : 'Could not reach the assistant. Please check your connection and try again.';
      })
      .then(function () {
        chatBusy = false;
        sendBtn.disabled = false;
      });
  }

  /* ---------- voice ---------- */

  function loadClient() {
    if (window.LivekitClient) return Promise.resolve(window.LivekitClient);
    if (!clientPromise) {
      clientPromise = new Promise(function (resolve, reject) {
        var s = document.createElement('script');
        s.src = CLIENT_SRC;
        s.async = true;
        s.onload = function () { resolve(window.LivekitClient); };
        s.onerror = function () { clientPromise = null; reject(new Error('client load failed')); };
        document.head.appendChild(s);
      });
    }
    return clientPromise;
  }

  function setVoice(state, text) {
    var failed = state === 'error';
    panel.setAttribute('data-voice', state);
    voiceBar.hidden = false;
    voiceText.textContent = text || STATES[state] || '';
    muteBtn.hidden = failed;
    retryBtn.hidden = !failed;
    micBtn.setAttribute('aria-pressed', 'true');
  }

  function disconnectRoom() {
    clearTimeout(readyTimer);
    if (room) {
      room.disconnect();
      room = null;
    }
    document.querySelectorAll('audio[data-sbc-va]').forEach(function (el) { el.remove(); });
  }

  function stopVoice() {
    voiceId++;
    disconnectRoom();
    if (!panel) return;
    voiceBar.hidden = true;
    panel.removeAttribute('data-voice');
    micBtn.setAttribute('aria-pressed', 'false');
  }

  function voiceFail(message) {
    disconnectRoom();
    setVoice('error', message);
  }

  function toggleMute() {
    if (!room) return;
    muted = !muted;
    room.localParticipant.setMicrophoneEnabled(!muted);
    muteBtn.setAttribute('aria-pressed', String(muted));
    muteBtn.textContent = muted ? 'Unmute' : 'Mute';
  }

  function startVoice() {
    var id = ++voiceId;
    disconnectRoom();
    muted = false;
    muteBtn.setAttribute('aria-pressed', 'false');
    muteBtn.textContent = 'Mute';
    setVoice('connecting');
    var details;
    fetch('/api/voice-token', { method: 'POST' })
      .then(function (res) {
        if (!res.ok) throw new Error('token ' + res.status);
        return res.json();
      })
      .then(function (d) {
        details = d;
        return loadClient();
      })
      .then(function (LK) {
        if (id !== voiceId) return;
        room = new LK.Room({ adaptiveStream: true, dynacast: true });
        wireRoom(LK, room, id);
        return room.connect(details.serverUrl, details.participantToken).then(function () {
          if (id !== voiceId) return;
          setVoice('initializing');
          // If the agent never becomes ready (crashed or not running), don't leave the visitor waiting.
          readyTimer = setTimeout(function () {
            if (id === voiceId) voiceFail(VOICE_DOWN);
          }, AGENT_READY_MS);
          return room.localParticipant.setMicrophoneEnabled(true).catch(function () {
            voiceFail('Please allow microphone access to talk. You can still type below.');
          });
        });
      })
      .catch(function (err) {
        if (id !== voiceId) return;
        console.error('Voice assistant error:', err);
        voiceFail(VOICE_DOWN);
      });
  }

  function wireRoom(LK, r, id) {
    var E = LK.RoomEvent;

    r.on(E.TrackSubscribed, function (track) {
      if (track.kind !== 'audio') return;
      var el = track.attach();
      el.setAttribute('data-sbc-va', '');
      document.body.appendChild(el);
    });
    r.on(E.TrackUnsubscribed, function (track) {
      track.detach().forEach(function (el) { el.remove(); });
    });

    r.on(E.ParticipantAttributesChanged, function (changed, participant) {
      if (id !== voiceId || participant === r.localParticipant) return;
      var state = changed['lk.agent.state'];
      if (state && STATES[state]) {
        if (state === 'listening' || state === 'speaking') clearTimeout(readyTimer);
        setVoice(state);
      }
    });

    // The agent left (for example it crashed): end voice but keep the chat.
    r.on(E.ParticipantDisconnected, function (participant) {
      if (id === voiceId && participant.kind === LK.ParticipantKind.AGENT) voiceFail(VOICE_DOWN);
    });

    r.on(E.Disconnected, function () {
      if (id === voiceId && panel.getAttribute('data-voice') !== 'error') {
        voiceFail('Voice conversation ended. Tap the mic to talk again.');
      }
    });

    // Live captions: the agent publishes transcripts of both sides; the
    // visitor's own speech is sent with the visitor's identity. One caption per
    // segment; later updates of a segment replace its text.
    r.registerTextStreamHandler('lk.transcription', function (reader, participantInfo) {
      var attrs = (reader.info && reader.info.attributes) || {};
      var who = participantInfo.identity === r.localParticipant.identity ? 'you' : 'agent';
      reader.readAll().then(function (text) {
        text = (text || '').trim();
        if (id !== voiceId || !text) return;
        var seg = attrs['lk.segment_id'];
        var p = seg && segments[seg];
        if (!p || !p.isConnected) {
          p = addMessage(who, '');
          if (seg) segments[seg] = p;
        }
        p.textContent = text;
        logEl.scrollTop = logEl.scrollHeight;
      });
    });
  }

  window.addEventListener('shantiban:voice-toggle', function () {
    if (isOpen()) close();
    else open();
  });
})();
