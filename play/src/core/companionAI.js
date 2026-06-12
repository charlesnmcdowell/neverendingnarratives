// Companion conversation engine.
// Scripted dialog always works. With an API key in config.js, companions come alive:
// each gets a persona system prompt + a rolling memory of the run, and the dialog
// box gains a free-text input. Memory compresses past 20 entries.

const CompanionEngine = {
  state(name) {
    const GS = window.GameState;
    if (!GS.companions[name]) GS.companions[name] = { met: false, recruited: false, approval: 0, memory: [], summary: '' };
    return GS.companions[name];
  },

  remember(name, event) {
    const st = this.state(name);
    st.memory.push(event);
    if (st.memory.length > 20) {
      st.summary = (st.summary ? st.summary + ' ' : '') + 'Earlier: ' + st.memory.slice(0, 10).join('; ') + '.';
      st.memory = st.memory.slice(10);
      if (st.summary.length > 900) st.summary = st.summary.slice(-900);
    }
  },

  rememberAll(event) { // world events every companion hears about
    for (const key of Object.keys(window.GameState.companions)) this.remember(key, event);
  },

  approve(name, n, why) {
    const st = this.state(name);
    st.approval += n;
    this.remember(name, (n > 0 ? 'approved (+' + n + '): ' : 'disapproved (' + n + '): ') + why);
    return st.approval;
  },

  aiAvailable() { return !!(window.GAME_CONFIG && window.GAME_CONFIG.anthropicApiKey); },

  async chat(key, playerText) {
    const c = Companions[key], st = this.state(key);
    const GS = window.GameState, P = GS.player;
    const sys = c.persona +
      ` Hard rules: stay in character; replies under 60 words; never break the fourth wall; ` +
      `romance content tasteful and fade-to-black only. ` +
      `The player is "${P.nickname}", champion of the Pit of Karridge, a ${P.char}. ` +
      `Your relationship: ${st.recruited ? 'traveling companion' : 'acquaintance'}, approval ${st.approval}. ` +
      (st.summary ? `Memory summary: ${st.summary} ` : '') +
      (st.memory.length ? `Recent events: ${st.memory.slice(-12).join('; ')}.` : '');
    try {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': window.GAME_CONFIG.anthropicApiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: window.GAME_CONFIG.aiModel, max_tokens: window.GAME_CONFIG.aiMaxTokens,
          system: sys, messages: [{ role: 'user', content: playerText }],
        }),
      });
      const j = await r.json();
      const text = j.content && j.content[0] && j.content[0].text;
      if (text) { this.remember(key, `you said: "${playerText.slice(0, 80)}" / they replied: "${text.slice(0, 80)}"`); return text; }
      return null;
    } catch (e) { return null; }
  },

  // open a companion conversation (scripted options; plus free-text if AI is live)
  talk(scene, key) {
    const c = Companions[key], st = this.state(key);
    const GS = window.GameState, flags = GS.world.flags;
    if (!st.met) { st.met = true; this.remember(key, 'first meeting'); }
    const close = () => CityUI.closeDialog();
    const opts = [];

    // small talk (approval trickle)
    opts.push({ label: 'Talk', fn: () => {
      const line = c.chat[Math.floor(Math.random() * c.chat.length)];
      if (st.approvalChatT !== true) { st.approvalChatT = true; this.approve(key, 1, 'you took time to talk'); }
      CityUI.dialog(c.name, line, [{ label: 'Back', fn: () => this.talk(scene, key) }], scene.portraitFor(key));
    }});

    // recruitment
    if (!st.recruited) {
      if (key === 'brakka') {
        opts.push({ label: 'Ask about the axe', fn: () => {
          if (flags['dg-amb2']) {
            CityUI.dialog(c.name, c.recruitAsk, [{ label: '"It\'s dead. The hollow is clear."', fn: () => {
              st.recruited = true; this.approve(key, 3, 'you settled Dorga\'s debt');
              CityUI.dialog(c.name, c.recruitYes, [{ label: 'Welcome aboard', fn: () => { scene.onRecruit(key); close(); } }], scene.portraitFor(key));
            }}, { label: 'Say nothing yet', fn: close }], scene.portraitFor(key));
          } else CityUI.dialog(c.name, c.recruitNo, [{ label: 'Leave', fn: close }], scene.portraitFor(key));
        }});
      }
      if (key === 'vexa') {
        const kept = flags['vial-kept'] === true, merc = flags['vial-kept'] === false;
        if (kept) opts.push({ label: 'Show her the humming vial', fn: () => {
          CityUI.dialog(c.name, c.recruitVial, [
            { label: 'Hand it over (lose the evidence)', fn: () => {
              flags['vial-kept'] = 'given-to-vexa'; st.recruited = true; this.approve(key, 3, 'you gave her the hum-vial');
              CityUI.dialog(c.name, c.recruitYes, [{ label: 'This is a mistake. A fun one.', fn: () => { scene.onRecruit(key); close(); } }], scene.portraitFor(key));
            }},
            { label: 'Keep it', fn: () => { this.approve(key, -1, 'you dangled the vial and kept it');
              CityUI.dialog(c.name, c.recruitNo, [{ label: 'Leave', fn: close }], scene.portraitFor(key)); } }], scene.portraitFor(key));
        }});
        if (merc || flags['vial-kept'] === 'given-to-vexa' || !flags['q-mq4-the-buyer']) opts.push({ label: 'Offer a strength potion to dissect', fn: () => {
          const P = GS.player, i = P.belt.findIndex(b => b.type === 'potion-str');
          if (i < 0) { CityUI.dialog(c.name, '"That\'s not a strength potion. That\'s a pocket. Come back with the real thing."', [{ label: 'Leave', fn: close }], scene.portraitFor(key)); return; }
          P.belt.splice(i, 1); CityUI.belt(P.belt);
          st.recruited = true; this.approve(key, 3, 'you fed her curiosity a potion');
          CityUI.dialog(c.name, c.recruitBrew + ' ' + c.recruitYes, [{ label: 'Deal', fn: () => { scene.onRecruit(key); close(); } }], scene.portraitFor(key));
        }});
      }
    } else {
      opts.push({ label: st.following ? 'Wait here' : 'Walk with me', fn: () => {
        scene.setFollower(st.following ? null : key); this.talk(scene, key);
      }});
      if (st.approval >= 6 && !st.romanced) opts.push({ label: 'Stay the night together', fn: () => {
        st.romanced = true; this.approve(key, 2, 'the night you stayed');
        CityUI.dialog(c.name, 'Some things the chronicle keeps to itself. The lamps go out early; the morning finds two people slower to part than they meant to be. (fade to black)', [{ label: 'Morning comes', fn: close }], scene.portraitFor(key));
      }});
    }

    // free-text AI chat
    if (this.aiAvailable() && !c.scriptedOnly) opts.push({ label: '✦ Speak freely (AI)', fn: () => {
      CityUI.dialogInput(c.name, '(they\'re listening)', async text => {
        const reply = await this.chat(key, text);
        CityUI.dialog(c.name, reply || '(they seem distracted — the connection failed; scripted lines still work)', [{ label: 'Back', fn: () => this.talk(scene, key) }], scene.portraitFor(key));
      }, scene.portraitFor(key));
    }});

    opts.push({ label: 'Leave', fn: close });
    const intro = st.met && st.greeted ? (st.recruited ? '"' + GS.player.nickname + '."' : c.greet) : c.greet;
    st.greeted = true;
    CityUI.dialog(c.name + (st.recruited ? ' · companion · ♥' + st.approval : ' · ♥' + st.approval), intro, opts, scene.portraitFor(key));
  },
};
if (typeof window !== 'undefined') window.CompanionEngine = CompanionEngine;
