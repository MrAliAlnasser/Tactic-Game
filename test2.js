

    // ===== SOUND SYSTEM =====
    const SFX = {
      sfxVolume: 1.0,
      masterGain: null,
      bgm: new Audio('March_Toward_the_Iron_Gates.mp3'),
      ctx: null,

      init() {
        if (!this.ctx) {
          const AudioContext = window.AudioContext || window.webkitAudioContext;
          if (AudioContext) {
            this.ctx = new AudioContext();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = this.sfxVolume;
            this.masterGain.connect(this.ctx.destination);
          }
          this.bgm.loop = true;

          const bgmSlider = document.getElementById('bgm-slider');
          if (bgmSlider) this.bgm.volume = bgmSlider.value / 100;
          else this.bgm.volume = 0.4;
        }
        if (this.ctx && this.ctx.state === 'suspended') {
          this.ctx.resume();
        }
        if (this.bgm.volume > 0) {
          this.bgm.play().catch(e => console.log('BGM play failed', e));
        }
      },

      playRedAlarm() {
        if (this.bgm && !this.redAlarmActive) {
          this.redAlarmActive = true;
          const wasPlaying = !this.bgm.paused;
          const currentVol = this.bgm.volume;
          this.bgm.src = 'Chronicles_of_the_Ascendant.mp3';
          this.bgm.loop = true;
          this.bgm.volume = currentVol;
          if (wasPlaying) {
            this.bgm.play().catch(e => console.log('BGM play failed', e));
          }
        }
      },

      stopRedAlarm() {
        if (this.bgm && this.redAlarmActive) {
          this.redAlarmActive = false;
          const wasPlaying = !this.bgm.paused;
          const currentVol = this.bgm.volume;
          this.bgm.src = 'March_Toward_the_Iron_Gates.mp3';
          this.bgm.loop = true;
          this.bgm.volume = currentVol;
          if (wasPlaying) {
            this.bgm.play().catch(e => console.log('BGM play failed', e));
          }
        }
      },

      setBGMVolume(v) {
        this.bgm.volume = v;
        if (v > 0 && this.bgm.paused) this.bgm.play().catch(e => console.log('BGM play failed', e));
      },

      setSFXVolume(v) {
        this.sfxVolume = v;
        if (this.masterGain) this.masterGain.gain.value = v;
      },

      play(type) {
        if (this.muted || !this.ctx) return;

        try {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.connect(gain);
          gain.connect(this.masterGain);

          const now = this.ctx.currentTime;

          switch (type) {
            case 'click':
              // Military radio PTT click
              osc.type = 'square';
              osc.frequency.setValueAtTime(120, now);
              osc.frequency.exponentialRampToValueAtTime(30, now + 0.05);
              gain.gain.setValueAtTime(0.4, now);
              gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
              osc.start(now);
              osc.stop(now + 0.05);
              break;

            case 'start':
              if (navigator.vibrate) {
                navigator.vibrate([150, 50, 250]);
              }
              break;

            case 'explosion':
              // Snappy arcade explosion (white noise only)
              const duration = 0.4;
              const bufferSize = this.ctx.sampleRate * duration;
              const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
              const data = buffer.getChannelData(0);
              for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

              const noise = this.ctx.createBufferSource();
              noise.buffer = buffer;

              const noiseFilter = this.ctx.createBiquadFilter();
              noiseFilter.type = 'lowpass';
              noiseFilter.frequency.setValueAtTime(1000, now);
              noiseFilter.frequency.exponentialRampToValueAtTime(100, now + duration);

              const noiseGain = this.ctx.createGain();
              noiseGain.gain.setValueAtTime(0.6, now);
              noiseGain.gain.exponentialRampToValueAtTime(0.01, now + duration);

              noise.connect(noiseFilter);
              noiseFilter.connect(noiseGain);
              noiseGain.connect(this.masterGain);
              noise.start(now);
              break;

            case 'trophy':
              // Military bugle fanfare
              [261.63, 392.00, 523.25].forEach((freq, i) => {
                const o = this.ctx.createOscillator();
                const g = this.ctx.createGain();
                o.type = 'sawtooth';
                o.frequency.value = freq;
                const t = now + i * 0.15;
                g.gain.setValueAtTime(0, t);
                g.gain.linearRampToValueAtTime(0.15, t + 0.05);
                g.gain.exponentialRampToValueAtTime(0.01, t + 0.6);

                const filter = this.ctx.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(800, t);
                filter.frequency.exponentialRampToValueAtTime(2000, t + 0.1);
                filter.frequency.exponentialRampToValueAtTime(800, t + 0.5);

                o.connect(filter);
                filter.connect(g);
                g.connect(this.masterGain);
                o.start(t);
                o.stop(t + 0.6);
              });
              break;

            case 'plane':
              // Jet Doppler flyby
              const jetBuf = this.ctx.createBuffer(1, this.ctx.sampleRate * 2.0, this.ctx.sampleRate);
              const jetData = jetBuf.getChannelData(0);
              for (let i = 0; i < jetBuf.length; i++) jetData[i] = Math.random() * 2 - 1;
              const jetNoise = this.ctx.createBufferSource();
              jetNoise.buffer = jetBuf;

              const jetFilter = this.ctx.createBiquadFilter();
              jetFilter.type = 'bandpass';
              jetFilter.frequency.setValueAtTime(1500, now);
              jetFilter.frequency.exponentialRampToValueAtTime(300, now + 2.0);

              const jetGain = this.ctx.createGain();
              jetGain.gain.setValueAtTime(0.01, now);
              jetGain.gain.exponentialRampToValueAtTime(0.3, now + 1.0);
              jetGain.gain.exponentialRampToValueAtTime(0.01, now + 2.0);

              jetNoise.connect(jetFilter);
              jetFilter.connect(jetGain);
              jetGain.connect(this.ctx.destination);
              jetNoise.start(now);
              break;

            case 'alert':
              // Digital Warning Double-Beep
              osc.type = 'square';
              osc.frequency.value = 800;
              gain.gain.setValueAtTime(0, now);
              gain.gain.linearRampToValueAtTime(0.1, now + 0.02);
              gain.gain.linearRampToValueAtTime(0, now + 0.1);
              osc.start(now);
              osc.stop(now + 0.1);

              const alertO2 = this.ctx.createOscillator();
              const alertG2 = this.ctx.createGain();
              alertO2.type = 'square';
              alertO2.frequency.value = 800;
              alertG2.gain.setValueAtTime(0, now + 0.15);
              alertG2.gain.linearRampToValueAtTime(0.1, now + 0.17);
              alertG2.gain.linearRampToValueAtTime(0, now + 0.25);
              alertO2.connect(alertG2);
              alertG2.connect(this.masterGain);
              alertO2.start(now + 0.15);
              alertO2.stop(now + 0.25);
              break;

            case 'error':
              // Soft descending error tone
              osc.type = 'triangle';
              osc.frequency.setValueAtTime(300, now);
              osc.frequency.exponentialRampToValueAtTime(150, now + 0.3);
              gain.gain.setValueAtTime(0.3, now);
              gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
              osc.start(now);
              osc.stop(now + 0.3);
              break;

            case 'gain':
              // Morse code "V" for Victory (...-)
              [now, now + 0.15, now + 0.3].forEach(t => {
                const o = this.ctx.createOscillator();
                const g = this.ctx.createGain();
                o.type = 'sine';
                o.frequency.value = 800;
                g.gain.setValueAtTime(0, t);
                g.gain.linearRampToValueAtTime(0.1, t + 0.02);
                g.gain.linearRampToValueAtTime(0, t + 0.1);
                o.connect(g);
                g.connect(this.ctx.destination);
                o.start(t);
                o.stop(t + 0.1);
              });
              const o2 = this.ctx.createOscillator();
              const g2 = this.ctx.createGain();
              o2.type = 'sine';
              o2.frequency.value = 800;
              g2.gain.setValueAtTime(0, now + 0.45);
              g2.gain.linearRampToValueAtTime(0.1, now + 0.47);
              g2.gain.linearRampToValueAtTime(0, now + 0.75);
              o2.connect(g2);
              g2.connect(this.ctx.destination);
              o2.start(now + 0.45);
              o2.stop(now + 0.75);
              break;
          }
        } catch (err) {
          console.log('SFX Play Error:', err);
        }
      }
    };

    // ===== GAME STATE =====
    const G = {
      turn: 1,
      health: 3,
      maxHealth: 3,
      resources: 5,
      knowledge: 0,
      intel: 0,
      enemyHp: 3,
      enemyPos: -1,
      map: [],
      mode: 'airport',
      isEnemyFound: false,
      enemyKnowsUs: false,       // Does the enemy know our airport location?
      enemyAggressionBoost: 0,   // Extra attack chance from consequences
      consecutiveWarTurns: 0,
      allyHelps: 0,
      totalStrikes: 0,
      totalScouted: 0,
      upgrades: { attack: 0, defense: 0, intel: 0, repair: 0 },
      tookRest: false,
      warTurnsStreak: 0,
      storyPhase: 0,
      animating: false,
      trophies: {},
      selectedGeneral: -1,
      currentAdvice: [],
      allyOffer: null,
      damageWithoutRepair: 0
    };

    // ===== TROPHY DEFINITIONS =====
    const TROPHIES = {
      first_strike: { name: 'Ø§Ù„Ø¶Ø±Ø¨Ø© Ø§Ù„Ø£ÙˆÙ„Ù‰', icon: 'ðŸ’¥', desc: 'Ù†ÙØ° Ø£ÙˆÙ„ Ø¶Ø±Ø¨Ø© Ù†Ø§Ø¬Ø­Ø© Ø¹Ù„Ù‰ Ø§Ù„Ø¹Ø¯Ùˆ' },
      eagle_eye: { name: 'Ø¹ÙŠÙ† Ø§Ù„Ù†Ø³Ø±', icon: 'ðŸ¦…', desc: 'Ø§ÙƒØªØ´Ù Ù…ÙˆÙ‚Ø¹ Ù‚Ø§Ø¹Ø¯Ø© Ø§Ù„Ø¹Ø¯Ùˆ' },
      survivor: { name: 'Ø§Ù„Ù†Ø§Ø¬ÙŠ', icon: 'ðŸ›¡ï¸', desc: 'Ù†Ø¬Ø§ Ù…Ù† Ø§Ù„Ù‡Ø²ÙŠÙ…Ø© Ø¨Ù†Ù‚Ø·Ø© ÙˆØ§Ø­Ø¯Ø©' },
      alliance: { name: 'Ø§Ù„Ù…Ø­Ø§Ù„Ù', icon: 'ðŸ¤', desc: 'Ø§Ù‚Ø¨Ù„ Ù…Ø³Ø§Ø¹Ø¯Ø© Ø§Ù„Ø­Ù„ÙØ§Ø¡ 3 Ù…Ø±Ø§Øª' },
      warrior_rest: { name: 'Ø§Ø³ØªØ±Ø§Ø­Ø© Ù…Ø­Ø§Ø±Ø¨', icon: 'â˜•', desc: 'Ø®Ø° Ø§Ø³ØªØ±Ø§Ø­Ø© Ø¨Ø¹Ø¯ 3 Ø£Ø¯ÙˆØ§Ø± Ø­Ø±Ø¨ Ù…ØªØªØ§Ù„ÙŠØ©' },
      supreme: { name: 'Ø§Ù„Ù‚Ø§Ø¦Ø¯ Ø§Ù„Ø£Ø¹Ù„Ù‰', icon: 'ðŸ‘‘', desc: 'Ø§Ø±Ø¨Ø­ Ø§Ù„Ù„Ø¹Ø¨Ø©' },
      resourceful: { name: 'Ø³ÙŠØ¯ Ø§Ù„Ù…ÙˆØ§Ø±Ø¯', icon: 'ðŸ›¢ï¸', desc: 'Ø§Ø¬Ù…Ø¹ 15 Ù†Ù‚Ø·Ø© Ù…ÙˆØ§Ø±Ø¯' },
      scholar: { name: 'Ø§Ù„Ø¹Ø§Ù„ÙÙ…', icon: 'ðŸ“–', desc: 'Ø§Ø¬Ù…Ø¹ 10 Ù†Ù‚Ø§Ø· Ù…Ø¹Ø±ÙØ©' },
      scout_master: { name: 'Ø±Ø¦ÙŠØ³ Ø§Ù„ÙƒØ´Ø§ÙØ©', icon: 'ðŸ”­', desc: 'Ø§ÙƒØ´Ù 10 Ù…ÙˆØ§Ù‚Ø¹ Ø¹Ù„Ù‰ Ø§Ù„Ø®Ø±ÙŠØ·Ø©' },
      decisive: { name: 'Ø§Ù„Ù‚Ø±Ø§Ø± Ø§Ù„Ø­Ø§Ø³Ù…', icon: 'âš¡', desc: 'Ø§Ø±Ø¨Ø­ Ù‚Ø¨Ù„ Ø§Ù„Ø¯ÙˆØ± 10' }
    };

    // ===== GENERALS =====
    const GENERALS = [
      { name: 'Ø§Ù„Ø¬Ù†Ø±Ø§Ù„ ØµÙ‚Ø±', rank: 'Ù‡Ø¬ÙˆÙ…', type: 'strike', emoji: 'ðŸ¦…', img: 'assets/generals/iron_falcon.png' },
      { name: 'Ø§Ù„Ø¬Ù†Ø±Ø§Ù„ Ø«Ø¹Ù„Ø¨ Ø§Ù„ØµØ­Ø±Ø§Ø¡', rank: 'Ù…Ø¹Ù„ÙˆÙ…Ø§Øª', type: 'intel', emoji: 'ðŸ¦Š', img: 'assets/generals/desert_fox.png' },
      { name: 'Ø¬Ù†Ø±Ø§Ù„ Ø§Ù„ØªØ­ØµÙŠÙ†Ø§Øª', rank: 'Ø¯ÙØ§Ø¹', type: 'defense', emoji: 'ðŸ›¡ï¸', img: 'assets/generals/shield_nation.png' },
      { name: 'Ø§Ù„Ø¬Ù†Ø±Ø§Ù„ Ø¹ÙŠÙ† Ø§Ù„Ù†Ø³Ø±', rank: 'Ø§Ø³ØªØ·Ù„Ø§Ø¹', type: 'scout', emoji: 'ðŸ‘ï¸', img: 'assets/generals/eagle_eye.png' },
      { name: 'Ø§Ù„Ø¬Ù†Ø±Ø§Ù„ Ù‚Ù„Ø¨ Ø§Ù„Ø£Ø³Ø¯', rank: 'Ù‚ÙŠØ§Ø¯Ø©', type: 'versatile', emoji: 'ðŸ¦', img: 'assets/generals/lionheart.png' },
      { name: 'Ø§Ù„Ø¬Ù†Ø±Ø§Ù„ Ø³ÙŠÙ', rank: 'ØªÙƒØªÙŠÙƒ', type: 'tactical', emoji: 'âš”ï¸', img: 'assets/generals/sword_justice.png' }
    ];

    // ===== STORY =====
    const STORY = [
      'ÙˆØµÙ„Øª ØªÙ‚Ø§Ø±ÙŠØ± Ù…Ø¹Ù„ÙˆÙ…Ø§ØªÙŠØ© Ù…Ù‚Ù„Ù‚Ø©...\nØ¹Ø¯Ùˆ Ù…Ø¬Ù‡ÙˆÙ„ ÙŠÙ‡Ø¯Ø¯ Ø£Ù…Ù† Ø§Ù„Ù…Ù†Ø·Ù‚Ø© Ø¨Ø£ÙƒÙ…Ù„Ù‡Ø§.\nÙ…Ø·Ø§Ø±Ùƒ Ø§Ù„Ø¹Ø³ÙƒØ±ÙŠ Ù‡Ùˆ Ø®Ø· Ø§Ù„Ø¯ÙØ§Ø¹ Ø§Ù„Ø£Ø®ÙŠØ±.\n\n<span>Ù…Ù‡Ù…ØªÙƒ: Ø§ÙƒØªØ´Ù Ù…ÙˆÙ‚Ø¹ Ø§Ù„Ø¹Ø¯Ùˆ ÙˆØ¯Ù…Ø± Ù‚Ø§Ø¹Ø¯ØªÙ‡ Ù‚Ø¨Ù„ Ø£Ù† ÙŠØ¯Ù…Ø± Ù‚Ø§Ø¹Ø¯ØªÙƒ.</span>',
    ];

    // ===== INIT =====
    function initGame() {
      G.turn = 1;
      G.health = 3;
      G.resources = 5;
      G.intel = 0;
      G.enemyHp = 3;
      G.map = new Array(16).fill(0);
      G.enemyPos = Math.floor(Math.random() * 16);
      G.isEnemyFound = false;
      G.enemyKnowsUs = false;
      G.alarmActive = false;
      G.redAlarmTriggered = false;
      G.aaCooldown = 0;
      if (typeof SFX !== 'undefined' && SFX.stopRedAlarm) {
        SFX.stopRedAlarm();
      }
      G.enemyAggressionBoost = 0;
      G.consecutiveWarTurns = 0;
      G.warTurnsStreak = 0;
      G.allyHelps = 0;
      G.totalStrikes = 0;
      G.totalScouted = 0;
      G.mode = 'airport';
      G.tookRest = false;
      G.storyPhase = 0;
      G.animating = false;
      G.selectedGeneral = -1;
      G.currentAdvice = [];
      G.allyOffer = null;
      G.damageWithoutRepair = 0;
      G.upgrades = { radar: false, walls: false, aa: false, stealth: false, eng: false, ammo: false };
      loadTrophies();
    }

    // ===== SCREEN MANAGEMENT =====
    function showScreen(id) {
      document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
      document.getElementById(id).classList.add('active');
      if (id === 'screen-trophies') renderTrophies();
    }

    // ===== START GAME =====
    function startGame() {
      SFX.init();
      SFX.play("start");
      initGame();
      showScreen('screen-story');
      const el = document.getElementById('story-text');
      el.innerHTML = STORY[0];
      el.style.animation = 'none';
      void el.offsetWidth;
      el.style.animation = 'storyFade 1.5s ease forwards';
      setTimeout(() => {
        document.getElementById('btn-enter').style.display = 'inline-block';
      }, 2000);
    }

    function enterGame() {
      SFX.play("start");
      showScreen('screen-game');
      buildMap();
      updateUI();
      clearLog();
      addLog('Ù…Ø±Ø­Ø¨Ù‹Ø§ Ø¨Ùƒ Ø£ÙŠÙ‡Ø§ Ø§Ù„Ù‚Ø§Ø¦Ø¯. Ù…Ø·Ø§Ø±Ùƒ Ø¬Ø§Ù‡Ø².', 'important');
      addLog('Ø­Ø¯Ø¯ Ù…ÙˆÙ‚Ø¹ Ù‚Ø§Ø¹Ø¯Ø© Ø§Ù„Ø¹Ø¯Ùˆ ÙˆØ¯Ù…Ø±Ù‡Ø§!', 'important');
      startTurn();
    }

    // ===== MODAL TOGGLES =====
    function toggleLogModal() {
      const m = document.getElementById('log-modal');
      m.classList.toggle('active');
    }

    function toggleMapModal() {
      const m = document.getElementById('map-modal');
      m.classList.toggle('active');
    }

    function toggleCodexModal() {
      const m = document.getElementById('codex-modal');
      m.classList.toggle('active');
    }

    function toggleRnDModal() {
      const m = document.getElementById('rnd-modal');
      m.classList.toggle('active');
    }

    function closeModalOnOutside(e) {
      if (e.target.classList.contains('glass-modal')) e.target.classList.remove('active');
    }

    function closeDiscoveryModal() {
      document.getElementById('discovery-modal').classList.remove('active');
      if (G.discoveryCallback) {
        G.discoveryCallback();
        G.discoveryCallback = null;
      }
    }

    function triggerRedAlarm() {
      if (!G.redAlarmTriggered) {
        G.redAlarmTriggered = true;
        if (typeof SFX !== 'undefined' && SFX.playRedAlarm) {
          SFX.playRedAlarm();
        }
      }
    }

    function showDiscoveryModal(reason, callback) {
      triggerRedAlarm();
      if (typeof SFX !== 'undefined') SFX.play('alert');
      const m = document.getElementById('discovery-modal');
      const storyEl = document.getElementById('discovery-story');
      const adviceEl = document.getElementById('discovery-advice');
      
      if (reason === 'enemy_blind_hit') {
        storyEl.innerHTML = "Ù„Ù‚Ø¯ Ø­Ø¯Ø« Ù…Ø§ Ù„Ù… ÙŠÙƒÙ† Ø¨Ø§Ù„Ø­Ø³Ø¨Ø§Ù†!<br>Ù‚Ø°ÙŠÙØ© Ø·Ø§Ø¦Ø´Ø© Ù…Ù† Ù‚ØµÙ Ø§Ù„Ø¹Ø¯Ùˆ Ø£Ùˆ Ø·Ø§Ø¦Ø±Ø© Ø§Ø³ØªØ·Ù„Ø§Ø¹ Ù…Ø¹Ø§Ø¯ÙŠØ© Ø­Ù„Ù‚Øª Ø¨Ø§Ù„Ø®Ø·Ø£ ÙÙˆÙ‚ Ù…Ø·Ø§Ø±Ù†Ø§ Ø§Ù„Ø³Ø±ÙŠ.<br><br>Ø§Ù„Ù†Ø´Ø§Ø· Ø§Ù„Ù…Ù„Ø­ÙˆØ¸ ÙƒØ´Ù Ø¥Ø­Ø¯Ø§Ø«ÙŠØ§ØªÙ†Ø§ Ù„Ù„Ø¹Ø¯Ùˆ Ø¨Ø´ÙƒÙ„ Ù‚Ø§Ø·Ø¹!";
      } else if (reason === 'player_strike') {
        storyEl.innerHTML = "Ø±Ø§Ø¯Ø§Ø±Ø§Øª Ø§Ù„Ø¹Ø¯Ùˆ ØªÙ…ÙƒÙ†Øª Ù…Ù† ØªØªØ¨Ø¹ Ù…Ø³Ø§Ø± Ø·Ø§Ø¦Ø±Ø§ØªÙ†Ø§ Ø§Ù„Ø¹Ø§Ø¦Ø¯Ø© Ù…Ù† Ø§Ù„Ù‡Ø¬ÙˆÙ… Ø§Ù„Ø£Ø®ÙŠØ± ÙˆÙƒØ´ÙØª Ù…ÙˆÙ‚Ø¹ Ù…Ø·Ø§Ø±Ù†Ø§ Ø§Ù„Ø³Ø±ÙŠ!<br><br>Ù„Ù… ÙŠØ¹Ø¯ Ø§Ù„ØªØ®ÙÙŠ Ø®ÙŠØ§Ø±Ø§Ù‹ Ù…ØªØ§Ø­Ø§Ù‹.";
      }
      
      if (!G.isEnemyFound) {
        adviceEl.innerHTML = "Ù†Ø­Ù† Ø§Ù„Ø¢Ù† Ø¹Ù„Ù‰ Ø£Ù‡Ø¨Ø© Ø§Ù„Ø§Ø³ØªØ¹Ø¯Ø§Ø¯.<br><br><span style='color: #ff9999;'>ÙŠØ¬Ø¨ Ø¹Ù„ÙŠÙ†Ø§ Ø§Ù„Ø¥Ø³Ø±Ø§Ø¹ ÙÙŠ Ø§Ù„Ø¨Ø­Ø« Ø¹Ù† Ù‚Ø§Ø¹Ø¯Ø© Ø§Ù„Ø¹Ø¯Ùˆ ÙˆÙƒØ´ÙÙ‡Ø§</span><br>Ù‚Ø¨Ù„ Ø£Ù† ÙŠÙ…Ø·Ø±Ù†Ø§ Ø¨ÙˆØ§Ø¨Ù„ Ù…Ù† Ø§Ù„Ù†ÙŠØ±Ø§Ù† Ø§Ù„Ù…Ø±ÙƒØ²Ø©.";
      } else {
        adviceEl.innerHTML = "Ø§Ù„Ø¹Ø¯Ùˆ ÙŠØ¹Ø±Ù Ù…ÙƒØ§Ù†Ù†Ø§ ÙˆÙ†Ø­Ù† Ù†Ø¹Ø±Ù Ù…ÙƒØ§Ù†Ù‡.<br><br><span style='color: #ff9999;'>ÙŠØ¬Ø¨ Ø¹Ù„ÙŠÙ†Ø§ Ø¶Ø±Ø¨Ù‡ ÙÙˆØ±Ø§Ù‹ ÙˆØ§Ù„ØªØ®Ù„Øµ Ù…Ù† ØªÙ‡Ø¯ÙŠØ¯Ù‡</span><br>Ù‚Ø¨Ù„ Ø£Ù† ÙŠØ¯Ù…Ø±Ù†Ø§ ØªÙ…Ø§Ù…Ø§Ù‹!";
      }
      
      G.discoveryCallback = callback;
      m.classList.add('active');
    }

    function setWaitState(isWaiting, text = '') {
      const banner = document.getElementById('turn-status-banner');
      if (!banner) return;
      if (isWaiting) {
        banner.textContent = text;
        banner.style.opacity = '1';
        banner.style.visibility = 'visible';
      } else {
        banner.style.opacity = '0';
        banner.style.visibility = 'hidden';
      }
    }

    function showImagePreview(imgSrc) {
      const modal = document.getElementById('image-preview-modal');
      const img = document.getElementById('image-preview-img');
      img.src = imgSrc;
      modal.classList.add('active');
    }

    // ===== MAP =====
    function buildMap() {
      const grid = document.getElementById('map-grid');
      grid.innerHTML = '';
      const labels = 'Ø£Ø¨ØªØ«Ø¬Ø­Ø®Ø¯Ø°Ø±Ø²Ø³Ø´ØµØ¶Ø·'.split('');
      for (let i = 0; i < 16; i++) {
        const cell = document.createElement('div');
        cell.className = 'map-cell';
        cell.id = 'cell-' + i;
        cell.innerHTML = `<span class="cell-label">${labels[i]}${Math.floor(i / 4) + 1}</span>`;
        cell.dataset.idx = i;
        grid.appendChild(cell);
      }
      updateMap();
    }

    function updateMap() {
      const labels = 'Ø£Ø¨ØªØ«Ø¬Ø­Ø®Ø¯Ø°Ø±Ø²Ø³Ø´ØµØ¶Ø·'.split('');
      for (let i = 0; i < 16; i++) {
        const cell = document.getElementById('cell-' + i);
        if (!cell) continue;
        cell.className = 'map-cell';

        if (G.map[i] === 0) {
          cell.title = "ØºÙŠØ± Ù…ÙƒØ´ÙˆÙ";
          cell.innerHTML = `<span style="font-size:16px">â“</span><span class="cell-label">${labels[i]}${Math.floor(i / 4) + 1}</span>`;
        } else if (G.map[i] === 1) {
          cell.classList.add('revealed');
          cell.title = "ØªÙ… Ø§Ù„ÙƒØ´Ù (Ù…Ù†Ø·Ù‚Ø© Ø¢Ù…Ù†Ø©)";
          cell.innerHTML = `<span style="font-size:16px">âœ…</span><span class="cell-label">${labels[i]}${Math.floor(i / 4) + 1}</span>`;
        } else if (G.map[i] === 2) {
          cell.classList.add('enemy-found');
          cell.title = "Ù‡Ø¯Ù Ø§Ù„Ø¹Ø¯Ùˆ (Ù…ÙƒØ´ÙˆÙ)";
          cell.innerHTML = `<span style="font-size:16px">ðŸŽ¯</span><span class="cell-label">${labels[i]}${Math.floor(i / 4) + 1}</span>`;
        } else if (G.map[i] === 3) {
          cell.classList.add('hit');
          cell.title = "ØªÙ… ØªØ¯Ù…ÙŠØ±Ù‡ (Ø£ØµÙŠØ¨)";
          cell.innerHTML = `<span style="font-size:16px">ðŸ’¥</span><span class="cell-label">${labels[i]}${Math.floor(i / 4) + 1}</span>`;
        } else if (G.map[i] === -1) {
          cell.classList.add('miss');
          cell.title = "Ø¶Ø±Ø¨Ø© Ø®Ø§Ø·Ø¦Ø©";
          cell.innerHTML = `<span style="font-size:16px">âœ–</span><span class="cell-label">${labels[i]}${Math.floor(i / 4) + 1}</span>`;
        }
      }
    }

    // ===== UI UPDATE =====
    function updateUI() {
      const alarm = document.getElementById('red-alarm-overlay');
      if (alarm) {
        alarm.classList.remove('active');
      }

      document.getElementById('turn-counter').textContent = 'Ø§Ù„Ø¯ÙˆØ±: ' + G.turn;
      document.getElementById('stat-resources').textContent = G.resources;
      document.getElementById('stat-intel').textContent = G.intel;
      document.getElementById('stat-enemy-hp').textContent = G.enemyHp;

      // Health pips
      const hd = document.getElementById('health-display');
      hd.innerHTML = '';
      for (let i = 0; i < G.maxHealth; i++) {
        const pip = document.createElement('div');
        pip.className = 'health-pip';
        if (i >= G.health) pip.classList.add('destroyed');
        else if (i === G.health - 1 && G.damageWithoutRepair > 0) pip.classList.add('damaged');
        hd.appendChild(pip);
      }

      // Upgrade display
      const ud = document.getElementById('upgrade-display');
      ud.innerHTML = '<span style="font-size:12px;color:var(--text-dim)">Ø§Ù„ØªØ·ÙˆÙŠØ±Ø§Øª:</span>';
      ['radar', 'walls', 'aa', 'stealth', 'eng', 'ammo'].forEach(key => {
        const pip = document.createElement('div');
        pip.className = 'upgrade-pip' + (G.upgrades[key] ? ' active' : '');
        ud.appendChild(pip);
      });

      // Intel hint
      const hint = document.getElementById('intel-hint');
      if (G.isEnemyFound) {
        hint.textContent = 'ðŸŽ¯ ØªÙ… ØªØ­Ø¯ÙŠØ¯ Ù…ÙˆÙ‚Ø¹ Ø§Ù„Ø¹Ø¯Ùˆ! Ù†ÙØ° Ø§Ù„Ø¶Ø±Ø¨Ø§Øª!';
        hint.style.color = '#e08060';
      } else if (G.intel >= 8) {
        hint.textContent = 'ðŸ”¥ Ù…Ø¹Ù„ÙˆÙ…Ø§Øª Ø¹Ø§Ù„ÙŠØ©! Ù‚Ø±ÙŠØ¨ Ù…Ù† Ø§Ù„ÙƒØ´Ù';
        hint.style.color = 'var(--gold)';
      } else {
        hint.textContent = 'Ø§Ø¬Ù…Ø¹ Ø§Ù„Ù…Ø¹Ù„ÙˆÙ…Ø§Øª Ù„ÙƒØ´Ù Ù…ÙˆÙ‚Ø¹ Ø§Ù„Ø¹Ø¯Ùˆ (' + G.intel + '/10)';
        hint.style.color = 'var(--text-dim)';
      }

      // Enemy status
      const esc = document.getElementById('enemy-status-container');
      if (G.enemyKnowsUs) {
        esc.innerHTML = '<div class="enemy-status-bar">âš ï¸ Ø§Ù„Ø¹Ø¯Ùˆ ÙŠØ¹Ù„Ù… Ù…ÙˆÙ‚Ø¹ Ù…Ø·Ø§Ø±Ùƒ! Ù‡Ø¬Ù…Ø§ØªÙ‡ Ø£Ù‚ÙˆÙ‰ ÙˆØ£Ø¯Ù‚</div>';
      } else {
        esc.innerHTML = '';
      }

      // Mode button logic removed

      updateMap();
    }

    // ===== EVENT LOG =====
    function addLog(text, type = '') {
      if (typeof SFX !== 'undefined') {
        if (text.includes('ðŸ’¥')) SFX.play('explosion');
        else if (text.includes('âš ï¸') || text.includes('ðŸŽ¯')) SFX.play('alert');
        else if (text.includes('ÙØ§Ø´Ù„Ø©') || text.includes('Ø®Ø§Ø·Ø¦Ø©')) SFX.play('error');
        else if (text.includes('ðŸ†') || text.includes('Ù†Ø¬Ø­')) SFX.play('trophy');
        else if (text.includes('+') || text.includes('Ù…ÙˆØ§Ø±Ø¯') || text.includes('Ù…Ø¹Ø±ÙØ©') || type === 'ally' || text.includes('ØªÙ… ØªØ·ÙˆÙŠØ±')) SFX.play('gain');
      }
      const log = document.getElementById('event-log');
      const entry = document.createElement('div');
      entry.className = 'log-entry ' + type;

      const now = new Date();
      const timeStr = String(now.getHours()).padStart(2, '0') + ':' +
        String(now.getMinutes()).padStart(2, '0') + ':' +
        String(now.getSeconds()).padStart(2, '0');

      entry.textContent = `[${timeStr}] > ` + text;
      log.insertBefore(entry, log.firstChild);
      if (log.children.length > 20) log.removeChild(log.lastChild);

      const floatContainer = document.getElementById('floating-log-container');
      if (floatContainer) {
        const floatMsg = document.createElement('div');
        floatMsg.style.cssText = 'background: rgba(15, 20, 30, 0.85); color: #f0f0f0; padding: 6px 12px; border-radius: 6px; font-size: 12px; border-right: 3px solid var(--gold); box-shadow: 0 2px 8px rgba(0,0,0,0.6); opacity: 0; transform: translateX(20px); transition: all 0.3s ease; line-height: 1.4;';
        if (type === 'danger') floatMsg.style.borderRightColor = '#f44';
        else if (type === 'ally') floatMsg.style.borderRightColor = '#4cf';
        else if (type === 'important') floatMsg.style.borderRightColor = '#a4f';
        floatMsg.textContent = text;
        floatContainer.appendChild(floatMsg);
        setTimeout(() => {
          floatMsg.style.opacity = '1';
          floatMsg.style.transform = 'translateX(0)';
        }, 10);
        setTimeout(() => {
          floatMsg.style.opacity = '0';
          setTimeout(() => { if (floatMsg.parentNode) floatMsg.parentNode.removeChild(floatMsg); }, 500);
        }, 6000);
      }
    }

    function clearLog() {
      document.getElementById('event-log').innerHTML = '';
    }


    // ===== PIXEL ART SPRITES =====
            const PALETTE = {
      'H': '#2b3340', 'h': '#43556d', 'F': '#222222', 'f': '#e0b080',
      'S': '#4a5a72', 's': '#6a8099', 'O': '#d48830', 'o': '#d4a030',
      'B': '#111111', 'C': '#283c28', 'c': '#3a5a3a', 'W': '#8b7020', 'w': '#c2a870',
      'J': '#45503B', 'j': '#5c6b4e', 'D': '#333333', 'G': '#778899', 'L': '#FFFFCC', 'R': '#FF3333', 'T': '#3a4050',
      'P': '#5C6B73', 'p': '#93A8AC', 'V': '#E2C044', 'A': '#1a2028',
      'M': '#3b4a2e', 'm': '#4e6139', 'N': '#2c3822', 'n': '#5a7045', 'K': '#1a1a1a', 'k': '#2a2a2a',
      'X': '#C4B491', 'x': '#A39171', 'Y': '#827051'
    };
    const SPRITES = {
      pilot_idle: [
        "    AAA    ",
        "   AVVVA   ",
        "  AVVVVVA  ",
        "  AAFVFAA  ",
        "  HAAAAAH  ",
        " HH SSS HH ",
        " H SSSSS H ",
        "   SSSSS   ",
        "   BB BB   ",
        "   BB BB   "
      ],
      pilot_salute: [
        "    AAA    ",
        "   AVVVA   ",
        "  AVVVVVAA ",
        "  AAFVFAAH ",
        "  HAAAAA H ",
        " HH SSS  H ",
        " H SSSSS   ",
        "   SSSSS   ",
        "   BB BB   ",
        "   BB BB   "
      ],
      pilot_helmet: [
        "    AAA    ",
        "   AVVVA   ",
        "  AVVVVVA  ",
        "  AAAAAAA  ",
        "  HAAAAAH  ",
        " HH SSS HH ",
        " H SSSSS H ",
        "   SSSSS   ",
        "   BB BB   ",
        "   BB BB   "
      ],
      pilot_climb: [
        "    AAA    ",
        "   AVVVA   ",
        "  AVVVVVA  ",
        "  AAAAAAA  ",
        "  HAAAAAH  ",
        "  H SSS  H ",
        "  H SSSSS H",
        "    SSSSS  ",
        "    BB     ",
        "    BB     "
      ],
      soldier_idle: [
        "        GGGGGG          ",
        "       GGGGGGGG         ",
        "       DDffffDD         ",
        "        wwffww          ",
        "      wwwwDDwwww        ",
        "     wwwwwDDwwwww       ",
        "    wwwwDDDDDDwwww      ",
        "    wwwDDDDDDDDwww      ",
        "    wwwDDDDDDDDwww      ",
        "    wwWDDDDDDDDWww      ",
        "    wwwDDDDDDDD         ",
        "     BBBDDDDDDBBBBB     ",
        "     wwDDDDDDDDww       ",
        "      wwwwwwwwww        ",
        "     WWWWWWWWWWWW       ",
        "      wwww  wwww        ",
        "      wwww  wwww        ",
        "      wwww  wwww        ",
        "      wwww  wwww        ",
        "      wwww  wwww        ",
        "      DDDD  DDDD        ",
        "      wwww  wwww        ",
        "      wwww  wwww        ",
        "      wwww  wwww        ",
        "     BBBBB  BBBBB       ",
        "     BBBBB  BBBBB       "
      ],
      soldier_cheer: [
        "  ww              ww    ",
        "  ww    GGGGGG    ww    ",
        " www   GGGGGGGG   www   ",
        " www   DDffffDD   www   ",
        " www    wwffww    www   ",
        "  ww  wwwwDDwwww  ww    ",
        "   wwwwwwwDDwwwwwww     ",
        "    wwwwDDDDDDwwww      ",
        "      wDDDDDDDDw        ",
        "       DDDDDDDD         ",
        "       DDDDDDDD         ",
        "       DDDDDDDD         ",
        "       DDDDDDDD         ",
        "       wwwwwwww         ",
        "     WWWWWWWWWWWW       ",
        "      wwww  wwww        ",
        "      wwww  wwww        ",
        "      wwww  wwww        ",
        "      wwww  wwww        ",
        "      wwww  wwww        ",
        "      DDDD  DDDD        ",
        "      wwww  wwww        ",
        "      wwww  wwww        ",
        "      wwww  wwww        ",
        "     BBBBB  BBBBB       ",
        "     BBBBB  BBBBB       "
      ],
      soldier_guard: [
        "        GGGGGG          ",
        "       GGGGGGGG         ",
        "       DDffffDD         ",
        "        wwffww          ",
        "      wwwwDDwwww        ",
        "     wwwwwDDwwwww       ",
        "    wwwwDDDDDDwwww      ",
        "    wwwDDDDDDDDwwwBB    ",
        "    wwwDDDDDDDDwwBBB    ",
        "    wwWDDDDDDDDWBBBBBB  ",
        "     wwDDDDDDDD         ",
        "      wDDDDDDDD         ",
        "       DDDDDDDD         ",
        "       wwwwwwww         ",
        "     WWWWWWWWWWWW       ",
        "      wwww  wwww        ",
        "      wwww  wwww        ",
        "      wwww  wwww        ",
        "      wwww  wwww        ",
        "     wwww    wwww       ",
        "     DDDD    DDDD       ",
        "     wwww    wwww       ",
        "     wwww    wwww       ",
        "     wwww    wwww       ",
        "    BBBBB    BBBBB      ",
        "    BBBBB    BBBBB      "
      ],
      };

    function drawPixelArt(ctx, x, y, scale, spriteName) {
      const sprite = SPRITES[spriteName];
      if (!sprite) return;
      for (let r = 0; r < sprite.length; r++) {
        for (let c = 0; c < sprite[r].length; c++) {
          const char = sprite[r][c];
          if (char !== ' ' && PALETTE[char]) {
            ctx.fillStyle = PALETTE[char];
            ctx.fillRect(Math.floor(x + c * scale), Math.floor(y + r * scale), scale, scale);
          }
        }
      }
    }

    // ===== TURN SYSTEM =====
    function startTurn() {
      if (G.aaCooldown > 0) G.aaCooldown--;
      if (G.aaDebrisTurns > 0) G.aaDebrisTurns--;
      setWaitState(false);
      G.animating = true;
      G.selectedGeneral = -1;

      if (G.intel >= 10 && !G.isEnemyFound) {
          G.isEnemyFound = true;
          G.map[G.enemyPos] = 2;
          awardTrophy('eagle_eye');
          
          showNotification('Ø§ÙƒØªØ´Ø§Ù Ø­Ø§Ø³Ù…! ðŸŽ¯', 'Ø¨ÙØ¶Ù„ ØªØ±Ø§ÙƒÙ… 10 Ù†Ù‚Ø§Ø· Ù…Ø¹Ù„ÙˆÙ…Ø§ØªØŒ Ø§Ø³ØªØ®Ø¨Ø§Ø±Ø§ØªÙ†Ø§ ØªÙ…ÙƒÙ†Øª Ø£Ø®ÙŠØ±Ø§Ù‹ Ù…Ù† ÙÙƒ Ø´ÙØ±Ø© Ù…ÙˆÙ‚Ø¹ Ù‚Ø§Ø¹Ø¯Ø© Ø§Ù„Ø¹Ø¯Ùˆ Ø§Ù„Ø±Ø¦ÙŠØ³ÙŠØ©!\n\n<span style="color:#f0ad4e; font-weight:bold;">Ø·Ø§Ø¦Ø±Ø§ØªÙ†Ø§ Ø§Ù„Ù‡Ø¬ÙˆÙ…ÙŠØ© Ø¨Ø§Ù†ØªØ¸Ø§Ø± Ø£ÙˆØ§Ù…Ø±Ùƒ Ù„ØªØ¯Ù…ÙŠØ±Ù‡Ù….</span>', [{ 
            text: 'Ù…Ù…ØªØ§Ø²! Ø§Ø³ØªØ¹Ø¯ÙˆØ§ Ù„Ù„Ù‡Ø¬ÙˆÙ…', 
            gold: true, 
            action: () => {
              hideNotification();
              setTimeout(() => {
                continueStartTurn();
              }, 100);
            }
          }]);
          return;
      }

      continueStartTurn();
    }

    function continueStartTurn() {
      playAirportAnimation(() => {
        G.animating = false;
        generateAdvice();
        renderGenerals();

        if (G.turn > 1 && (G.turn % 3 === 0 || (G.health <= 1 && Math.random() > 0.4))) {
          offerAllySupport();
        }

        triggerStoryBeat();
      });
    }

    // ===== AIRPORT CANVAS ANIMATION =====
    

      function drawDetailedPlane(ctx, px, py, scale, frame, animState) {
        ctx.save();
        ctx.translate(px, py);
        ctx.scale(scale, scale);
        
        if (py > 200) {
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.beginPath();
            ctx.ellipse(0, 30, 45, 10, 0, 0, Math.PI*2);
            ctx.fill();
        }

        if (animState === 'takeoff' && frame > 100) {
          const glowLen = 20 + Math.sin(frame * 0.5) * 15;
          const grad = ctx.createLinearGradient(40, 0, 40 + glowLen, 0);
          grad.addColorStop(0, '#fff');
          grad.addColorStop(0.2, '#0df');
          grad.addColorStop(1, 'rgba(0, 200, 255, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.moveTo(40, -5); ctx.lineTo(40 + glowLen, -15); ctx.lineTo(40 + glowLen, 15); ctx.lineTo(40, 5);
          ctx.fill();
        }

        ctx.fillStyle = '#4a5565';
        ctx.beginPath();
        ctx.moveTo(-50, 0); ctx.lineTo(-40, -8); ctx.lineTo(20, -10); ctx.lineTo(40, -5);
        ctx.lineTo(40, 5); ctx.lineTo(20, 10); ctx.lineTo(-40, 8); ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#1c2533';
        ctx.beginPath(); ctx.moveTo(-50, 0); ctx.lineTo(-40, -8); ctx.lineTo(-20, -8); ctx.lineTo(-30, 0); ctx.fill();
        ctx.fillStyle = '#4fc4d0';
        ctx.beginPath(); ctx.moveTo(-45, -2); ctx.lineTo(-35, -7); ctx.lineTo(-25, -7); ctx.lineTo(-35, -2); ctx.fill();

        ctx.fillStyle = '#3a4050';
        ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(10, 0); ctx.lineTo(30, -30); ctx.lineTo(15, -30); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(-10, 5); ctx.lineTo(10, 5); ctx.lineTo(30, 35); ctx.lineTo(15, 35); ctx.closePath(); ctx.fill();
        
        ctx.fillStyle = '#2a3240';
        ctx.beginPath(); ctx.moveTo(25, -8); ctx.lineTo(35, -25); ctx.lineTo(40, -25); ctx.lineTo(40, -5); ctx.closePath(); ctx.fill();
        
        ctx.fillStyle = '#111'; ctx.fillRect(-30, 0, 15, 2);
        ctx.fillStyle = '#ff3333'; ctx.fillRect(-40, 0, 4, 2);

        ctx.restore();
      }

    function playAirportAnimation(callback, forceAnimState = null) {
      if (window.airportAnimFrame) cancelAnimationFrame(window.airportAnimFrame);
      if (G.animating) {
        document.getElementById('btn-execute')?.setAttribute('disabled', 'true');
        document.getElementById('btn-skip')?.setAttribute('disabled', 'true');
      }
      const canvas = document.getElementById('airportCanvas');
      const ctx = canvas.getContext('2d', { alpha: false });
      let frame = 0;
      let totalFrames = 60;

      let animState = 'idle';
      if (forceAnimState) {
        animState = forceAnimState;
      } else {
        if (G.turn === 1) animState = 'idle';
        else if (G.tookRest) animState = 'resource_gain';
        else if (G.selectedGeneral >= 0 && G.currentAdvice[G.selectedGeneral] && ['strike', 'blind_strike', 'stealth_strike', 'full_assault', 'diversion'].includes(G.currentAdvice[G.selectedGeneral].action)) animState = 'takeoff';
      }

      if (animState === 'takeoff') totalFrames = 200;
      if (animState === 'resource_gain') totalFrames = 90;
      if (animState === 'enemy_attack') totalFrames = 80;
      if (animState === 'aa_intercept') totalFrames = 80;

      let fireOrigins = [];
      let fires = [];
      let smokes = [];
      if (G.health < G.maxHealth) {
        const missing = G.maxHealth - G.health;
        for(let i=0; i<missing; i++) {
           fireOrigins.push({
             x: 0.2 + Math.random() * 0.6,
             y: 0.6 + Math.random() * 0.2
           });
        }
        for (let i = 0; i < missing * 40; i++) {
          fires.push({
            originIndex: i % missing,
            rx: (Math.random() - 0.5) * 40, ry: (Math.random() - 0.5) * 10,
            vx: (Math.random() - 0.5) * 1, vy: -Math.random() * 2 - 1.5,
            life: Math.random() * 40, maxLife: 40,
            size: Math.random() * 15 + 10
          });
        }
        for (let i = 0; i < missing * 30; i++) {
          smokes.push({
            originIndex: i % missing,
            rx: (Math.random() - 0.5) * 60, ry: (Math.random() - 0.5) * 20 - 20,
            vx: (Math.random() - 0.5) * 2 + 1, vy: -Math.random() * 1.5 - 1.5,
            life: Math.random() * 80, maxLife: 80,
            size: Math.random() * 30 + 20
          });
        }
      }

      let isDay = G.turn % 2 !== 0;
      let isSunset = G.turn % 4 === 3;
      let isRainy = Math.random() < 0.3;
      let rainDrops = [];
      if (isRainy) {
        for (let i = 0; i < 150; i++) rainDrops.push({ x: Math.random() * 1200, y: Math.random() * 600, s: Math.random() * 15 + 10 });
      }

      let clouds = [];
      for (let i = 0; i < 6; i++) {
        clouds.push({ x: Math.random() * 800, y: Math.random() * 200, r: Math.random() * 30 + 20, speed: Math.random() * 0.5 + 0.1 });
      }

      function drawPixelRect(x, y, w, h, c) {
        ctx.fillStyle = c;
        ctx.fillRect(Math.floor(x), Math.floor(y), Math.floor(w), Math.floor(h));
      }

      function drawFrame() {
        frame++;
        const globalTime = performance.now() * 0.05;
        if (canvas.parentElement && canvas.parentElement.clientWidth > 0 &&
          (canvas.width !== canvas.parentElement.clientWidth || canvas.height !== canvas.parentElement.clientHeight)) {
          canvas.width = canvas.parentElement.clientWidth;
          canvas.height = canvas.parentElement.clientHeight;
        }
        const W = canvas.width || 800;
        const H = canvas.height || 400;

        if (isSunset) {
          const grd = ctx.createLinearGradient(0, 0, 0, H * 0.55);
          grd.addColorStop(0, '#2d1b2e'); grd.addColorStop(0.5, '#b04a43'); grd.addColorStop(1, '#df9857');
          ctx.fillStyle = grd; ctx.fillRect(0, 0, W, H);
          ctx.fillStyle = '#ffcc66'; ctx.beginPath(); ctx.arc(W * 0.7, H * 0.35, 50, 0, Math.PI * 2); ctx.fill();
        } else if (!isDay) {
          const grd = ctx.createLinearGradient(0, 0, 0, H * 0.55);
          grd.addColorStop(0, '#0a0f1a'); grd.addColorStop(1, '#1a2538');
          ctx.fillStyle = grd; ctx.fillRect(0, 0, W, H);
          ctx.fillStyle = '#eef3f7'; ctx.beginPath(); ctx.arc(W * 0.8, H * 0.2, 30, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#1a2538'; ctx.beginPath(); ctx.arc(W * 0.8 - 10, H * 0.2 - 5, 25, 0, Math.PI * 2); ctx.fill();
        } else {
          const grd = ctx.createLinearGradient(0, 0, 0, H * 0.55);
          grd.addColorStop(0, '#3a7bd5'); grd.addColorStop(1, '#3a6073');
          ctx.fillStyle = grd; ctx.fillRect(0, 0, W, H);
          ctx.fillStyle = '#fffdf0'; ctx.beginPath(); ctx.arc(W * 0.2, H * 0.2, 40, 0, Math.PI * 2); ctx.fill();
        }

        if (!isDay && !isSunset) {
          for (let i = 0; i < 40; i++) {
            const sx = (i * 97 + globalTime * 0.1) % W;
            const sy = (i * 53) % (H * 0.4);
            if (Math.sin(globalTime * 0.05 + i) > 0.1) drawPixelRect(sx, sy, 2, 2, '#8090a0');
          }
        }

        ctx.fillStyle = isDay ? '#2b3b4a' : (isSunset ? '#36222b' : '#0f141e');
        ctx.beginPath(); ctx.moveTo(0, H * 0.55);
        for(let x=0; x<=W; x+=40) {
            let mH = H * 0.55 - 40 - Math.sin(x * 0.01) * 30 - Math.cos(x * 0.02) * 50;
            ctx.lineTo(x, mH);
        }
        ctx.lineTo(W, H * 0.55); ctx.closePath(); ctx.fill();

        ctx.fillStyle = isDay ? '#1e2c38' : (isSunset ? '#26141a' : '#080b12');
        ctx.beginPath(); ctx.moveTo(0, H * 0.55);
        for(let x=0; x<=W; x+=30) {
            let mH = H * 0.55 - 20 - Math.cos(x * 0.015) * 40 - Math.sin(x * 0.03) * 20;
            ctx.lineTo(x, mH);
        }
        ctx.lineTo(W, H * 0.55); ctx.closePath(); ctx.fill();

        ctx.fillStyle = isDay ? 'rgba(255,255,255,0.7)' : 'rgba(150,150,160,0.3)';
        clouds.forEach(c => {
          c.x += c.speed;
          if (c.x - c.r > W) c.x = -c.r;
          ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2); ctx.arc(c.x + c.r * 0.6, c.y - c.r * 0.3, c.r * 0.8, 0, Math.PI * 2); ctx.arc(c.x - c.r * 0.6, c.y - c.r * 0.2, c.r * 0.7, 0, Math.PI * 2); ctx.fill();
        });

        const groundGrad = ctx.createLinearGradient(0, H * 0.55, 0, H);
        groundGrad.addColorStop(0, isDay ? '#2c402c' : '#1a261a');
        groundGrad.addColorStop(1, isDay ? '#1b291b' : '#0d140d');
        ctx.fillStyle = groundGrad; ctx.fillRect(0, H * 0.55, W, H * 0.45);
        
        const runwayY = H * 0.68;
        const runwayH = 100;
        
        const rwGrad = ctx.createLinearGradient(0, runwayY, 0, runwayY + runwayH);
        rwGrad.addColorStop(0, '#2a2d33'); rwGrad.addColorStop(0.5, '#30353c'); rwGrad.addColorStop(1, '#2a2d33');
        ctx.fillStyle = rwGrad; ctx.fillRect(0, runwayY, W, runwayH);
        
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        for(let x=0; x<W; x+=150) { ctx.fillRect(x, runwayY + 40, 80, 8); ctx.fillRect(x+50, runwayY + 50, 60, 6); }

        ctx.fillStyle = '#ffcc00'; ctx.fillRect(0, runwayY + 2, W, 4); ctx.fillRect(0, runwayY + runwayH - 6, W, 4);
        ctx.fillStyle = '#eeeeee';
        for (let i = 0; i < W; i += 80) ctx.fillRect(i, runwayY + runwayH / 2 - 3, 40, 6);
        
        for (let i = 0; i < W; i += 60) {
          const glow = Math.sin(globalTime * 0.1 + i * 0.05) > 0;
          if (glow && !isDay) {
            ctx.fillStyle = 'rgba(100, 200, 255, 0.4)'; ctx.beginPath(); ctx.arc(i+2, runwayY-4, 8, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = '#6df'; ctx.fillRect(i, runwayY-6, 4, 4); 
            ctx.fillStyle = 'rgba(100, 200, 255, 0.4)'; ctx.beginPath(); ctx.arc(i+2, runwayY+runwayH+4, 8, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = '#6df'; ctx.fillRect(i, runwayY+runwayH+2, 4, 4);
          } else {
            ctx.fillStyle = '#111'; ctx.fillRect(i, runwayY-6, 4, 4); ctx.fillRect(i, runwayY+runwayH+2, 4, 4);
          }
        }

        const hangarW = 120;
        const hangarH = 80;
        for (let i = 0; i < 3; i++) {
          const bx = W * 0.1 + i * W * 0.28;
          const by = H * 0.55 - hangarH + 20;
          
          ctx.fillStyle = '#4a5565';
          ctx.beginPath(); ctx.arc(bx + hangarW/2, by + 20, hangarW/2, Math.PI, 0); ctx.fill();
          
          ctx.fillStyle = '#3a4050'; ctx.fillRect(bx, by + 20, hangarW, hangarH - 20);
          
          ctx.fillStyle = '#10151c'; ctx.fillRect(bx + 15, by + 30, hangarW - 30, hangarH - 30);
          
          for(let s=0; s<hangarW-30; s+=10) {
              ctx.fillStyle = (s/10)%2===0 ? '#ffcc00' : '#111';
              ctx.fillRect(bx + 15 + s, by + 20, 10, 10);
          }
          
          if (!isDay && Math.sin(globalTime * 0.08 + i) > 0) {
             ctx.fillStyle = 'rgba(255,255,100,0.5)'; ctx.beginPath(); ctx.arc(bx+hangarW/2, by+10, 20, 0, Math.PI*2); ctx.fill();
             ctx.fillStyle = '#fff999'; ctx.fillRect(bx+hangarW/2-5, by+8, 10, 4);
          }
          

        }

        {
          const tx = W * 0.82; const tw = 50; const th = H * 0.45; const ty = H * 0.55 - th + 20;
          ctx.fillStyle = '#2a3240'; ctx.fillRect(tx + 10, ty, tw - 20, th);
          ctx.fillStyle = '#3a4050'; ctx.fillRect(tx, ty - 20, tw, 20);
          ctx.fillStyle = '#4fc4d0'; ctx.fillRect(tx + 5, ty - 15, tw - 10, 10);
          ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.fillRect(tx + 5, ty - 15, 10, 10); 
          ctx.fillStyle = '#1c2533'; ctx.beginPath(); ctx.moveTo(tx-5, ty-20); ctx.lineTo(tx+tw+5, ty-20); ctx.lineTo(tx+tw-10, ty-35); ctx.lineTo(tx+10, ty-35); ctx.fill();
          
          if (G.upgrades && G.upgrades.radar) {
              ctx.save(); ctx.translate(tx + tw/2, ty - 45); 
              ctx.fillStyle = '#2c332c'; ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(10, 0); ctx.lineTo(5, -15); ctx.lineTo(-5, -15); ctx.fill();
              ctx.translate(0, -15);
              ctx.rotate(globalTime * 0.05);
              ctx.fillStyle = '#a0aab5'; ctx.beginPath(); ctx.ellipse(0, 0, 25, 8, 0, 0, Math.PI*2); ctx.fill();
              ctx.fillStyle = '#7a8590'; ctx.beginPath(); ctx.ellipse(0, 0, 20, 5, 0, 0, Math.PI*2); ctx.fill();
              ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(-10, -15); ctx.moveTo(0,0); ctx.lineTo(10, -15); ctx.lineTo(-10, -15); ctx.stroke();
              if (Math.sin(globalTime * 0.2) > 0) {
                ctx.fillStyle = '#ff0000'; ctx.beginPath(); ctx.arc(0, -18, 3, 0, Math.PI*2); ctx.fill();
              }
              ctx.restore();
          }
          
          if (G.enemyKnowsUs || G.health < G.maxHealth) G.alarmActive = true;
          if (G.alarmActive) {
            const rotAngle = globalTime * 0.08;
            const isFront = Math.sin(rotAngle) > 0;
            ctx.fillStyle = isFront ? '#ff3333' : '#660000';
            ctx.beginPath(); ctx.arc(tx + tw/2, ty - 40, 4, 0, Math.PI*2); ctx.fill();
            if (isFront) {
              ctx.save(); ctx.translate(tx + tw/2, ty - 40);
              const beamX = Math.cos(rotAngle) * 250; const beamY = Math.sin(rotAngle) * 80 + 40; 
              const grad = ctx.createLinearGradient(0, 0, beamX, beamY);
              grad.addColorStop(0, 'rgba(255, 20, 20, 0.5)'); grad.addColorStop(1, 'rgba(255, 20, 20, 0)');
              ctx.fillStyle = grad; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(beamX - 80, beamY); ctx.lineTo(beamX + 80, beamY); ctx.fill();
              ctx.restore();
            }
          } else {
             ctx.fillStyle = '#660000'; ctx.beginPath(); ctx.arc(tx + tw/2, ty - 40, 4, 0, Math.PI*2); ctx.fill();
          }
        }

        // Upgrades Drawing
        if (G.upgrades && G.upgrades.stealth) {
          const sx = W * 0.65; const sy = runwayY - 10;
          ctx.save(); ctx.translate(sx, sy);
          ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(60, -20); ctx.lineTo(20, -5); ctx.lineTo(60, 10); ctx.fill();
          ctx.fillStyle = '#11151c'; 
          ctx.beginPath(); 
          ctx.moveTo(-10, -5); ctx.lineTo(40, -25); ctx.lineTo(25, -5); ctx.lineTo(35, -5); 
          ctx.lineTo(30, -2); ctx.lineTo(30, 2); ctx.lineTo(35, 5); ctx.lineTo(25, 5); ctx.lineTo(40, 25); 
          ctx.closePath(); ctx.fill();
          ctx.strokeStyle = '#2a3240'; ctx.lineWidth = 1; ctx.stroke();
          ctx.fillStyle = '#051020'; ctx.beginPath(); ctx.moveTo(-5, -2); ctx.lineTo(5, -4); ctx.lineTo(5, 4); ctx.fill();
          ctx.fillStyle = '#44ccff'; ctx.fillRect(28, -8, 4, 3); ctx.fillRect(28, 5, 4, 3);
          ctx.restore();
        }

        if (G.upgrades && G.upgrades.walls) {
          ctx.fillStyle = '#4a5059'; ctx.fillRect(0, H - 40, W, 40);
          ctx.fillStyle = '#30343a';
          for (let wx = 0; wx < W; wx += 80) ctx.fillRect(wx, H - 40, 2, 40);
          for (let wx = 0; wx < W; wx += 40) {
            ctx.fillStyle = '#ffcc00';
            ctx.beginPath(); ctx.moveTo(wx, H - 40); ctx.lineTo(wx + 20, H - 40); ctx.lineTo(wx + 10, H - 30); ctx.lineTo(wx - 10, H - 30); ctx.fill();
            ctx.fillStyle = '#111';
            ctx.beginPath(); ctx.moveTo(wx + 20, H - 40); ctx.lineTo(wx + 40, H - 40); ctx.lineTo(wx + 30, H - 30); ctx.lineTo(wx + 10, H - 30); ctx.fill();
          }
          ctx.fillStyle = '#3a3f47'; ctx.fillRect(0, H * 0.55 - 15, W, 15);
        }

        if (G.upgrades && G.upgrades.aa) {
          const aax = W * 0.72; const aay = H * 0.55 + 20;
          ctx.fillStyle = '#2c332c'; ctx.beginPath(); ctx.moveTo(aax-20, aay); ctx.lineTo(aax+20, aay); ctx.lineTo(aax+15, aay-15); ctx.lineTo(aax-15, aay-15); ctx.fill();
          ctx.save(); ctx.translate(aax, aay-15); ctx.rotate(Math.sin(globalTime * 0.02) * 0.5 - 0.2);
          ctx.fillStyle = '#1a1f1a'; ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI, true); ctx.fill();
          ctx.fillStyle = '#cfd4d0';
          ctx.fillRect(-15, -12, 30, 4); ctx.fillRect(-15, -18, 30, 4);
          ctx.fillStyle = '#ff2222'; ctx.fillRect(-15, -12, 4, 4); ctx.fillRect(-15, -18, 4, 4);
          ctx.restore();
          
          if (G.aaCooldown && G.aaCooldown > 0) {
            ctx.fillStyle = 'rgba(30, 30, 30, 0.8)';
            ctx.beginPath(); ctx.ellipse(aax, aay - 45, 24, 14, 0, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.font = '13px "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('â³ ' + G.aaCooldown, aax, aay - 44);
          }
        }

        if (G.aaDebrisTurns && G.aaDebrisTurns > 0) {
          const dx = W * 0.4; const dy = H * 0.55 + 20;
          ctx.fillStyle = '#333'; ctx.fillRect(dx - 15, dy - 5, 30, 10);
          ctx.fillStyle = '#222'; ctx.fillRect(dx + 10, dy - 12, 15, 12);
          ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(dx - 5, dy, 12, 0, Math.PI*2); ctx.fill();
          if (Math.random() < 0.5) {
              ctx.fillStyle = 'rgba(100,100,100,0.5)';
              ctx.beginPath(); ctx.arc(dx + (Math.random()-0.5)*20, dy - 10 - Math.random()*20, 10+Math.random()*10, 0, Math.PI*2); ctx.fill();
          }
        }

        if (G.upgrades && G.upgrades.eng) {
          const ex = W * 0.05; const ey = H * 0.55 + 10;
          ctx.strokeStyle = '#cda34f'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(ex, ey-50); ctx.moveTo(ex+40, ey); ctx.lineTo(ex+40, ey-50);
          ctx.moveTo(ex, ey-25); ctx.lineTo(ex+40, ey-25); ctx.moveTo(ex, ey-50); ctx.lineTo(ex+40, ey-50);
          ctx.moveTo(ex, ey); ctx.lineTo(ex+40, ey-25); ctx.moveTo(ex, ey-25); ctx.lineTo(ex+40, ey-50); ctx.stroke();
          ctx.strokeStyle = '#d9aa38'; ctx.lineWidth = 4;
          ctx.beginPath(); ctx.moveTo(ex-10, ey); ctx.lineTo(ex-10, ey-80); ctx.lineTo(ex+50, ey-80); ctx.stroke();
          ctx.lineWidth = 1; ctx.strokeStyle = '#fff'; ctx.beginPath(); ctx.moveTo(ex+45, ey-80); ctx.lineTo(ex+45, ey-20); ctx.stroke();
          if (Math.random() < 0.3) {
            ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(ex+20 + (Math.random()-0.5)*10, ey-15 + (Math.random()-0.5)*10, Math.random()*3+1, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = '#aaaaff'; ctx.beginPath(); ctx.arc(ex+20 + (Math.random()-0.5)*20, ey-15 + (Math.random()-0.5)*20, Math.random()*2, 0, Math.PI*2); ctx.fill();
          }
        }

        if (G.upgrades && G.upgrades.ammo) {
          const amx = W * 0.45; const amy = H * 0.55 + 15;
          ctx.fillStyle = '#222'; ctx.fillRect(amx, amy-20, 60, 20);
          ctx.fillStyle = '#333'; ctx.fillRect(amx+5, amy-15, 50, 15);
          ctx.fillStyle = '#111'; ctx.fillRect(amx+15, amy-15, 10, 15); ctx.fillRect(amx+35, amy-15, 10, 15);
          ctx.fillStyle = '#ffaa00'; ctx.fillRect(amx+10, amy-25, 40, 5);
          ctx.fillStyle = '#111'; ctx.fillRect(amx+15, amy-25, 5, 5); ctx.fillRect(amx+25, amy-25, 5, 5); ctx.fillRect(amx+35, amy-25, 5, 5);
          if (Math.sin(globalTime * 0.1) > 0) {
            ctx.fillStyle = '#ff3300'; ctx.beginPath(); ctx.arc(amx+5, amy-22, 2, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(amx+55, amy-22, 2, 0, Math.PI*2); ctx.fill();
          }
        }

        if (isRainy) {
          ctx.strokeStyle = isDay ? 'rgba(150, 180, 200, 0.4)' : 'rgba(200, 220, 255, 0.2)';
          ctx.lineWidth = 1.5; ctx.beginPath();
          rainDrops.forEach(r => {
            ctx.moveTo(r.x, r.y); ctx.lineTo(r.x - r.s * 0.3, r.y + r.s);
            r.y += r.s; r.x -= r.s * 0.3;
            if (r.y > H) { r.y = -10; r.x = Math.random() * W + 100; }
          });
          ctx.stroke();
        }

        if (animState === 'enemy_attack') {
          const mx = W * 0.4 + Math.sin(globalTime * 0.1) * 10;
          const my = -100 + Math.min(frame / 60, 1) * (H * 0.55 + 100);
          if (frame < 60) {
            ctx.fillStyle = 'rgba(255, 0, 0, 0.2)'; ctx.fillRect(0, 0, W, H);
            ctx.fillStyle = '#ddd'; ctx.fillRect(mx - 4, my - 20, 8, 30);
            const fireSize = 10 + Math.random() * 10;
            ctx.fillStyle = '#f90'; ctx.beginPath(); ctx.arc(mx, my - 30 - fireSize / 2, fireSize, 0, Math.PI * 2); ctx.fill();
          } else {
            if (frame === 60 && typeof SFX !== 'undefined') SFX.play("explosion");
            const expProgress = Math.min((frame - 60) / 30, 1);
            const expSize = expProgress * 200;
            const alpha = 1 - expProgress;
            ctx.fillStyle = `rgba(255, 100, 0, ${alpha})`; ctx.beginPath(); ctx.arc(mx, H * 0.55, expSize, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.5})`; ctx.beginPath(); ctx.arc(mx, H * 0.55, expSize * 0.3, 0, Math.PI * 2); ctx.fill();
          }
        }

        if (animState === 'aa_intercept') {
          const mx = W * 0.4 + Math.sin(globalTime * 0.1) * 10;
          let my = -100 + Math.min(frame / 40, 1) * (H * 0.4 + 100);
          
          if (frame < 40) {
            ctx.fillStyle = 'rgba(255, 50, 0, 0.1)'; ctx.fillRect(0, 0, W, H);
            ctx.fillStyle = '#ddd'; ctx.fillRect(mx - 4, my - 20, 8, 30);
            const fireSize = 10 + Math.random() * 10;
            ctx.fillStyle = '#f90'; ctx.beginPath(); ctx.arc(mx, my - 30 - fireSize / 2, fireSize, 0, Math.PI * 2); ctx.fill();
            
            if (frame > 20) {
              const aax = W * 0.72; const aay = H * 0.55 + 20;
              const prog = (frame - 20) / 20;
              const aamX = aax + (mx - aax) * prog;
              const aamY = aay + (my - aay) * prog;
              ctx.fillStyle = '#ff8800'; ctx.fillRect(aamX - 2, aamY, 4, 15);
              ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(aamX, aamY + 15, 6, 0, Math.PI * 2); ctx.fill();
            }
          } else {
            if (frame === 40 && typeof SFX !== 'undefined') SFX.play("explosion");
            const expProgress = Math.min((frame - 40) / 40, 1);
            
            if (expProgress < 0.5) {
                const alpha = 1 - (expProgress * 2);
                const expSize = expProgress * 300;
                ctx.fillStyle = `rgba(255, 150, 0, ${alpha})`; ctx.beginPath(); ctx.arc(mx, H * 0.4, expSize, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.5})`; ctx.beginPath(); ctx.arc(mx, H * 0.4, expSize * 0.3, 0, Math.PI * 2); ctx.fill();
            }

            const debrisY = H * 0.4 + expProgress * (H * 0.15 + 20);
            const debrisX = mx + Math.sin(frame * 0.2) * 20;
            ctx.fillStyle = '#444'; ctx.fillRect(debrisX - 10, debrisY, 20, 10);
            ctx.fillStyle = '#222'; ctx.fillRect(debrisX + 15, debrisY - 10, 10, 15);
            ctx.fillStyle = '#f60'; ctx.beginPath(); ctx.arc(debrisX, debrisY - 5, 8, 0, Math.PI * 2); ctx.fill();
          }
        }

        let px = W * 0.2, py = runwayY + 30, planeScale = 1;
        let planeVisible = true;
        let pilotVisible = true;
        let pilotState = 'pilot_idle';
        let pilotX = px - 90, pilotY = py - 30; 

        if (animState === 'takeoff') {
          if (frame < 30) {
            pilotState = 'pilot_idle';
          } else if (frame < 60) {
            pilotState = 'pilot_salute';
          } else if (frame < 80) {
            pilotState = 'pilot_helmet';
          } else if (frame < 100) {
            pilotState = 'pilot_climb';
            pilotX += (frame - 80) * 2;
            pilotY -= (frame - 80) * 0.8;
          } else {
            pilotVisible = false;
            const pFrame = frame - 100;
            const takeoffDur = 100;
            const planeProgress = Math.min(pFrame / takeoffDur, 1);
            if (planeProgress < 0.4) {
              px = W * 0.2 + planeProgress * W * 0.8; py = runwayY + 30; planeScale = 1;
            } else if (planeProgress < 0.7) {
              const t = (planeProgress - 0.4) / 0.3;
              px = W * 0.52 + t * W * 0.5; py = runwayY + 30 - t * 40; planeScale = 1 - t * 0.2;
            } else {
              const t = (planeProgress - 0.7) / 0.3;
              px = W * 1.02 + t * W * 0.3; py = runwayY - 10 - t * 100; planeScale = 0.8 - t * 0.3;
            }
          }
        }

        let pilotYOffset = (animState === 'idle') ? Math.sin(globalTime * 0.05 + 1) * 2 : 0;
        if (pilotVisible && animState !== 'enemy_attack') {
          drawPixelArt(ctx, pilotX, pilotY + pilotYOffset, 4.5, pilotState); 
        }

        if (planeVisible && animState !== 'enemy_attack') {
          ctx.save();
          ctx.translate(px, py);
          ctx.scale(-1, 1);
          ctx.translate(-px, -py);
          drawDetailedPlane(ctx, px, py, planeScale, frame, animState);
          ctx.restore();
        }

        if (fires.length > 0 || smokes.length > 0) {
          ctx.globalCompositeOperation = 'lighter';
          fires.forEach(f => {
            f.rx += f.vx; f.ry += f.vy; f.life--;
            if (f.life <= 0) {
              f.rx = (Math.random() - 0.5) * 40;
              f.ry = (Math.random() - 0.5) * 10;
              f.life = f.maxLife;
            }
            const origin = fireOrigins[f.originIndex];
            const px = W * origin.x + f.rx;
            const py = H * origin.y + f.ry;
            const alpha = Math.max(0, f.life / f.maxLife);
            const radius = f.size * (0.5 + 0.5 * (1 - alpha));
            
            const grad = ctx.createRadialGradient(px, py, 0, px, py, radius);
            const r = 255;
            const g = Math.floor(200 * alpha);
            grad.addColorStop(0, `rgba(${r}, ${g}, 0, ${alpha})`);
            grad.addColorStop(1, `rgba(${r}, 0, 0, 0)`);
            
            ctx.fillStyle = grad;
            ctx.beginPath(); ctx.arc(px, py, radius, 0, Math.PI * 2); ctx.fill();
          });
          
          ctx.globalCompositeOperation = 'source-over';
          smokes.forEach(f => {
            f.rx += f.vx; f.ry += f.vy; f.life--;
            if (f.life <= 0) {
              f.rx = (Math.random() - 0.5) * 60;
              f.ry = (Math.random() - 0.5) * 20 - 20;
              f.life = f.maxLife;
            }
            const origin = fireOrigins[f.originIndex];
            const px = W * origin.x + f.rx;
            const py = H * origin.y + f.ry;
            const alpha = Math.max(0, f.life / f.maxLife);
            const radius = f.size * (1 + (1 - alpha));
            
            const grad = ctx.createRadialGradient(px, py, 0, px, py, radius);
            grad.addColorStop(0, `rgba(30, 30, 30, ${alpha * 0.7})`);
            grad.addColorStop(1, `rgba(30, 30, 30, 0)`);
            
            ctx.fillStyle = grad;
            ctx.beginPath(); ctx.arc(px, py, radius, 0, Math.PI * 2); ctx.fill();
          });
        }

        ctx.fillStyle = 'rgba(200, 216, 232, 0.7)';
        ctx.font = '16px Thmanyah, sans-serif'; ctx.textAlign = 'right';
        if (G.enemyKnowsUs) {
          ctx.fillStyle = 'rgba(224, 128, 96, 0.8)'; ctx.fillText('âš ï¸ Ø§Ù„Ø¹Ø¯Ùˆ ÙŠØ¹Ù„Ù… Ù…ÙˆÙ‚Ø¹Ùƒ', W - 20, 55);
        }

        if (frame === totalFrames) {
          if (callback) { callback(); callback = null; }
          if (animState !== 'idle') { animState = 'idle'; totalFrames = 60; frame = 0; }
        } else if (animState === 'idle' && frame > totalFrames) {
          frame = 0;
        }
        window.airportAnimFrame = requestAnimationFrame(drawFrame);
      }
      drawFrame();
    }

    // ===== GENERATE ADVICE =====
    function generateAdvice() {
      const pool = [];

      // =========================================
      // WHEN ENEMY IS FOUND - Attack general ALWAYS appears with rich consequences
      // =========================================
      if (G.isEnemyFound) {
        // ALWAYS: Direct targeted strike (main attack option)
        pool.push({
          general: GENERALS[0], // ØµÙ‚Ø± Ø§Ù„Ø­Ø¯ÙŠØ¯ - always the attack general
          action: 'strike',
          target: G.enemyPos,
          title: 'Ø¶Ø±Ø¨Ø© Ø¬ÙˆÙŠØ© Ù…Ø¨Ø§Ø´Ø±Ø©',
          advice: `Ù‚Ø§Ø¹Ø¯Ø© Ø§Ù„Ø¹Ø¯Ùˆ Ù…ÙƒØ´ÙˆÙØ© ÙÙŠ Ø§Ù„Ù‚Ø·Ø§Ø¹ ${getCellName(G.enemyPos)}. Ø£Ù†ØµØ­ Ø¨Ø¶Ø±Ø¨Ø© Ù…Ø±ÙƒØ²Ø© Ø¨ÙƒÙ„ Ù‚ÙˆØªÙ†Ø§ Ø§Ù„Ù†Ø§Ø±ÙŠØ©!`,
          actionLabel: 'ðŸ’¥ ØªÙ†ÙÙŠØ° Ø§Ù„Ø¶Ø±Ø¨Ø© Ø§Ù„Ù…Ø¨Ø§Ø´Ø±Ø©',
          cost: 3,
          consequence: 'Ø³ÙŠÙƒØ´Ù Ø§Ù„Ø¹Ø¯Ùˆ Ù…ÙˆÙ‚Ø¹ Ù…Ø·Ø§Ø±Ù†Ø§ ÙˆØ³ÙŠØ´Ù† Ù‡Ø¬Ù…Ø§Øª Ø£Ù‚ÙˆÙ‰ Ø¨Ù†Ø³Ø¨Ø© 30%',
          consequenceType: 'expose_base'
        });

        // Attack option 2: Stealth strike (lower risk but costs more)
        pool.push({
          general: { name: 'Ø§Ù„Ø¬Ù†Ø±Ø§Ù„ Ø¸Ù„ Ø§Ù„Ù„ÙŠÙ„', rank: 'Ø¹Ù…Ù„ÙŠØ§Øª Ø®Ø§ØµØ©', type: 'stealth', emoji: 'ðŸŒ™', img: 'assets/generals/night_shadow.png' },
          action: 'stealth_strike',
          target: G.enemyPos,
          title: 'Ø¶Ø±Ø¨Ø© ØªØ³Ù„Ù„ÙŠØ© Ù„ÙŠÙ„ÙŠØ©',
          advice: `Ø£Ù‚ØªØ±Ø­ Ù‡Ø¬ÙˆÙ…Ù‹Ø§ ØªØ³Ù„Ù„ÙŠÙ‹Ø§ Ø¨Ø·Ø§Ø¦Ø±Ø§Øª Ø®ÙÙŠØ©. Ø§Ù„Ø¶Ø±Ø¨Ø© Ø£Ø¶Ø¹Ù Ù„ÙƒÙ†Ù‡Ø§ Ù„Ù† ØªÙƒØ´Ù Ù…ÙˆÙ‚Ø¹Ù†Ø§ Ù„Ù„Ø¹Ø¯Ùˆ.`,
          actionLabel: 'ðŸŒ™ ØªÙ†ÙÙŠØ° Ø§Ù„Ø¶Ø±Ø¨Ø© Ø§Ù„ØªØ³Ù„Ù„ÙŠØ©',
          cost: 4,
          consequence: 'Ø¶Ø±Ø¨Ø© Ø£Ø¶Ø¹Ù (Ù‚Ø¯ Ù„Ø§ ØªÙ†Ø¬Ø­) Ù„ÙƒÙ† Ù„Ù† ÙŠÙƒØªØ´Ù Ø§Ù„Ø¹Ø¯Ùˆ Ù…Ø·Ø§Ø±Ù†Ø§',
          consequenceType: 'safe_strike'
        });

        // Attack option 3: Full assault (devastating but very costly)
        pool.push({
          general: { name: 'Ø§Ù„Ø¬Ù†Ø±Ø§Ù„ Ø¹Ø§ØµÙØ© Ø§Ù„Ø­Ø¯ÙŠØ¯', rank: 'Ø³Ù„Ø§Ø­ Ø¬Ùˆ', type: 'airforce', emoji: 'âœˆï¸', img: 'assets/generals/iron_storm.png' },
          action: 'full_assault',
          target: G.enemyPos,
          title: 'Ù‡Ø¬ÙˆÙ… Ø´Ø§Ù…Ù„ Ø¨Ø§Ù„Ø³Ù„Ø§Ø­ Ø§Ù„Ø¬ÙˆÙŠ',
          advice: `Ø£Ù‚ØªØ±Ø­ Ø¥Ø·Ù„Ø§Ù‚ ÙƒÙ„ Ø·Ø§Ø¦Ø±Ø§ØªÙ†Ø§ ÙÙŠ Ù‡Ø¬ÙˆÙ… Ø³Ø§Ø­Ù‚! Ø³ÙŠØ³Ø¨Ø¨ Ø¶Ø±Ø±Ù‹Ø§ Ù…Ø¶Ø§Ø¹ÙÙ‹Ø§ Ù„ÙƒÙ†Ù‡ Ù…ÙƒÙ„Ù Ø¬Ø¯Ù‹Ø§ ÙˆØ³ÙŠØªØ±Ùƒ Ø¯ÙØ§Ø¹Ø§ØªÙ†Ø§ Ù…ÙƒØ´ÙˆÙØ©.`,
          actionLabel: 'ðŸ”¥ Ù‡Ø¬ÙˆÙ… Ø´Ø§Ù…Ù„ Ø³Ø§Ø­Ù‚',
          cost: 6,
          consequence: 'Ø¶Ø±Ø± Ù…Ø¶Ø§Ø¹Ù Ù„ÙƒÙ† Ø§Ù„Ø¹Ø¯Ùˆ Ø³ÙŠÙƒØªØ´Ù Ù…Ø·Ø§Ø±Ù†Ø§ ÙˆÙŠÙ‡Ø§Ø¬Ù… Ù…Ø¨Ø§Ø´Ø±Ø© Ù‡Ø°Ø§ Ø§Ù„Ø¯ÙˆØ±',
          consequenceType: 'full_assault'
        });

        // Defense after being exposed
        if (G.enemyKnowsUs) {
          pool.push({
            general: GENERALS[2], // Ø¯Ø±Ø¹ Ø§Ù„ÙˆØ·Ù†
            action: 'fortify',
            title: 'ØªØ­ØµÙŠÙ† Ø§Ù„Ø¯ÙØ§Ø¹Ø§Øª ÙÙˆØ±Ù‹Ø§',
            advice: 'Ø§Ù„Ø¹Ø¯Ùˆ ÙŠØ¹Ø±Ù Ù…ÙˆÙ‚Ø¹Ù†Ø§! ÙŠØ¬Ø¨ ØªØ­ØµÙŠÙ† Ù‚Ø§Ø¹Ø¯ØªÙ†Ø§ ÙÙˆØ±Ù‹Ø§ Ø£Ùˆ Ø³ØªÙƒÙˆÙ† Ø§Ù„Ø¹ÙˆØ§Ù‚Ø¨ ÙˆØ®ÙŠÙ…Ø©.',
            actionLabel: 'ðŸ° ØªØ­ØµÙŠÙ† Ø¹Ø§Ø¬Ù„',
            cost: 2,
            consequence: 'ÙŠÙ‚Ù„Ù„ Ø§Ø­ØªÙ…Ø§Ù„ Ø§Ù„Ø¥ØµØ§Ø¨Ø© Ù‡Ø°Ø§ Ø§Ù„Ø¯ÙˆØ± Ø¨Ù†Ø³Ø¨Ø© 70%',
            consequenceType: 'fortify'
          });
        }

        // Repair if damaged
        if (G.health < G.maxHealth) {
          pool.push({
            general: GENERALS[2],
            action: 'repair',
            title: 'Ø¥ØµÙ„Ø§Ø­ Ø§Ù„Ù‚Ø§Ø¹Ø¯Ø© Ø§Ù„Ù…ØªØ¶Ø±Ø±Ø©',
            advice: `Ù‚Ø§Ø¹Ø¯ØªÙ†Ø§ Ù…ØªØ¶Ø±Ø±Ø© (${G.health}/${G.maxHealth}). ÙƒÙ„ Ø¯ÙˆØ± Ø¨Ø¯ÙˆÙ† Ø¥ØµÙ„Ø§Ø­ ÙŠØ¹Ù†ÙŠ Ø§Ù‚ØªØ±Ø§Ø¨Ù†Ø§ Ù…Ù† Ø§Ù„Ù‡Ø²ÙŠÙ…Ø©!`,
            actionLabel: 'ðŸ”§ Ø¥ØµÙ„Ø§Ø­ Ø§Ù„Ù‚Ø§Ø¹Ø¯Ø©',
            cost: G.upgrades.eng ? 0 : 2,
            consequence: null,
            consequenceType: null
          });
        }

        // Tactical: diversion
        pool.push({
          general: GENERALS[5], // Ø³ÙŠÙ Ø§Ù„Ø¹Ø¯Ø§Ù„Ø©
          action: 'diversion',
          title: 'Ø®Ø·Ø© ØªÙ…ÙˆÙŠÙ‡ ÙˆØ¥Ù„Ù‡Ø§Ø¡',
          advice: 'Ø£Ù‚ØªØ±Ø­ Ø¥Ø±Ø³Ø§Ù„ Ø·Ø§Ø¦Ø±Ø§Øª Ù…Ø³ÙŠÙ‘Ø±Ø© ÙˆÙ‡Ù…ÙŠØ© Ù„Ø¥Ù„Ù‡Ø§Ø¡ Ø§Ù„Ø¹Ø¯Ùˆ Ø«Ù… Ø¶Ø±Ø¨ Ù‚Ø§Ø¹Ø¯ØªÙ‡ Ù…Ù† Ø§Ù„Ø¬Ù‡Ø© Ø§Ù„Ù…Ø¹Ø§ÙƒØ³Ø©.',
          actionLabel: 'ðŸŽ­ ØªÙ†ÙÙŠØ° Ø®Ø·Ø© Ø§Ù„ØªÙ…ÙˆÙŠÙ‡',
          cost: 3,
          consequence: 'Ù†Ø¬Ø§Ø­ Ø§Ù„Ø¶Ø±Ø¨Ø© ØºÙŠØ± Ù…Ø¶Ù…ÙˆÙ† Ù„ÙƒÙ† Ø¥Ø°Ø§ Ù†Ø¬Ø­ Ø³ÙŠØ±Ø¨Ùƒ Ø§Ù„Ø¹Ø¯Ùˆ ÙˆÙŠÙ‚Ù„Ù„ Ù‡Ø¬Ù…Ø§ØªÙ‡',
          consequenceType: 'diversion'
        });

        // Resource raid 
        pool.push({
          general: GENERALS[4], // Ù‚Ù„Ø¨ Ø§Ù„Ø£Ø³Ø¯
          action: 'resource_raid',
          title: 'ØºØ§Ø±Ø© Ø¹Ù„Ù‰ Ø¥Ù…Ø¯Ø§Ø¯Ø§Øª Ø§Ù„Ø¹Ø¯Ùˆ',
          advice: 'Ø¨Ø¯Ù„Ø§Ù‹ Ù…Ù† Ø¶Ø±Ø¨ Ø§Ù„Ù‚Ø§Ø¹Ø¯Ø© Ù…Ø¨Ø§Ø´Ø±Ø©ØŒ Ø£Ù‚ØªØ±Ø­ Ù‚Ø·Ø¹ Ø¥Ù…Ø¯Ø§Ø¯Ø§Øª Ø§Ù„Ø¹Ø¯Ùˆ Ù„Ø¥Ø¶Ø¹Ø§ÙÙ‡ Ù‚Ø¨Ù„ Ø§Ù„Ø¶Ø±Ø¨Ø© Ø§Ù„Ù‚Ø§Ø¶ÙŠØ©.',
          actionLabel: 'ðŸ›¢ï¸ ØºØ§Ø±Ø© Ø¹Ù„Ù‰ Ø§Ù„Ø¥Ù…Ø¯Ø§Ø¯Ø§Øª',
          cost: 2,
          consequence: 'Ø³ØªØ¶Ø¹Ù Ù‡Ø¬Ù…Ø§Øª Ø§Ù„Ø¹Ø¯Ùˆ Ø§Ù„Ù‚Ø§Ø¯Ù…Ø© Ù„ÙƒÙ†Ù‡ Ø³ÙŠØ¹Ø±Ù Ø§ØªØ¬Ø§Ù‡ Ù‚ÙˆØ§ØªÙ†Ø§',
          consequenceType: 'weaken_enemy'
        });

        if (G.resources <= 1 || G.health <= 2) {
          pool.push({
            general: pickGeneral('versatile'),
            action: 'rest',
            title: 'Ø§Ù„ØªÙ‚Ø§Ø· Ø§Ù„Ø£Ù†ÙØ§Ø³ ÙˆØ£Ø¹Ù…Ø§Ù„ Ø§Ù„ØµÙŠØ§Ù†Ø©',
            advice: 'Ø¥Ø¹Ø·Ø§Ø¡ Ø§Ù„Ø¬Ù†ÙˆØ¯ Ù‚Ø³Ø·Ø§Ù‹ Ù…Ù† Ø§Ù„Ø±Ø§Ø­Ø©ØŒ ÙˆØ¥ØµÙ„Ø§Ø­ Ù…Ø§ ÙŠÙ…ÙƒÙ† Ø¥ØµÙ„Ø§Ø­Ù‡ ÙˆÙØ±Ø² Ø§Ù„Ø£Ø¯ÙˆØ§Øª Ø§Ù„Ù…Ø¯Ù…Ù‘Ø±Ø©.',
            actionLabel: 'ðŸ’¤ ØªØ£ÙƒÙŠØ¯ Ø§Ù„Ø±Ø§Ø­Ø© (+2 Ù…ÙˆØ§Ø±Ø¯ØŒ +1 ØµØ­Ø©)',
            cost: 0,
            consequence: null,
            consequenceType: null
          });
        }

        const firstAttack = pool.shift();
        shuffle(pool);
        // Pick 2 unique generals from remaining, then always include the direct strike
        const remaining = [];
        const usedGen = new Set([firstAttack.general.name]);
        for (const a of pool) {
          if (!usedGen.has(a.general.name)) {
            usedGen.add(a.general.name);
            remaining.push(a);
          }
          if (remaining.length === 2) break;
        }
        G.currentAdvice = [firstAttack, ...remaining];

        if (G.health <= 2 && !G.currentAdvice.some(a => a.action === 'repair')) {
          const repairOption = pool.find(a => a.action === 'repair');
          if (repairOption) G.currentAdvice[1] = repairOption;
        }

        if (G.resources <= 1 && !G.currentAdvice.some(a => a.cost === 0)) {
          const restOption = pool.find(a => a.action === 'rest');
          if (restOption) G.currentAdvice[2] = restOption;
        }

      } else {
        // =========================================
        // ENEMY NOT YET FOUND - exploration/intel focused
        // =========================================

        // Scout
        const scoutCell = getRandomUnknownCell();
        pool.push({
          general: pickGeneral('scout'),
          action: 'scout',
          target: scoutCell,
          title: 'Ø§Ø³ØªØ·Ù„Ø§Ø¹ Ø¬ÙˆÙŠ',
          advice: `Ø£Ù†ØµØ­ Ø¨Ø¥Ø±Ø³Ø§Ù„ Ø·Ø§Ø¦Ø±Ø© Ø§Ø³ØªØ·Ù„Ø§Ø¹ Ù„Ù„Ù‚Ø·Ø§Ø¹ ${getCellName(scoutCell)} Ù„ÙƒØ´Ù Ù…ÙˆØ§Ù‚Ø¹ Ø§Ù„Ø¹Ø¯Ùˆ`,
          actionLabel: 'ðŸ”',
          cost: 1,
          consequence: G.totalScouted > 2 ? 'ÙƒØ«Ø±Ø© Ø§Ù„Ø§Ø³ØªØ·Ù„Ø§Ø¹ Ù‚Ø¯ ØªÙƒØ´Ù Ù†ÙˆØ§ÙŠØ§Ù†Ø§ Ù„Ù„Ø¹Ø¯Ùˆ' : null,
          consequenceType: G.totalScouted > 2 ? 'scout_risk' : null
        });

        // Intel gathering
        pool.push({
          general: pickGeneral('intel'),
          action: 'gather_intel',
          title: 'Ø¬Ù…Ø¹ Ø§Ù„Ù…Ø¹Ù„ÙˆÙ…Ø§Øª',
          advice: 'Ù†Ø­ØªØ§Ø¬ Ù„ØªÙƒØ«ÙŠÙ Ø¹Ù…Ù„ÙŠØ§Øª Ø¬Ù…Ø¹ Ø§Ù„Ù…Ø¹Ù„ÙˆÙ…Ø§Øª Ù„ØªØ¶ÙŠÙŠÙ‚ Ù†Ø·Ø§Ù‚ Ø§Ù„Ø¨Ø­Ø« Ø¹Ù† Ø§Ù„Ø¹Ø¯Ùˆ',
          actionLabel: 'ðŸ•µï¸',
          cost: 2,
          consequence: null,
          consequenceType: null
        });

        // Blind strike
        const strikeCell = getRandomUnknownCell();
        pool.push({
          general: pickGeneral('strike'),
          action: 'blind_strike',
          target: strikeCell,
          title: 'Ø¶Ø±Ø¨Ø© Ø¹Ù…ÙŠØ§Ø¡',
          advice: `Ù„Ø¯ÙŠ Ø­Ø¯Ø³ Ø£Ù† Ø§Ù„Ø¹Ø¯Ùˆ ÙÙŠ Ø§Ù„Ù‚Ø·Ø§Ø¹ ${getCellName(strikeCell)}. Ø£Ù‚ØªØ±Ø­ Ø¶Ø±Ø¨Ø© Ù…Ø¨Ø§Ø´Ø±Ø©!`,
          actionLabel: 'ðŸŽ¯',
          cost: 2,
          consequence: 'Ø¥Ø°Ø§ Ø£Ø®Ø·Ø£Ù†Ø§ Ù†Ø®Ø³Ø± Ø§Ù„Ù…ÙˆØ§Ø±Ø¯ ÙˆØ§Ù„Ø¹Ø¯Ùˆ Ø³ÙŠØ¹Ù„Ù… Ø¨ÙˆØ¬ÙˆØ¯ ØªÙ‡Ø¯ÙŠØ¯',
          consequenceType: 'blind_miss_risk'
        });

        // Defense
        if (G.health < G.maxHealth) {
          pool.push({
            general: pickGeneral('defense'),
            action: 'repair',
            title: 'Ø¥ØµÙ„Ø§Ø­ Ø§Ù„Ù‚Ø§Ø¹Ø¯Ø©',
            advice: 'Ù‚Ø§Ø¹Ø¯ØªÙ†Ø§ Ù…ØªØ¶Ø±Ø±Ø©! ÙŠØ¬Ø¨ Ø¥ØµÙ„Ø§Ø­Ù‡Ø§ ÙÙˆØ±Ù‹Ø§ Ù‚Ø¨Ù„ Ø£Ù† ÙŠØ¶Ø±Ø¨ Ø§Ù„Ø¹Ø¯Ùˆ Ù…Ø¬Ø¯Ø¯Ù‹Ø§',
            actionLabel: 'ðŸ”§ Ø¥ØµÙ„Ø§Ø­ Ø§Ù„Ù‚Ø§Ø¹Ø¯Ø©',
            cost: G.upgrades.eng ? 0 : 2,
            consequence: null,
            consequenceType: null
          });
        }

        // Fortify
        pool.push({
          general: pickGeneral('defense'),
          action: 'fortify',
          title: 'ØªØ­ØµÙŠÙ† Ø§Ù„Ø¯ÙØ§Ø¹Ø§Øª',
          advice: 'Ù†Ø­ØªØ§Ø¬ Ù„ØªØ¹Ø²ÙŠØ² Ø¯ÙØ§Ø¹Ø§ØªÙ†Ø§ Ù„ØµØ¯ Ù‡Ø¬Ù…Ø§Øª Ø§Ù„Ø¹Ø¯Ùˆ Ø§Ù„Ù…Ø­ØªÙ…Ù„Ø©',
          actionLabel: 'ðŸ°',
          cost: 2,
          consequence: null,
          consequenceType: null
        });

        // Balanced
        pool.push({
          general: pickGeneral('versatile'),
          action: 'balanced',
          title: 'Ø®Ø·Ø© Ù…ØªÙˆØ§Ø²Ù†Ø©',
          advice: 'Ø£Ù‚ØªØ±Ø­ ØªÙˆØ²ÙŠØ¹ Ø¬Ù‡ÙˆØ¯Ù†Ø§ Ø¨ÙŠÙ† Ø§Ù„Ø¯ÙØ§Ø¹ ÙˆØ§Ù„Ø§Ø³ØªØ·Ù„Ø§Ø¹ Ù„ØªØ­Ù‚ÙŠÙ‚ Ø§Ù„ØªÙˆØ§Ø²Ù†',
          actionLabel: 'âš–ï¸',
          cost: 2,
          consequence: null,
          consequenceType: null
        });

        // Resource raid
        pool.push({
          general: pickGeneral('tactical'),
          action: 'resource_raid',
          title: 'ØºØ§Ø±Ø© Ø¹Ù„Ù‰ Ø§Ù„Ù…ÙˆØ§Ø±Ø¯',
          advice: 'Ø£Ù‚ØªØ±Ø­ ØªÙ†ÙÙŠØ° ØºØ§Ø±Ø© Ù„Ù„Ø§Ø³ØªÙŠÙ„Ø§Ø¡ Ø¹Ù„Ù‰ Ù…ÙˆØ§Ø±Ø¯ Ø¥Ø¶Ø§ÙÙŠØ© Ù…Ù† Ø§Ù„Ù…Ù†Ø·Ù‚Ø© Ø§Ù„Ù…Ø­Ø§ÙŠØ¯Ø©',
          actionLabel: 'ðŸ›¢ï¸',
          cost: 1,
          consequence: 'Ø®Ø·ÙˆØ±Ø© Ù…ØªÙˆØ³Ø·Ø© ÙˆÙ„ÙƒÙ† Ø§Ù„Ù…ÙƒØ§ÙØ£Ø© ÙƒØ¨ÙŠØ±Ø©',
          consequenceType: 'raid_risk'
        });

        if (G.resources <= 1 || G.health <= 2) {
          pool.push({
            general: pickGeneral('versatile'),
            action: 'rest',
            title: 'Ø§Ù„ØªÙ‚Ø§Ø· Ø§Ù„Ø£Ù†ÙØ§Ø³ ÙˆØ£Ø¹Ù…Ø§Ù„ Ø§Ù„ØµÙŠØ§Ù†Ø©',
            advice: 'Ø¥Ø¹Ø·Ø§Ø¡ Ø§Ù„Ø¬Ù†ÙˆØ¯ Ù‚Ø³Ø·Ø§Ù‹ Ù…Ù† Ø§Ù„Ø±Ø§Ø­Ø©ØŒ ÙˆØ¥ØµÙ„Ø§Ø­ Ù…Ø§ ÙŠÙ…ÙƒÙ† Ø¥ØµÙ„Ø§Ø­Ù‡ ÙˆÙØ±Ø² Ø§Ù„Ø£Ø¯ÙˆØ§Øª Ø§Ù„Ù…Ø¯Ù…Ù‘Ø±Ø©.',
            actionLabel: 'ðŸ’¤ ØªØ£ÙƒÙŠØ¯ Ø§Ù„Ø±Ø§Ø­Ø© (+2 Ù…ÙˆØ§Ø±Ø¯ØŒ +1 ØµØ­Ø©)',
            cost: 0,
            consequence: null,
            consequenceType: null
          });
        }

        shuffle(pool);
        const uniqueAdvice = [];
        const usedGen2 = new Set();
        for (const a of pool) {
          if (!usedGen2.has(a.general.name)) {
            usedGen2.add(a.general.name);
            uniqueAdvice.push(a);
          }
          if (uniqueAdvice.length === 3) break;
        }
        G.currentAdvice = uniqueAdvice;

        if (G.health <= 2 && !G.currentAdvice.some(a => a.action === 'repair')) {
          const repairOption = pool.find(a => a.action === 'repair');
          if (repairOption) G.currentAdvice[1] = repairOption;
        }

        if (G.resources <= 1 && !G.currentAdvice.some(a => a.cost === 0)) {
          const restOption = pool.find(a => a.action === 'rest');
          if (restOption) G.currentAdvice[2] = restOption;
        }
      }
    }

    function pickGeneral(type) {
      const matching = GENERALS.filter(g => g.type === type);
      return matching.length ? matching[Math.floor(Math.random() * matching.length)] : GENERALS[0];
    }

    function getRandomUnknownCell() {
      const unknowns = [];
      for (let i = 0; i < 16; i++) {
        if (G.map[i] === 0) unknowns.push(i);
      }
      return unknowns.length ? unknowns[Math.floor(Math.random() * unknowns.length)] : 0;
    }

    function getCellName(idx) {
      const labels = 'Ø£Ø¨ØªØ«Ø¬Ø­Ø®Ø¯Ø°Ø±Ø²Ø³Ø´ØµØ¶Ø·'.split('');
      return labels[idx] + (Math.floor(idx / 4) + 1);
    }

    function shuffle(arr) {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
    }

    // ===== RENDER GENERALS =====
    function renderGenerals() {
      const row = document.getElementById('generals-row');
      row.innerHTML = '';


      G.currentAdvice.forEach((adv, i) => {
        const card = document.createElement('div');
        card.className = 'general-card';
        card.id = 'general-card-' + i;
        card.innerHTML = `
      <div class="dogtag-left">
        <img src="${adv.general.img}" class="general-avatar" alt="Avatar">
        <div class="dogtag-cost">-${Math.max(0, adv.cost)} ðŸ›¢ï¸</div>
      </div>
      <div class="dogtag-right">
        <div class="general-name">
          <span>${adv.general.emoji}</span>
          <span>${adv.general.name}</span>
        </div>
        <span class="general-rank">${adv.general.rank}</span>
        <div class="dogtag-title">${adv.actionLabel} â€” ${adv.title}</div>
        <div class="general-advice">"${adv.advice}"</div>
        ${adv.consequence ? `<div class="general-consequence">âš ï¸ ${adv.consequence}</div>` : ''}
      </div>
    `;
        card.onclick = () => selectGeneral(i);
        row.appendChild(card);
      });

      let execDiv = document.getElementById('exec-container');
      if (!execDiv) {
        execDiv = document.createElement('div');
        execDiv.id = 'exec-container';
        execDiv.style.cssText = 'width:100%;text-align:center;margin-top:10px;display:flex;justify-content:center;gap:12px;align-items:center;flex-wrap:wrap;';
        row.parentElement.appendChild(execDiv);
      }
      execDiv.innerHTML = `
    <button class="btn btn-gold" id="btn-execute" onclick="executeChoice()" disabled style="font-size:14px;padding:12px 30px;opacity:0.5">ØªÙ†ÙÙŠØ° Ø§Ù„Ø£Ù…Ø±</button>
    <button class="btn" id="btn-skip" onclick="skipTurn()" style="font-size:13px;padding:10px 20px;opacity:0.8;border-color:#4a5565;">â­ï¸ ØªØ®Ø·Ù‘ÙŠ Ø§Ù„Ø¯ÙˆØ± (+1 ðŸ›¢ï¸)</button>
  `;

      initMobileCarousel();
    }

    // ===== MOBILE CAROUSEL =====
    
    function rerollCards() {
      if (G.intel < 3) return;
      G.intel -= 3;
      eventLog('ØªÙ… Ø·Ù„Ø¨ Ø®Ø·Ø· Ø¬Ø¯ÙŠØ¯Ø© Ù…Ù† Ø§Ù„Ù‚ÙŠØ§Ø¯Ø© (-3 Ù…Ø¹Ù„ÙˆÙ…Ø§Øª)');
      if (typeof SFX !== 'undefined' && SFX.playClick) SFX.playClick();
      G.selectedGeneral = -1;
      generateAdvice();
      renderGenerals();
      updateUI();
      
      const row = document.getElementById('generals-row');
      if (row) {
        row.style.animation = 'none';
        void row.offsetWidth;
        row.style.animation = 'notifPop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
      }
    }

    function initMobileCarousel() {
      if (window.innerWidth > 768) return;
      const row = document.getElementById('generals-row');
      const cards = row.querySelectorAll('.general-card');
      if (!cards.length) return;

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.7) {
            entry.target.style.transform = 'scale(1)';
            entry.target.style.opacity = '1';
            entry.target.style.zIndex = '10';
            entry.target.style.filter = 'none';
          } else {
            entry.target.style.transform = 'scale(0.85)';
            entry.target.style.opacity = '0.5';
            entry.target.style.zIndex = '5';
            entry.target.style.filter = 'blur(1px)';
          }
        });
      }, {
        root: row,
        threshold: [0.3, 0.7]
      });

      cards.forEach(card => {
        card.style.transition = 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.4s ease, filter 0.4s ease';
        card.style.transform = 'scale(0.85)';
        card.style.opacity = '0.5';
        card.style.filter = 'blur(1px)';
        observer.observe(card);
      });
    }

    function selectGeneral(idx) {
      if (G.animating) return;
      G.selectedGeneral = idx;
      document.querySelectorAll('#generals-row .general-card').forEach((c, i) => {
        c.classList.toggle('selected', i === idx);
      });
      const btn = document.getElementById('btn-execute');
      if (btn) {
        btn.disabled = false;
        btn.style.opacity = '1';
      }
    }

    // ===== SKIP TURN =====
    function skipTurn() {
      if (G.animating) return;
      G.animating = true;
      setWaitState(true, 'â³ Ø¬Ø§Ø±ÙŠ ØªØ®Ø·ÙŠ Ø§Ù„Ø¯ÙˆØ± ÙˆØ§Ù„Ø¹Ø¯Ùˆ ÙŠØ®Ø·Ø·...');
      document.getElementById('generals-row').innerHTML = '';
      G.resources += 1;
      G.consecutiveWarTurns = 0;
      addLog('â­ï¸ ØªØ®Ø·Ù‘ÙŠ Ø§Ù„Ø¯ÙˆØ± â€” Ø§Ù„Ù‚ÙˆØ§Øª ØªØ¬Ù…Ø¹ Ø¥Ù…Ø¯Ø§Ø¯Ø§Øª Ø¨Ø³ÙŠØ·Ø© (+1 ðŸ›¢ï¸)', 'ally');
      playAirportAnimation(() => {
        G.animating = false;
        endPlayerTurn();
        updateUI();
      }, 'resource_gain');
    }

    // ===== EXECUTE CHOICE =====
    function playExecutionSequence(callback) {
      const overlay = document.getElementById('execution-overlay');
      const textEl = document.getElementById('exec-text');
      const progressFill = document.getElementById('exec-progress-fill');
      
      const seq = ["âš¡ Ø¬Ø§Ø±ÙŠ Ø¥Ø±Ø³Ø§Ù„ Ø§Ù„Ø£ÙˆØ§Ù…Ø± ÙˆØ§Ù„ØªØ­Ø±Ùƒ Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ..."];
      
      let step = 0;
      progressFill.style.width = '0%';
      textEl.classList.remove('show');
      
      overlay.style.display = 'flex';
      overlay.classList.add('active');
      if (typeof SFX !== 'undefined') SFX.play("ui_click");

      function nextStep() {
        if (step >= seq.length) {
           setTimeout(() => {
             overlay.classList.remove('active');
             setTimeout(() => {
               overlay.style.display = 'none';
               if (callback) callback();
             }, 300);
           }, 800);
           return;
        }
        textEl.classList.remove('show');
        setTimeout(() => {
          textEl.textContent = seq[step];
          textEl.classList.add('show');
          progressFill.style.width = '100%';
          step++;
          if (typeof SFX !== 'undefined') SFX.play("hover");
          setTimeout(nextStep, 1000);
        }, 200);
      }
      setTimeout(nextStep, 100);
    }

    // ===== EXECUTE CHOICE =====
    function executeChoice() {
      if (G.selectedGeneral < 0 || G.animating) return;

      const adv = G.currentAdvice[G.selectedGeneral];
      const cost = Math.max(0, adv.cost);

      if (G.resources < cost) {
        showNotification('Ù…ÙˆØ§Ø±Ø¯ ØºÙŠØ± ÙƒØ§ÙÙŠØ©', `ÙŠØªØ·Ù„Ø¨ ${cost} Ù…ÙˆØ§Ø±Ø¯ Ù„ØªÙ†ÙÙŠØ° Ù‡Ø°Ù‡ Ø§Ù„Ø®Ø·Ø©.\nÙ„Ø¯ÙŠÙƒ ${G.resources} ÙÙ‚Ø·.`, [
          { text: 'Ø­Ø³Ù†Ø§Ù‹', action: () => hideNotification() }
        ]);
        return;
      }

      G.animating = true;
      setWaitState(true, 'â³ Ø¬Ø§Ø±ÙŠ ØªÙ†ÙÙŠØ° Ø§Ù„Ø®Ø·Ø©...');
      document.getElementById('generals-row').innerHTML = '';
      
      playExecutionSequence(() => {
        G.resources -= cost;

        const isWarAction = ['strike', 'blind_strike', 'stealth_strike', 'full_assault', 'diversion'].includes(adv.action);
        if (isWarAction) {
          G.consecutiveWarTurns++;
          G.warTurnsStreak++;
        } else {
          G.consecutiveWarTurns = 0;
        }

        addLog(`${adv.general.emoji} ${adv.general.name}: "${adv.title}"`, 'important');

        switch (adv.action) {
          case 'scout': executeScout(adv.target, adv.consequenceType); break;
          case 'gather_intel': executeGatherIntel(); break;
          case 'strike': executeStrike(adv); break;
          case 'blind_strike': executeBlindStrike(adv.target); break;
          case 'stealth_strike': executeStealthStrike(adv); break;
          case 'full_assault': executeFullAssault(adv); break;
          case 'diversion': executeDiversion(adv); break;
          case 'repair': executeRepair(); break;
          case 'fortify': executeFortify(); break;
          case 'balanced': executeBalanced(); break;
          case 'resource_raid': executeResourceRaid(adv.consequenceType); break;
          case 'rest': executeRest(); break;
        }
      });
    }

    function executeRest() {
      playActionAnimation('resource', 'â³ Ø¬Ø§Ø±ÙŠ Ø¥Ø±Ø§Ø­Ø© Ø§Ù„Ù‚ÙˆØ§Øª ÙˆØ¥Ø¬Ø±Ø§Ø¡ Ø§Ù„ØµÙŠØ§Ù†Ø©...', () => {
        G.resources += 2;
        let healLog = '';
        if (G.health < G.maxHealth) {
          G.health++;
          healLog = ' Ùˆ +1 ØµØ­Ø© Ù„Ù„Ù‚Ø§Ø¹Ø¯Ø©';
        }
        let pros = ['ØªØ£Ù…ÙŠÙ† (+2) Ù…ÙˆØ§Ø±Ø¯ ÙˆØ§Ø³ØªØ¹Ø§Ø¯Ø© Ø§Ù„Ù†Ø´Ø§Ø·', 'Ø¥Ø±Ø§Ø­Ø© Ø§Ù„Ø¬Ù†ÙˆØ¯ ÙŠØ®ÙÙ Ù…Ù† Ø®Ø·Ø± Ø§Ù†Ù‡ÙŠØ§Ø± Ø§Ù„Ù…Ø¹Ù†ÙˆÙŠØ§Øª' + (healLog ? 'ØŒ ÙˆØ¥ØµÙ„Ø§Ø­ Ø£Ø¶Ø±Ø§Ø± Ø§Ù„Ù‚Ø§Ø¹Ø¯Ø©' : '')];
        let cons = ['ØªØ±Ùƒ Ø§Ù„ÙØ±ØµØ© Ù„Ù„Ø¹Ø¯Ùˆ Ù„Ù„Ù…Ø¨Ø§Ø¯Ø±Ø© ÙˆØ§Ù„Ø­Ø±ÙƒØ© Ø¨Ø­Ø±ÙŠØ©'];
        let story = "Ø®ÙŠÙ… Ø§Ù„Ù‡Ø¯ÙˆØ¡ Ø¹Ù„Ù‰ Ø§Ù„Ù…Ø·Ø§Ø± Ù„Ø£ÙˆÙ„ Ù…Ø±Ø© Ù…Ù†Ø° Ø¨Ø¯Ø¡ Ø§Ù„Ø¹Ù…Ù„ÙŠØ§Øª. Ø§Ø±ØªØ§Ø­ Ø§Ù„Ø¬Ù†ÙˆØ¯ ÙˆØªÙ„Ù‚Øª Ø§Ù„Ø·Ø§Ø¦Ø±Ø§Øª ØµÙŠØ§Ù†Ø© Ø´Ø§Ù…Ù„Ø©ØŒ Ø¨ÙŠÙ†Ù…Ø§ ÙˆØµÙ„Øª Ø¥Ù…Ø¯Ø§Ø¯Ø§Øª Ø¬Ø¯ÙŠØ¯Ø© Ø¨Ù‡Ø¯ÙˆØ¡ Ø§Ø³ØªØ¹Ø¯Ø§Ø¯Ø§Ù‹ Ù„Ù„Ø¬ÙˆÙ„Ø© Ø§Ù„Ù‚Ø§Ø¯Ù…Ø©.";
        showResultModal("Ø§Ù„ØªÙ‚Ø§Ø· Ø§Ù„Ø£Ù†ÙØ§Ø³ â›º", story, pros, cons, () => {
          addLog(`+2 Ù…ÙˆØ§Ø±Ø¯${healLog} (Ø§Ù„ØªÙ‚Ø§Ø· Ø§Ù„Ø£Ù†ÙØ§Ø³ ÙˆØ£Ø¹Ù…Ø§Ù„ Ø§Ù„ØµÙŠØ§Ù†Ø©)`, 'ally');
          endPlayerTurn(); 
        });
        updateUI();
      });
    }

    
    function showResultModal(title, story, pros, cons, callback) {
      setWaitState(false);
      const html = `
        <div style="font-style: italic; color: #a0b0c0; margin-bottom: 10px; font-size: 0.9em; line-height: 1.4; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px;">"${story}"</div>
        <div class="result-columns">
            <div style="flex: 1; background: rgba(50, 150, 50, 0.1); padding: 8px; border-right: 3px solid #3c3; border-radius: 4px;">
                <h4 style="color: #3c3; margin-top: 0; margin-bottom: 3px; font-size: 0.9em;">Ø§Ù„Ø¥ÙŠØ¬Ø§Ø¨ÙŠØ§Øª</h4>
                <ul style="margin: 0; padding-right: 12px; color: #dfd; font-size: 0.85em;">
                    ${pros.map(p => `<li style="margin-bottom: 3px;">${p}</li>`).join('')}
                </ul>
            </div>
            <div style="flex: 1; background: rgba(200, 50, 50, 0.1); padding: 8px; border-right: 3px solid #f44; border-radius: 4px;">
                <h4 style="color: #f44; margin-top: 0; margin-bottom: 3px; font-size: 0.9em;">Ø§Ù„Ø³Ù„Ø¨ÙŠØ§Øª</h4>
                <ul style="margin: 0; padding-right: 12px; color: #fdd; font-size: 0.85em;">
                    ${cons.map(c => `<li style="margin-bottom: 3px;">${c}</li>`).join('')}
                </ul>
            </div>
        </div>
      `;
      showNotification(title, html, [{ text: 'Ø­Ø³Ù†Ø§Ù‹ØŒ Ø£ÙƒÙ…Ù„', gold: true, action: () => { hideNotification(); if (callback) callback(); } }]);
    }

    // ===== ACTION IMPLEMENTATIONS =====
    function executeScout(target, consequenceType) {
      playActionAnimation('scout', 'ðŸ” Ø¬Ø§Ø±ÙŠ Ø§Ù„Ø§Ø³ØªØ·Ù„Ø§Ø¹...', () => {
        let pros = [];
        let cons = [];
        let story = "";
        let title = "Ù†ØªØ§Ø¦Ø¬ Ø§Ù„Ø§Ø³ØªØ·Ù„Ø§Ø¹ ðŸ”";
        
        if (consequenceType === 'scout_risk' && Math.random() > 0.6) {
          G.enemyAggressionBoost += 0.1;
          cons.push('Ø§Ù„Ø¹Ø¯Ùˆ Ø±ØµØ¯ Ø·Ø§Ø¦Ø±Ø§Øª Ø§Ù„Ø§Ø³ØªØ·Ù„Ø§Ø¹ ÙˆØ£ØµØ¨Ø­ Ø£ÙƒØ«Ø± Ø­Ø°Ø±Ø§Ù‹');
        } else {
            pros.push('Ù…Ù‡Ù…Ø© Ø§Ù„Ø§Ø³ØªØ·Ù„Ø§Ø¹ ØªÙ…Øª Ø¨Ø³Ø±ÙŠØ© ØªØ§Ù…Ø©');
        }

        if (target === G.enemyPos) {
          G.map[target] = 2;
          G.isEnemyFound = true;
          G.intel += 3;
          awardTrophy('eagle_eye');
          title = "Ø§ÙƒØªØ´Ø§Ù Ø­Ø§Ø³Ù…! ðŸŽ¯";
          story = "Ø§Ø®ØªØ±Ù‚Øª Ø·Ø§Ø¦Ø±Ø§Øª Ø§Ù„Ø§Ø³ØªØ·Ù„Ø§Ø¹ Ø§Ù„ØºÙŠÙˆÙ… Ù„ØªÙƒØ´Ù Ø¹Ù† Ù…Ø¬Ù…Ø¹ Ø¹Ø³ÙƒØ±ÙŠ Ø¶Ø®Ù… Ù„Ù„Ø¹Ø¯Ùˆ. Ø£Ø±Ø³Ù„ Ø§Ù„Ø·ÙŠØ§Ø± Ø§Ù„Ø¥Ø­Ø¯Ø§Ø«ÙŠØ§Øª Ø¨Ù„Ù‡ÙØ©: 'Ù„Ù‚Ø¯ ÙˆØ¬Ø¯Ù†Ø§Ù‡Ù…! Ø§Ù„Ù‚Ø§Ø¹Ø¯Ø© Ø§Ù„Ø±Ø¦ÙŠØ³ÙŠØ© ÙÙŠ Ù…ØªÙ†Ø§ÙˆÙ„ Ø£ÙŠØ¯ÙŠÙ†Ø§!'";
          pros.push(`ØªØ­Ø¯ÙŠØ¯ Ø§Ù„Ù…ÙˆÙ‚Ø¹ Ø§Ù„Ø¯Ù‚ÙŠÙ‚ Ù„Ù„Ø¹Ø¯Ùˆ ÙÙŠ Ø§Ù„Ù‚Ø·Ø§Ø¹ ${getCellName(target)}`);
          pros.push('ÙƒØ³Ø¨ +3 Ù†Ù‚Ø§Ø· Ù…Ø¹Ù„ÙˆÙ…Ø§Øª Ø¥Ø¶Ø§ÙÙŠØ©');
          showResultModal(title, story, pros, cons, () => { checkBanterAndEndTurn('recon', true); });
        } else {
          const adj = isAdjacent(target, G.enemyPos);
          G.map[target] = 1;
          G.intel += 1;
          G.totalScouted++;
          pros.push(`Ù…Ø³Ø­ Ø§Ù„Ù‚Ø·Ø§Ø¹ ${getCellName(target)} ÙˆØªØ£ÙƒÙŠØ¯ Ø®Ù„ÙˆÙ‡ Ù…Ù† Ø§Ù„Ù‚ÙˆØ§Ø¹Ø¯ Ø§Ù„Ø±Ø¦ÙŠØ³ÙŠØ©`);
          pros.push('ÙƒØ³Ø¨ +1 Ù†Ù‚Ø§Ø· Ù…Ø¹Ù„ÙˆÙ…Ø§Øª');
          
          if (G.intel >= 10) {
            story = "Ø±ØºÙ… Ø£Ù† Ø§Ù„Ù‚Ø·Ø§Ø¹ ÙØ§Ø±ØºØŒ Ø¥Ù„Ø§ Ø£Ù† Ø·Ø§Ø¦Ø±Ø§ØªÙ†Ø§ Ø§Ù„ØªÙ‚Ø·Øª Ø¢Ø®Ø± Ø¥Ø´Ø§Ø±Ø© Ù†Ø§Ù‚ØµØ© Ù„ÙŠÙƒØªÙ…Ù„ Ù„ØºØ² Ù…ÙˆÙ‚Ø¹ Ø§Ù„Ø¹Ø¯Ùˆ ØªÙ…Ø§Ù…Ø§Ù‹!";
            pros.push('Ø§ÙƒØªÙ…Ù„Øª Ø§Ù„Ù…Ø¹Ù„ÙˆÙ…Ø§Øª Ø§Ù„Ø§Ø³ØªØ®Ø¨Ø§Ø±Ø§ØªÙŠØ© Ø¨Ù†Ø³Ø¨Ø© 100%!');
          } else if (adj) {
            story = "Ø±ØºÙ… Ø£Ù† Ø§Ù„Ù‚Ø·Ø§Ø¹ Ø§Ù„Ù…Ø³ØªÙ‡Ø¯Ù ÙƒØ§Ù† ÙŠØ¨Ø¯Ùˆ Ù…Ù‡Ø¬ÙˆØ±Ø§Ù‹ØŒ Ø§Ù„ØªÙ‚Ø·Øª Ø£Ø¬Ù‡Ø²Ø© Ø§Ù„Ø±ØµØ¯ Ø°Ø¨Ø°Ø¨Ø§Øª Ù„Ø§Ø³Ù„ÙƒÙŠØ© Ù…Ø´ÙØ±Ø© Ù…Ù† Ù…Ø³Ø§ÙØ© Ù‚Ø±ÙŠØ¨Ø©. Ø§Ù„Ø¹Ø¯Ùˆ Ù„ÙŠØ³ Ø¨Ø¨Ø¹ÙŠØ¯ØŒ Ù†Ø­Ù† Ù†Ù‚ØªØ±Ø¨ Ù…Ù† Ø§Ù„Ø¹Ø±ÙŠÙ†!";
            pros.push('ØªÙ… Ø§Ù„ØªÙ‚Ø§Ø· Ø¥Ø´Ø§Ø±Ø§Øª Ù…Ø´Ø¨ÙˆÙ‡Ø©ØŒ Ø§Ù„Ø¹Ø¯Ùˆ ÙÙŠ Ø£Ø­Ø¯ Ø§Ù„Ù‚Ø·Ø§Ø¹Ø§Øª Ø§Ù„Ù…Ø¬Ø§ÙˆØ±Ø©!');
          } else {
            story = "Ø¹Ø§Ø¯Øª Ø·Ø§Ø¦Ø±Ø§ØªÙ†Ø§ Ø¨Ø¹Ø¯ Ù…Ø³Ø­ Ø´Ø§Ù…Ù„ Ù„Ù„Ù‚Ø·Ø§Ø¹ ÙˆÙ„Ù… ØªØ¬Ø¯ Ø³ÙˆÙ‰ ØµÙ…Øª Ù…Ø·Ø¨Ù‚ ÙˆØ·Ø¨ÙŠØ¹Ø© Ù‚Ø§Ø³ÙŠØ©. ÙƒÙ„ Ù…Ù†Ø·Ù‚Ø© ÙØ§Ø±ØºØ© ØªÙ‚Ø±Ø¨Ù†Ø§ Ø®Ø·ÙˆØ© Ù†Ø­Ùˆ Ø§Ù„Ù‡Ø¯Ù Ø§Ù„Ø­Ù‚ÙŠÙ‚ÙŠ.";
            cons.push('Ø§Ù„Ù‚Ø·Ø§Ø¹ Ù†Ø¸ÙŠÙ ÙˆÙ„Ø§ ØªÙˆØ¬Ø¯ Ø¢Ø«Ø§Ø± Ù‚Ø±ÙŠØ¨Ø© Ù„Ù„Ø¹Ø¯Ùˆ');
          }
          showResultModal(title, story, pros, cons, () => { checkBanterAndEndTurn('recon', false); });
        }
        checkScoutTrophy();
        updateUI();
      });
    }

    function executeGatherIntel() {
      playActionAnimation('scout', 'ðŸ•µï¸ Ø¬Ù…Ø¹ Ø§Ù„Ù…Ø¹Ù„ÙˆÙ…Ø§Øª...', () => {
        const intelGain = G.upgrades.radar ? 4 : 2;
        G.intel += intelGain;
        let pros = [`Ø¬Ù…Ø¹ +${intelGain} Ù†Ù‚Ø§Ø· Ù…Ø¹Ù„ÙˆÙ…Ø§Øª Ù‡Ø§Ù…Ø©`];
        let cons = ["Ø§Ø³ØªÙ‡Ù„Ø§Ùƒ Ù„Ù„Ù…ÙˆØ§Ø±Ø¯ ÙˆØ§Ù„ÙˆÙ‚Øª Ø¯ÙˆÙ† Ø§Ù„Ù‚ÙŠØ§Ù… Ø¨Ù‡Ø¬ÙˆÙ… Ù…Ø¨Ø§Ø´Ø±"];
        let story = "Ø¹Ù…Ù„Øª Ø´Ø¨ÙƒØ© Ø¬ÙˆØ§Ø³ÙŠØ³Ù†Ø§ ÙˆØ±Ø§Ø¯Ø§Ø±Ø§ØªÙ†Ø§ Ø¹Ù„Ù‰ Ù…Ø¯Ø§Ø± Ø§Ù„Ø³Ø§Ø¹Ø©ØŒ Ù„Ø¬Ù…Ø¹ Ø§Ù„Ø´Ø°Ø±Ø§Øª Ø§Ù„Ù…ØªÙ†Ø§Ø«Ø±Ø© Ù…Ù† Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ù„ØªØ±ÙƒÙŠØ¨ Ø§Ù„ØµÙˆØ±Ø© Ø§Ù„ÙƒØ§Ù…Ù„Ø© Ù„Ù„Ù…ÙˆÙ‚Ù.";
        
        if (G.intel >= 10 && !G.isEnemyFound) {
          G.isEnemyFound = true;
          G.map[G.enemyPos] = 2;
          awardTrophy('eagle_eye');
          story = "Ø£Ø®ÙŠØ±Ø§Ù‹! ØªÙ‚Ø§Ø·Ø¹Øª Ø®ÙŠÙˆØ· Ø§Ù„Ù…Ø¹Ù„ÙˆÙ…Ø§Øª ÙˆØ§ÙƒØªÙ…Ù„Øª Ø§Ù„ØµÙˆØ±Ø© ÙÙŠ ØºØ±ÙØ© Ø§Ù„Ø¹Ù…Ù„ÙŠØ§Øª. Ù„Ù‚Ø¯ Ù‚Ù…Ù†Ø§ Ø¨ØªØ­Ø¯ÙŠØ¯ Ù…ÙƒØ§Ù† Ø§Ø®ØªØ¨Ø§Ø¡ Ø§Ù„Ø¬Ù†Ø±Ø§Ù„ Ø§Ù„Ù…Ø¹Ø§Ø¯ÙŠ Ø¨Ø´ÙƒÙ„ Ù‚Ø§Ø·Ø¹!";
          pros.push(`Ø§ÙƒØªØ´Ø§Ù Ù…ÙˆÙ‚Ø¹ Ù‚Ø§Ø¹Ø¯Ø© Ø§Ù„Ø¹Ø¯Ùˆ ÙÙŠ Ø§Ù„Ù‚Ø·Ø§Ø¹ ${getCellName(G.enemyPos)}`);
        } else {
          const unknowns = [];
          for (let i = 0; i < 16; i++) if (G.map[i] === 0 && i !== G.enemyPos) unknowns.push(i);
          if (unknowns.length) {
            const reveal = unknowns[Math.floor(Math.random() * unknowns.length)];
            G.map[reveal] = 1;
            pros.push(`ØªØ­Ù„ÙŠÙ„ Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª ÙƒØ´Ù Ø§Ù„Ù‚Ø·Ø§Ø¹ ${getCellName(reveal)} ÙˆØ£ÙƒØ¯ Ø®Ù„ÙˆÙ‡ Ù…Ù† Ø§Ù„Ø¹Ø¯Ùˆ`);
          }
        }
        showResultModal("Ø¬Ù…Ø¹ Ø§Ù„Ù…Ø¹Ù„ÙˆÙ…Ø§Øª ðŸ•µï¸", story, pros, cons, () => { endPlayerTurn(); });
        updateUI();
      });
    }

    // ===== DIRECT STRIKE (exposes our base) =====
    function executeStrike(adv) {
      G.totalStrikes++;
      playActionAnimation('strike', 'ðŸ’¥ Ø¬Ø§Ø±ÙŠ ØªÙ†ÙÙŠØ° Ø§Ù„Ø¶Ø±Ø¨Ø© Ø§Ù„Ø¬ÙˆÙŠØ©...', () => {
        let pros = []; let cons = [];
        let newlyDiscovered = false;
        if (adv.consequenceType === 'expose_base') {
          if (!G.enemyKnowsUs) newlyDiscovered = true;
          G.enemyKnowsUs = true;
          G.enemyAggressionBoost += 0.3;
          if (newlyDiscovered) {
            cons.push('Ø§Ù„Ø¹Ø¯Ùˆ ØªØªØ¨Ø¹ Ù…Ø³Ø§Ø± Ø§Ù„Ø·Ø§Ø¦Ø±Ø§Øª Ø§Ù„Ø¹Ø§Ø¦Ø¯Ø© ÙˆØ§ÙƒØªØ´Ù Ù…ÙˆÙ‚Ø¹ Ù…Ø·Ø§Ø±Ù†Ø§ Ø§Ù„Ø³Ø±ÙŠ!');
          } else {
            cons.push('Ø§Ù„Ø¹Ø¯Ùˆ Ø¨Ø§Øª Ø£ÙƒØ«Ø± Ø§Ø³ØªØ¹Ø¯Ø§Ø¯Ø§Ù‹ ÙˆØ´Ø±Ø§Ø³Ø© Ù„Ù„Ø§Ù†ØªÙ‚Ø§Ù… Ø§Ù„Ù…Ø¨Ø§Ø´Ø±');
          }
        }

        const dmg = G.upgrades.ammo ? 2 : 1;
        G.enemyHp -= dmg;
        G.map[adv.target] = 3;
        pros.push(`Ø¥ØµØ§Ø¨Ø© Ù…Ø¨Ø§Ø´Ø±Ø© ÙˆÙ†Ø§Ø¬Ø­Ø© Ù„Ù‚Ø§Ø¹Ø¯Ø© Ø§Ù„Ø¹Ø¯Ùˆ (-${dmg} ØµØ­Ø©)`);

        if (G.totalStrikes === 1) awardTrophy('first_strike');
        if (G.enemyHp <= 0) { victory(); return; }

        let story = "Ø§Ù†Ù‚Ø¶Ù‘Øª Ø·Ø§Ø¦Ø±Ø§ØªÙ†Ø§ ÙƒØ§Ù„ØµÙ‚ÙˆØ± Ø§Ù„Ø¬Ø§Ø±Ø­Ø© Ù…Ù† Ø¨ÙŠÙ† Ø§Ù„Ø³Ø­Ø¨ØŒ ÙˆØ¯ÙƒØª Ø¯ÙØ§Ø¹Ø§Øª Ø§Ù„Ø¹Ø¯Ùˆ Ø¨Ù‚ÙˆØ© Ù„Ø§ ØªØ±Ø­Ù…. Ø§Ù„Ø¯Ø®Ø§Ù† Ø§Ù„Ù…ØªØµØ§Ø¹Ø¯ Ù…Ù† Ù‚Ø§Ø¹Ø¯ØªÙ‡Ù… ÙŠØ±ÙˆÙŠ Ù‚ØµØ© ØªÙÙˆÙ‚Ù†Ø§ØŒ Ù„ÙƒÙ† ÙÙŠ Ø§Ù„Ø­Ø±Ø¨ØŒ ÙƒÙ„ Ø¶Ø±Ø¨Ø© Ù„Ù‡Ø§ Ø«Ù…Ù†.";
        if (newlyDiscovered) {
          showDiscoveryModal('player_strike', () => {
            showResultModal('Ù†Ø¬Ø§Ø­ Ø§Ù„Ù…Ù‡Ù…Ø© Ø§Ù„Ù‡Ø¬ÙˆÙ…ÙŠØ©! ðŸ’¥', story, pros, cons, () => { endPlayerTurn(); });
            updateUI();
          });
        } else {
          showResultModal('Ù†Ø¬Ø§Ø­ Ø§Ù„Ù…Ù‡Ù…Ø© Ø§Ù„Ù‡Ø¬ÙˆÙ…ÙŠØ©! ðŸ’¥', story, pros, cons, () => { endPlayerTurn(); });
          updateUI();
        }
      });
    }

    // ===== STEALTH STRIKE (safe but weaker) =====
    function executeStealthStrike(adv) {
      G.totalStrikes++;
      playActionAnimation('strike', 'ðŸŒ™ Ø¬Ø§Ø±ÙŠ ØªÙ†ÙÙŠØ° Ø§Ù„Ø¶Ø±Ø¨Ø© Ø§Ù„ØªØ³Ù„Ù„ÙŠØ©...', () => {
        const successChance = G.upgrades.stealth ? 1.0 : 0.55;
        let pros = []; let cons = []; let story = ""; let title = "";

        if (Math.random() < successChance) {
          const dmg = G.upgrades.ammo ? 2 : 1;
          G.enemyHp -= dmg;
          G.map[adv.target] = 3;
          pros.push(`Ù†Ø¬Ø§Ø­ Ø§Ù„ØªØ³Ù„Ù„! Ø¥ØµØ§Ø¨Ø© Ù‚Ø§Ø¹Ø¯Ø© Ø§Ù„Ø¹Ø¯Ùˆ (-${dmg} ØµØ­Ø©)`);
          pros.push('Ù…ÙˆÙ‚Ø¹ Ù…Ø·Ø§Ø±Ù†Ø§ Ù„Ø§ ÙŠØ²Ø§Ù„ Ù‚ÙŠØ¯ Ø§Ù„ÙƒØªÙ…Ø§Ù† Ø§Ù„ØªØ§Ù…');
          story = "ØªØ­Øª Ø¬Ù†Ø­ Ø§Ù„Ø¸Ù„Ø§Ù… ÙˆØªØ®ÙÙŠ Ø§Ù„Ø±Ø§Ø¯Ø§Ø±Ø§ØªØŒ ØªØ³Ù„Ù„Øª Ø·Ø§Ø¦Ø±Ø§Øª Ø§Ù„Ø´Ø¨Ø­ Ù„Ø¶Ø±Ø¨ Ø§Ù„Ù‡Ø¯Ù Ø¨Ø¯Ù‚Ø© Ø¬Ø±Ø§Ø­ÙŠØ© Ø«Ù… Ø§Ù„Ø§Ù†Ø³Ø­Ø§Ø¨ ÙƒØ§Ù„Ø³Ø±Ø§Ø¨ØŒ ØªØ§Ø±ÙƒØ© Ø§Ù„Ø¹Ø¯Ùˆ ÙÙŠ Ø­ÙŠØ±Ø© Ù…Ù† Ø£Ù…Ø±Ù‡ Ø­ÙˆÙ„ Ù…ØµØ¯Ø± Ø§Ù„Ø¶Ø±Ø¨Ø©.";
          title = "Ø¶Ø±Ø¨Ø© ØªØ³Ù„Ù„ÙŠØ© Ù†Ø§Ø¬Ø­Ø©! ðŸŒ™";
          if (G.totalStrikes === 1) awardTrophy('first_strike');
          if (G.enemyHp <= 0) { victory(); return; }
        } else {
          cons.push('Ø§Ù„Ø¹Ø¯Ùˆ Ø§ÙƒØªØ´Ù Ø·Ø§Ø¦Ø±Ø§ØªÙ†Ø§ ÙˆØªØµØ¯Ù‰ Ù„Ù‡Ø§ Ù‚Ø¨Ù„ ØªØ­Ù‚ÙŠÙ‚ Ø¥ØµØ§Ø¨Ø© Ù…Ø¨Ø§Ø´Ø±Ø©');
          pros.push('Ø±ØºÙ… Ø§Ù„ÙØ´Ù„ØŒ Ù„Ù… ÙŠØªÙ…ÙƒÙ† Ø§Ù„Ø¹Ø¯Ùˆ Ù…Ù† ØªØ­Ø¯ÙŠØ¯ Ù…ÙˆÙ‚Ø¹ Ù…Ø·Ø§Ø±Ù†Ø§');
          story = "Ù„Ø³ÙˆØ¡ Ø§Ù„Ø­Ø¸ØŒ Ø§Ù„ØªÙ‚Ø·Øª Ù…Ø³ØªØ´Ø¹Ø±Ø§Øª Ø§Ù„Ø¹Ø¯Ùˆ Ø§Ù„Ù…ØªÙ‚Ø¯Ù…Ø© Ø°Ø¨Ø°Ø¨Ø§Øª Ø§Ù„Ù…Ø­Ø±ÙƒØ§Øª ÙÙŠ Ø§Ù„Ù„Ø­Ø¸Ø© Ø§Ù„Ø£Ø®ÙŠØ±Ø©ØŒ Ù…Ù…Ø§ Ø£Ø¬Ø¨Ø± Ø·Ø§Ø¦Ø±Ø§ØªÙ†Ø§ Ø¹Ù„Ù‰ Ø§Ù„Ø§Ù†Ø³Ø­Ø§Ø¨ Ù„ØªØ¬Ù†Ø¨ ÙØ® Ù…Ø­Ù‚Ù‚ Ø¯ÙˆÙ† Ø¥ØªÙ…Ø§Ù… Ø§Ù„Ù…Ù‡Ù…Ø©.";
          title = "Ø§Ù„Ø¶Ø±Ø¨Ø© ÙØ´Ù„Øª ðŸ˜”";
        }
        showResultModal(title, story, pros, cons, () => { endPlayerTurn(); });
        updateUI();
      });
    }

    // ===== FULL ASSAULT (devastating but very risky) =====
    function executeFullAssault(adv) {
      G.totalStrikes++;
      playActionAnimation('strike', 'ðŸ”¥ Ù‡Ø¬ÙˆÙ… Ø´Ø§Ù…Ù„ Ø¨ÙƒÙ„ Ø§Ù„Ù‚ÙˆØ© Ø§Ù„Ø¬ÙˆÙŠØ©...', () => {
        let pros = []; let cons = [];
        const dmg = G.upgrades.ammo ? 3 : 2;
        G.enemyHp -= dmg;
        G.map[adv.target] = 3;
        pros.push(`Ù‡Ø¬ÙˆÙ… ÙƒØ§Ø³Ø­ Ø¯Ù…Ø± Ø¯ÙØ§Ø¹Ø§Øª Ø§Ù„Ø¹Ø¯Ùˆ Ø¨Ø¶Ø±Ø± Ù…Ø¶Ø§Ø¹Ù (-${dmg} ØµØ­Ø©)`);

        const newlyDiscovered = !G.enemyKnowsUs;
        G.enemyKnowsUs = true;
        G.enemyAggressionBoost += 0.4;
        
        if (newlyDiscovered) cons.push('Ø§Ù„Ø¹Ø¯Ùˆ ÙƒØ´Ù Ù…Ø·Ø§Ø±Ù†Ø§ Ø¨Ø´ÙƒÙ„ Ù‚Ø·Ø¹ÙŠ Ø¨Ø³Ø¨Ø¨ Ø­Ø¬Ù… Ø§Ù„Ù‡Ø¬ÙˆÙ…!');
        cons.push('Ø§Ø±ØªÙØ§Ø¹ ÙƒØ¨ÙŠØ± Ø¬Ø¯Ø§Ù‹ ÙÙŠ Ù…Ø³ØªÙˆÙ‰ Ø¹Ø¯ÙˆØ§Ù†ÙŠØ© Ø§Ù„Ø¹Ø¯Ùˆ');

        if (G.totalStrikes === 1) awardTrophy('first_strike');
        if (G.enemyHp <= 0) { victory(); return; }

        let story = "Ø§Ù„Ø³Ù…Ø§Ø¡ Ø£Ø¸Ù„Ù…Øª Ø¨Ø£Ø³Ø±Ø§Ø¨ Ø·Ø§Ø¦Ø±Ø§ØªÙ†Ø§ ÙÙŠ Ù‡Ø¬ÙˆÙ… Ø´Ø§Ù…Ù„ Ù„Ø§ ÙŠØ¨Ù‚ÙŠ ÙˆÙ„Ø§ ÙŠØ°Ø±. Ø³ÙØ­Ù‚Øª Ù…Ø¨Ø§Ù†ÙŠ Ø§Ù„Ø¹Ø¯Ùˆ ØªØ­Øª ÙˆØ§Ø¨Ù„ Ø§Ù„Ù‚Ù†Ø§Ø¨Ù„ØŒ Ø¥Ù„Ø§ Ø£Ù† Ø¯ÙˆÙŠ Ø§Ù„Ø§Ù†ÙØ¬Ø§Ø±Ø§Øª ÙƒØ´Ù Ù…ÙƒØ§Ù†Ù†Ø§ ÙˆØ¬Ø¹Ù„Ù†Ø§ Ù‡Ø¯ÙØ§Ù‹ ØµØ±ÙŠØ­Ø§Ù‹ Ù„Ù„Ø§Ù†ØªÙ‚Ø§Ù…!";
        
        const counterHit = Math.random() < 0.7;
        if (counterHit) {
          triggerRedAlarm();
          G.health--;
          G.damageWithoutRepair++;
          cons.push('ØªØ¹Ø±Ø¶Ù†Ø§ Ù„Ù‡Ø¬ÙˆÙ… Ù…Ø¶Ø§Ø¯ ÙÙˆØ±ÙŠ ÙˆÙ…ÙˆØ¬Ø¹ (-1 ØµØ­Ø© Ù„Ù„Ù‚Ø§Ø¹Ø¯Ø©)');
          story += " ÙˆÙ„Ù… Ù†ÙƒØ¯ Ù†Ø­ØªÙÙ„ Ø­ØªÙ‰ Ø§Ù†Ù‡Ø§Ù„Øª Ø¹Ù„ÙŠÙ†Ø§ ØµÙˆØ§Ø±ÙŠØ® Ø§Ù„Ø¹Ø¯Ùˆ Ø§Ù„Ø§Ù†ØªÙ‚Ø§Ù…ÙŠØ© ÙÙŠ Ù‡Ø¬ÙˆÙ… Ù…Ø¶Ø§Ø¯ Ø³Ø±ÙŠØ¹ Ø£Ù„Ø­Ù‚ Ø¨Ù†Ø§ Ø£Ø¶Ø±Ø§Ø±Ø§Ù‹ Ø¨Ø§Ù„ØºØ©!";
          if (G.health <= 0) {
            defeat();
            return;
          }
          if (G.health === 1) awardTrophy('survivor');
        } else {
           pros.push('Ù„Ø­Ø³Ù† Ø§Ù„Ø­Ø¸ Ù„Ù… ÙŠØªÙ…ÙƒÙ† Ø§Ù„Ø¹Ø¯Ùˆ Ù…Ù† Ø§Ù„Ø±Ø¯ ÙÙˆØ±Ø§Ù‹ Ø±ØºÙ… Ø´Ø±Ø§Ø³Ø© Ø§Ù„Ù‡Ø¬ÙˆÙ…');
        }

        if (newlyDiscovered) {
          showDiscoveryModal('player_strike', () => {
            showResultModal('Ù‡Ø¬ÙˆÙ… Ø´Ø§Ù…Ù„! ðŸ”¥', story, pros, cons, () => { endPlayerTurn(); });
            updateUI();
          });
        } else {
          showResultModal('Ù‡Ø¬ÙˆÙ… Ø´Ø§Ù…Ù„! ðŸ”¥', story, pros, cons, () => { endPlayerTurn(); });
          updateUI();
        }
      });
    }

    // ===== DIVERSION (confusion tactic) =====
    function executeDiversion(adv) {
      G.totalStrikes++;
      playActionAnimation('strike', 'ðŸŽ­ ØªÙ†ÙÙŠØ° Ø®Ø·Ø© Ø§Ù„ØªÙ…ÙˆÙŠÙ‡ ÙˆØ§Ù„Ø¥Ù„Ù‡Ø§Ø¡...', () => {
        let pros = []; let cons = []; let story = ""; let title = "";
        const success = Math.random() < 0.6;

        if (success) {
          const dmg = G.upgrades.ammo ? 2 : 1;
          G.enemyHp -= dmg;
          G.map[G.enemyPos] = 3;
          G.enemyAggressionBoost = Math.max(0, G.enemyAggressionBoost - 0.2);
          
          pros.push(`Ø¶Ø±Ø¨Ø© Ø§Ù„ØªÙØ§ÙÙŠØ© Ù†Ø§Ø¬Ø­Ø© Ù…Ù† Ø§Ù„Ø®Ù„Ù (-${dmg} ØµØ­Ø©)`);
          pros.push('Ø§Ù„Ø¹Ø¯Ùˆ ÙÙŠ Ø­Ø§Ù„Ø© Ø§Ø±ØªØ¨Ø§Ùƒ Ù…Ù…Ø§ Ù‚Ù„Ù„ Ù…Ù† Ø¹Ø¯ÙˆØ§Ù†ÙŠØªÙ‡ ÙˆØªÙ…Ø§Ø³ÙƒÙ‡');
          story = "Ø§Ø¨ØªÙ„Ø¹Øª Ù‚ÙˆØ§Øª Ø§Ù„Ø¹Ø¯Ùˆ Ø§Ù„Ø·Ø¹Ù…ØŒ Ù…ØªØ¬Ù‡Ø© Ø¨ÙƒÙ„ Ù‚ÙˆØªÙ‡Ø§ Ù†Ø­Ùˆ Ø·Ø§Ø¦Ø±Ø§ØªÙ†Ø§ Ø§Ù„ÙˆÙ‡Ù…ÙŠØ©. ÙÙŠ Ù‡Ø°Ù‡ Ø§Ù„Ø£Ø«Ù†Ø§Ø¡ØŒ Ø§Ù†Ù‚Ø¶Øª Ù‚ÙˆØ§ØªÙ†Ø§ Ø§Ù„Ø­Ù‚ÙŠÙ‚ÙŠØ© Ù…Ù† Ø§Ù„Ø®Ù„Ù ÙƒØ´Ø¨Ø­ Ù‚Ø§ØªÙ„ØŒ Ù…Ø­Ù‚Ù‚Ø© Ø¥ØµØ§Ø¨Ø© Ù…Ø¯Ù…Ø±Ø© Ø¯ÙˆÙ† Ù…Ù‚Ø§ÙˆÙ…Ø© ØªØ°ÙƒØ±.";
          title = "Ø®Ø·Ø© Ø§Ù„ØªÙ…ÙˆÙŠÙ‡ Ù†Ø¬Ø­Øª! ðŸŽ­";
          if (G.totalStrikes === 1) awardTrophy('first_strike');
          if (G.enemyHp <= 0) { victory(); return; }
        } else {
          G.enemyAggressionBoost += 0.1;
          cons.push('ÙØ´Ù„ Ø§Ù„ØªÙ…ÙˆÙŠÙ‡ØŒ ÙˆÙ„Ù… Ù†Ø­Ù‚Ù‚ Ø£ÙŠ Ø¥ØµØ§Ø¨Ø©');
          cons.push('Ø§Ø²Ø¯Ø§Ø¯ ÙˆØ¹ÙŠ Ø§Ù„Ø¹Ø¯Ùˆ ÙˆØªÙƒØªÙŠÙƒØ§ØªÙ‡ Ø§Ù„Ø¯ÙØ§Ø¹ÙŠØ© Ø£ØµØ¨Ø­Øª Ø£ØµÙ„Ø¨');
          story = "ÙƒØ§Ù† Ø¬Ù†Ø±Ø§Ù„ Ø§Ù„Ø¹Ø¯Ùˆ Ø£Ø°ÙƒÙ‰ Ù…Ù† Ø£Ù† ØªÙ†Ø·Ù„ÙŠ Ø¹Ù„ÙŠÙ‡ Ø­ÙŠÙ„Ø© Ø¨Ø³ÙŠØ·Ø©. Ø§Ø³ØªØ·Ø§Ø¹ ØªÙ…ÙŠÙŠØ² Ø§Ù„Ù‡Ø¬ÙˆÙ… Ø§Ù„ÙˆÙ‡Ù…ÙŠ ÙˆØ§Ø­ØªÙØ¸ Ø¨Ù‚ÙˆØ§ØªÙ‡ Ù„Ø­Ù…Ø§ÙŠØ© Ø§Ù„Ù‚Ø§Ø¹Ø¯Ø©ØŒ Ù…Ù…Ø§ Ø£ÙØ´Ù„ Ø®Ø·ØªÙ†Ø§ Ø¨Ø§Ù„ÙƒØ§Ù…Ù„.";
          title = "ÙØ´Ù„ Ø§Ù„ØªÙ…ÙˆÙŠÙ‡ ðŸ˜”";
        }

        showResultModal(title, story, pros, cons, () => { endPlayerTurn(); });
        updateUI();
      });
    }

    function executeBlindStrike(target) {
      G.totalStrikes++;
      playActionAnimation('strike', 'ðŸŽ¯ Ø¬Ø§Ø±ÙŠ ØªÙ†ÙÙŠØ° Ø§Ù„Ø¶Ø±Ø¨Ø© Ø§Ù„Ø§Ø³ØªÙƒØ´Ø§ÙÙŠØ©...', () => {
        let pros = []; let cons = []; let story = ""; let title = "";
        let newlyDiscovered = false;
        
        if (target === G.enemyPos) {
          const dmg = G.upgrades.ammo ? 2 : 1;
          G.enemyHp -= dmg;
          G.map[target] = 3;
          G.isEnemyFound = true;
          if (!G.enemyKnowsUs) newlyDiscovered = true;
          G.enemyKnowsUs = true;
          G.enemyAggressionBoost += 0.2;

          pros.push(`Ø¶Ø±Ø¨Ø© Ø¹Ù…ÙŠØ§Ø¡ Ø§Ø³ØªÙ‚Ø±Øª Ø¨Ù‚Ù„Ø¨ Ù‚Ø§Ø¹Ø¯Ø© Ø§Ù„Ø¹Ø¯Ùˆ Ù…ØµØ§Ø¯ÙØ©! (-${dmg} ØµØ­Ø©)`);
          if (newlyDiscovered) cons.push('Ø§Ù„Ø¹Ø¯Ùˆ Ø§Ø³ØªØ·Ø§Ø¹ ØªØ­Ø¯ÙŠØ¯ Ù…ÙˆÙ‚Ø¹Ù†Ø§ Ù…Ù† Ø®Ù„Ø§Ù„ ØªØªØ¨Ø¹ Ù…Ø³Ø§Ø± Ø§Ù„ØµÙˆØ§Ø±ÙŠØ® Ø§Ù„Ù…Ù‡Ø§Ø¬Ù…Ø©!');
          story = "ÙÙŠ Ù…Ù‚Ø§Ù…Ø±Ø© Ø¬Ø±ÙŠØ¦Ø©ØŒ Ø£Ø±Ø³Ù„Ù†Ø§ Ù‚Ø§Ø°ÙØ§ØªÙ†Ø§ Ù„Ø¶Ø±Ø¨ Ø§Ù„Ø¥Ø­Ø¯Ø§Ø«ÙŠØ§Øª Ø§Ù„Ù…Ø´ØªØ¨Ù‡ Ø¨Ù‡Ø§. ÙˆÙƒØ§Ù†Øª Ø§Ù„Ù…ÙØ§Ø¬Ø£Ø©! Ø§Ù„Ù†ÙŠØ±Ø§Ù† Ø§Ù„Ù…ØªØµØ§Ø¹Ø¯Ø© Ø£ÙƒØ¯Øª Ø£Ù†Ù†Ø§ Ø£ØµØ¨Ù†Ø§ Ø§Ù„Ù‡Ø¯Ù ÙÙŠ Ù…Ù‚ØªÙ„ Ø¨Ø¶Ø±Ø¨Ø© Ø§Ø³ØªØ¨Ø§Ù‚ÙŠØ© Ø¹Ù…ÙŠØ§Ø¡ Ù„Ø§ Ù…Ø«ÙŠÙ„ Ù„Ù‡Ø§.";
          title = "Ù…Ù‚Ø§Ù…Ø±Ø© Ø±Ø§Ø¨Ø­Ø©! ðŸ’¥";
          awardTrophy('eagle_eye');
          if (G.totalStrikes === 1) awardTrophy('first_strike');
          if (G.enemyHp <= 0) { victory(); return; }
        } else {
          G.map[target] = -1;
          cons.push('Ø§Ù„Ø¶Ø±Ø¨Ø© Ø§Ø³ØªÙ‡Ø¯ÙØª Ù‚Ø·Ø§Ø¹Ø§Ù‹ ÙØ§Ø±ØºØ§Ù‹ ÙˆØ£Ù‡Ø¯Ø±Ù†Ø§ ÙØ±ØµØ© Ø°Ù‡Ø¨ÙŠØ©');
          story = "Ø³Ù‚Ø·Øª Ø§Ù„Ù‚Ù†Ø§Ø¨Ù„ Ø¹Ù„Ù‰ Ù‚Ø·Ø§Ø¹ Ù…Ù‚ÙØ± Ù…Ø³Ø¨Ø¨Ø© Ø¯Ù…Ø§Ø±Ø§Ù‹ Ù„Ù„Ø·Ø¨ÙŠØ¹Ø© ÙˆØªØ§Ø±ÙƒØ© Ø¬ÙŠØ´Ù†Ø§ ÙÙŠ Ø¥Ø­Ø¨Ø§Ø· Ø¨Ø³Ø¨Ø¨ Ø¶ÙŠØ§Ø¹ Ø§Ù„ÙØ±ØµØ© Ø§Ù„Ø«Ù…ÙŠÙ†Ø©.";
          title = "Ø¶Ø±Ø¨Ø© ÙØ§Ø´Ù„Ø©!";
          if (Math.random() > 0.5) {
            G.enemyAggressionBoost += 0.05;
            cons.push('Ù†Ø´Ø§Ø·Ù†Ø§ Ø§Ù„Ø¹Ø³ÙƒØ±ÙŠ Ù„ÙØª Ø§Ù†ØªØ¨Ø§Ù‡ Ø§Ù„Ø¹Ø¯Ùˆ ÙˆØ±ÙØ¹ Ù…Ù† Ø¬Ø§Ù‡Ø²ÙŠØªÙ‡');
          }
        }
        
        if (newlyDiscovered) {
          showDiscoveryModal('player_strike', () => {
            showResultModal(title, story, pros, cons, () => { checkBanterAndEndTurn('strike', target === G.enemyPos); });
            updateUI();
          });
        } else {
          showResultModal(title, story, pros, cons, () => { checkBanterAndEndTurn('strike', target === G.enemyPos); });
          updateUI();
        }
      });
    }

    function executeRepair() {
      playActionAnimation('resource', 'ðŸ”§ Ø¬Ø§Ø±ÙŠ Ø¥ØµÙ„Ø§Ø­ Ø§Ù„Ù‚Ø§Ø¹Ø¯Ø©...', () => {
        G.health = Math.min(G.maxHealth, G.health + 1);
        G.damageWithoutRepair = Math.max(0, G.damageWithoutRepair - 1);
        let pros = ['ØªÙ… Ø§Ø³ØªØ¹Ø§Ø¯Ø© (+1) ØµØ­Ø© Ù„Ù„Ù…Ø·Ø§Ø± ÙˆØ§Ù„Ø¯ÙØ§Ø¹Ø§Øª'];
        let cons = ['Ø§Ø³ØªÙ‡Ù„Ø§Ùƒ Ø§Ù„Ø¯ÙˆØ± ÙÙŠ Ø£Ø¹Ù…Ø§Ù„ Ø§Ù„ØµÙŠØ§Ù†Ø© Ø¨Ø¯Ù„Ø§Ù‹ Ù…Ù† Ø§Ù„ØªÙ‚Ø¯Ù… Ø§Ù„Ø¹Ø³ÙƒØ±ÙŠ'];
        let story = "Ø¹Ù…Ù„ Ù…Ù‡Ù†Ø¯Ø³ÙˆÙ†Ø§ ØªØ­Øª Ø§Ù„Ø¶ØºØ· Ù„Ø¥ØµÙ„Ø§Ø­ Ø§Ù„Ù…Ø¯Ø±Ø¬ ÙˆØªØ¯Ø¹ÙŠÙ… Ø§Ù„Ø­ØµÙˆÙ† Ø§Ù„Ù…ØªØ¶Ø±Ø±Ø©. ØµÙˆØª Ø¢Ù„Ø§Øª Ø§Ù„Ù„Ø­Ø§Ù… ÙˆØ§Ù„Ø¨Ù†Ø§Ø¡ Ø£Ø¹Ø§Ø¯ Ø§Ù„Ø±ÙˆØ­ Ø§Ù„Ù…Ø¹Ù†ÙˆÙŠØ© Ù„Ù„Ø¬Ù†ÙˆØ¯ØŒ Ù„ÙŠÙƒÙˆÙ† Ø§Ù„Ù…Ø·Ø§Ø± Ø¬Ø§Ù‡Ø²Ø§Ù‹ Ù„Ø£ÙŠ Ø·Ø§Ø±Ø¦.";
        showResultModal("Ø¹Ù…Ù„ÙŠØ© Ø¥ØµÙ„Ø§Ø­ ðŸ”§", story, pros, cons, () => { endPlayerTurn(); });
        updateUI();
      });
    }

    function executeFortify() {
      G._fortified = true;
      playActionAnimation('resource', 'ðŸ° ØªØ­ØµÙŠÙ† Ø§Ù„Ø¯ÙØ§Ø¹Ø§Øª...', () => {
        let pros = ['ØªÙ‚Ù„ÙŠÙ„ Ø¶Ø±Ø± Ø£ÙŠ Ù‡Ø¬ÙˆÙ… Ù‚Ø§Ø¯Ù… Ø¨Ù†Ø³Ø¨Ø© Ù‡Ø§Ø¦Ù„Ø© Ù„Ù‡Ø°Ø§ Ø§Ù„Ø¯ÙˆØ±'];
        let cons = ['ØªÙƒØ±ÙŠØ³ Ø§Ù„ÙˆÙ‚Øª ÙˆØ§Ù„Ø¬Ù‡Ø¯ Ù„Ù„ØªØ®Ù†Ø¯Ù‚ Ø¹ÙˆØ¶Ø§Ù‹ Ø¹Ù† Ø§Ù„Ù…Ø¨Ø§Ø¯Ø±Ø© Ø¨Ø§Ù„Ù‡Ø¬ÙˆÙ…'];
        let story = "Ø¯ÙˆØª ØµÙØ§Ø±Ø§Øª Ø§Ù„Ø¥Ù†Ø°Ø§Ø± Ù„ØªØ¹Ù„Ù† Ø­Ø§Ù„Ø© Ø§Ù„Ø§Ø³ØªÙ†ÙØ§Ø± Ø§Ù„Ù‚ØµÙˆÙ‰. ØªÙ… ØªÙØ¹ÙŠÙ„ Ù…Ø¶Ø§Ø¯Ø§Øª Ø§Ù„Ø·Ø§Ø¦Ø±Ø§Øª ÙˆÙ†ÙØ´Ø±Øª Ø§Ù„Ø¯Ø¨Ø§Ø¨Ø§Øª Ø­ÙˆÙ„ Ø§Ù„Ù…Ø­ÙŠØ·. Ù‚Ø§Ø¹Ø¯ØªÙ†Ø§ Ø§Ù„Ø¢Ù† Ø¨Ù…Ø«Ø§Ø¨Ø© Ø­ØµÙ† Ù…Ù†ÙŠØ¹ ÙŠØµØ¹Ø¨ Ø§Ø®ØªØ±Ø§Ù‚Ù‡.";
        showResultModal("ØªØ­ØµÙŠÙ† Ø§Ù„Ø¯ÙØ§Ø¹Ø§Øª ðŸ°", story, pros, cons, () => { endPlayerTurn(); });
        updateUI();
      });
    }

    function executeBalanced() {
      playActionAnimation('balanced', 'âš–ï¸ ØªÙ†ÙÙŠØ° Ø§Ù„Ø®Ø·Ø© Ø§Ù„Ù…ØªÙˆØ§Ø²Ù†Ø©...', () => {
        G.intel += 1;
        G.resources += 1;
        let pros = ['ÙƒØ³Ø¨ (+1) Ù†Ù‚Ø§Ø· Ù…Ø¹Ù„ÙˆÙ…Ø§Øª', 'ØªØ£Ù…ÙŠÙ† (+1) Ù…ÙˆØ§Ø±Ø¯ Ø¥Ø¶Ø§ÙÙŠØ©'];
        let cons = ['Ù…ÙƒØ§Ø³Ø¨ Ø¨Ø³ÙŠØ·Ø© Ù…Ù‚Ø§Ø±Ù†Ø© Ø¨Ø§Ù„Ø¹Ù…Ù„ÙŠØ§Øª Ø§Ù„Ù…Ø®ØµØµØ© Ù„Ø¬Ø§Ù†Ø¨ ÙˆØ§Ø­Ø¯'];
        let story = "Ù‚Ø±Ø±Øª Ø§Ù„Ù‚ÙŠØ§Ø¯Ø© Ø§ØªØ¨Ø§Ø¹ Ù†Ù‡Ø¬ Ø­Ø°Ø± ÙˆÙ…ØªÙˆØ§Ø²Ù†ØŒ Ø­ÙŠØ« ØªÙ… Ø¥Ø±Ø³Ø§Ù„ ÙØ±Ù‚ ÙƒØ´Ø§ÙØ© ØµØºÙŠØ±Ø© Ù…Ø¹ ØªØ£Ù…ÙŠÙ† Ø®Ø·ÙˆØ· Ø§Ù„Ø¥Ù…Ø¯Ø§Ø¯ Ø§Ù„Ù…ØªØ§Ø­Ø©. Ø®Ø·ÙˆØ© Ù‡Ø§Ø¯Ø¦Ø© Ù„ØªØ±ØªÙŠØ¨ Ø§Ù„Ø£ÙˆØ±Ø§Ù‚ Ø§Ø³ØªØ¹Ø¯Ø§Ø¯Ø§Ù‹ Ù„Ù„Ù‚Ø±Ø§Ø±Ø§Øª Ø§Ù„ÙƒØ¨ÙŠØ±Ø©.";
        
        if (G.intel >= 10 && !G.isEnemyFound) {
          G.isEnemyFound = true;
          G.map[G.enemyPos] = 2;
          awardTrophy('eagle_eye');
          story += "\n\nØ§Ù„Ø¹Ù…Ù„ÙŠØ© Ø§Ù„Ù…ØªÙˆØ§Ø²Ù†Ø© ÙˆÙØ±Øª Ø§Ù„Ø¬Ø²Ø¡ Ø§Ù„Ù†Ø§Ù‚Øµ Ù…Ù† Ø§Ù„Ù„ØºØ². ØªÙ… Ø±ØµØ¯ ØªØ­Ø±ÙƒØ§Øª Ø§Ù„Ø¹Ø¯Ùˆ ÙˆÙƒØ´Ù Ù…Ù‚Ø±Ù‡ Ø§Ù„Ø³Ø±ÙŠ!";
          pros.push(`Ø§ÙƒØªØ´Ø§Ù Ù…ÙˆÙ‚Ø¹ Ù‚Ø§Ø¹Ø¯Ø© Ø§Ù„Ø¹Ø¯Ùˆ ÙÙŠ Ø§Ù„Ù‚Ø·Ø§Ø¹ ${getCellName(G.enemyPos)}`);
        } else {
          const unknowns = [];
          for (let i = 0; i < 16; i++) if (G.map[i] === 0 && i !== G.enemyPos) unknowns.push(i);
          if (unknowns.length) {
            const reveal = unknowns[Math.floor(Math.random() * unknowns.length)];
            G.map[reveal] = 1;
            pros.push(`Ù…Ø¹Ù„ÙˆÙ…Ø§Øª Ø§Ù„ÙƒØ´Ø§ÙØ© Ø£ÙƒØ¯Øª Ø®Ù„Ùˆ Ø§Ù„Ù‚Ø·Ø§Ø¹ ${getCellName(reveal)} Ù…Ù† Ø§Ù„Ø£Ø¹Ø¯Ø§Ø¡`);
          }
        }
        showResultModal("Ø®Ø·Ø© Ù…ØªÙˆØ§Ø²Ù†Ø© âš–ï¸", story, pros, cons, () => { endPlayerTurn(); });
        updateUI();
      });
    }

    function executeResourceRaid(consequenceType) {
      playActionAnimation('raid', 'ðŸ›¢ï¸ ØªÙ†ÙÙŠØ° Ø§Ù„ØºØ§Ø±Ø©...', () => {
        let pros = []; let cons = []; let story = ""; let title = "";
        if (Math.random() < 0.85) {
          const gain = 3 + Math.floor(Math.random() * 3);
          G.resources += gain;
          pros.push(`ØºÙ†Ø§Ø¡Ù… Ù…Ù…ØªØ§Ø²Ø©! Ø§Ù„Ø­ØµÙˆÙ„ Ø¹Ù„Ù‰ (+${gain}) Ù…ÙˆØ§Ø±Ø¯`);
          story = "Ø§Ù†Ù‚Ø¶Ù‘Øª Ù‚ÙˆØ§ØªÙ†Ø§ Ø§Ù„Ø®Ø§ØµØ© Ø¹Ù„Ù‰ Ù‚ÙˆØ§ÙÙ„ Ø¥Ù…Ø¯Ø§Ø¯ Ø§Ù„Ø¹Ø¯Ùˆ Ø¨Ø³Ø±Ø¹Ø© Ù…Ø°Ù‡Ù„Ø©. ØªÙ…ÙƒÙ†Ø§ Ù…Ù† Ø§Ù„Ø³ÙŠØ·Ø±Ø© Ø¹Ù„Ù‰ Ø§Ù„Ø´Ø§Ø­Ù†Ø§Øª Ø§Ù„Ù…Ù„ÙŠØ¦Ø© Ø¨Ø§Ù„Ø°Ø®ÙŠØ±Ø© ÙˆØ§Ù„ÙˆÙ‚ÙˆØ¯ ÙˆØ§Ù„Ø¹ÙˆØ¯Ø© Ù„Ù„Ù‚Ø§Ø¹Ø¯Ø© Ø¯ÙˆÙ† Ø®Ø³Ø§Ø¦Ø± ØªØ°ÙƒØ±.";
          title = "ØºØ§Ø±Ø© Ù†Ø§Ø¬Ø­Ø©! ðŸ›¢ï¸";
          if (G.resources >= 15) awardTrophy('resourceful');

          if (consequenceType === 'weaken_enemy') {
            G.enemyAggressionBoost = Math.max(0, G.enemyAggressionBoost - 0.15);
            pros.push('Ù†Ù‚Øµ Ø§Ù„Ø¥Ù…Ø¯Ø§Ø¯Ø§Øª Ø£Ø¶Ø¹Ù Ø§Ù„Ø¹Ø¯Ùˆ ÙˆØ®ÙÙ Ù…Ù† Ø­Ø¯Ø© Ù‡Ø¬Ù…Ø§ØªÙ‡');
            story += " Ù‡Ø°Ø§ Ø§Ù„Ù†Ù‚Øµ ÙÙŠ Ø§Ù„Ø¥Ù…Ø¯Ø§Ø¯Ø§Øª Ø³ÙŠØ¬Ø¹Ù„ Ø§Ù„Ø¹Ø¯Ùˆ ÙŠØ¹Ø§Ù†ÙŠ Ù„ØªØ¬Ù‡ÙŠØ² Ù‡Ø¬Ù…Ø§ØªÙ‡ Ø§Ù„Ù‚Ø§Ø¯Ù…Ø©.";
          }
        } else {
          cons.push('Ø¹Ø§Ø¯Øª Ø§Ù„Ù‚ÙˆØ§Øª Ø¨Ø®ÙÙŠ Ø­Ù†ÙŠÙ†ØŒ Ù„Ù… ÙŠØªÙ… Ø¬Ù†ÙŠ Ø£ÙŠ Ù…ÙˆØ§Ø±Ø¯');
          story = "Ø§Ù„Ù‚Ø§ÙÙ„Ø© Ø§Ù„ØªÙŠ Ø§Ø³ØªÙ‡Ø¯ÙÙ†Ø§Ù‡Ø§ ÙƒØ§Ù†Øª ÙØ§Ø±ØºØ©! Ù…Ø¬Ø±Ø¯ ÙØ® Ø£Ùˆ Ù…Ø¹Ù„ÙˆÙ…Ø§Øª Ø®Ø§Ø·Ø¦Ø©. Ø§Ù†Ø³Ø­Ø¨Øª Ù‚ÙˆØ§ØªÙ†Ø§ Ø¨ØµØ¹ÙˆØ¨Ø© Ù‚Ø¨Ù„ Ø£Ù† ØªÙ†Ù‚Ù„Ø¨ Ø§Ù„Ø£Ù…ÙˆØ± Ø¶Ø¯Ù‡Ù….";
          title = "ØºØ§Ø±Ø© ÙØ§Ø´Ù„Ø©";
          if (consequenceType === 'raid_risk') {
            G.enemyAggressionBoost += 0.05;
            cons.push('Ø§Ù„Ø¹Ø¯Ùˆ Ø§Ø³ØªÙ†ÙØ± Ù‚ÙˆØ§ØªÙ‡ Ù„ØµØ¯ Ø§Ù„ØºØ§Ø±Ø© ÙˆØ£ØµØ¨Ø­ Ø£ÙƒØ«Ø± ØªØ£Ù‡Ø¨Ø§Ù‹');
          }
        }
        showResultModal(title, story, pros, cons, () => { endPlayerTurn(); });
        updateUI();
      });
    }

    function playActionAnimation(type, text, callback) {
      document.getElementById('airport-view').scrollIntoView({ behavior: 'smooth', block: 'start' });
      G.animating = true;

      if (type === 'strike' || type === 'scout' || type === 'raid') {
        playAirportAnimation(() => {
          showBattleOverlay(text, type, callback);
        }, 'takeoff');
      } else if (type === 'resource') {
        playAirportAnimation(() => {
          G.animating = false;
          if (callback) callback();
        }, 'resource_gain');
      } else {
        showBattleOverlay(text, type, callback);
      }
    }

    // ===== BATTLE ANIMATION =====
    function showBattleOverlay(text, type, callback) {
      SFX.play("plane");
      const overlay = document.getElementById('battle-overlay');
      const battleText = document.getElementById('battle-text');
      battleText.textContent = text;
      overlay.classList.add('active');

      const canvas = document.getElementById('battleCanvas');
      const ctx = canvas.getContext('2d');

      let frame = 0;
      const maxFrames = 180;

      function animate() {
        frame++;
        ctx.clearRect(0, 0, 800, 400);

        let isDay = G.turn % 2 !== 0;
        let isSunset = G.turn % 4 === 3;
        let isRainy = (G.turn * 7) % 10 < 3;
        const W = 800, H = 400;

        function drawSky(width, height) {
          if (isSunset) {
            const grd = ctx.createLinearGradient(0, 0, 0, height);
            grd.addColorStop(0, '#2d1b2e'); grd.addColorStop(0.5, '#b04a43'); grd.addColorStop(1, '#df9857');
            ctx.fillStyle = grd; ctx.fillRect(0, 0, width, height);
            ctx.fillStyle = '#ffcc66'; ctx.beginPath(); ctx.arc(width * 0.7, height * 0.45, 60, 0, Math.PI * 2); ctx.fill();
          } else if (!isDay) {
            const grd = ctx.createLinearGradient(0, 0, 0, height);
            grd.addColorStop(0, '#0a0f1a'); grd.addColorStop(1, '#1a2538');
            ctx.fillStyle = grd; ctx.fillRect(0, 0, width, height);
            ctx.fillStyle = '#eef3f7'; ctx.beginPath(); ctx.arc(width * 0.8, height * 0.25, 40, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#1a2538'; ctx.beginPath(); ctx.arc(width * 0.8 - 15, height * 0.25 - 8, 35, 0, Math.PI * 2); ctx.fill();
          } else {
            const grd = ctx.createLinearGradient(0, 0, 0, height);
            grd.addColorStop(0, '#3a7bd5'); grd.addColorStop(1, '#3a6073');
            ctx.fillStyle = grd; ctx.fillRect(0, 0, width, height);
            ctx.fillStyle = '#fffdf0'; ctx.beginPath(); ctx.arc(width * 0.2, height * 0.25, 50, 0, Math.PI * 2); ctx.fill();
          }

          if (!isDay && !isSunset) {
            for (let i = 0; i < 40; i++) {
              const sx = (i * 97 + frame * 0.1) % width;
              const sy = (i * 53) % height;
              if (Math.sin(frame * 0.05 + i) > 0.1) {
                ctx.fillStyle = '#8090a0'; ctx.fillRect(sx, sy, 2, 2);
              }
            }
          }
        }

        if (type === 'scout') {
          // --- OPERATIONS ROOM INTERIOR ---
          // Background walls
          ctx.fillStyle = '#11151c';
          ctx.fillRect(0, 0, W, H);
          
          // Window showing sky
          ctx.save();
          ctx.beginPath(); ctx.rect(50, 20, 700, 180); ctx.clip();
          drawSky(W, H);
          
          // Rain inside window
          if (isRainy) {
             ctx.strokeStyle = 'rgba(150, 180, 200, 0.4)'; ctx.lineWidth = 1; ctx.beginPath();
             for (let i = 0; i < 150; i++) {
               let rx = (i * 37 + frame * 10) % W; let ry = (i * 73 + frame * 20) % H;
               ctx.moveTo(rx, ry); ctx.lineTo(rx - 5, ry + 15);
             }
             ctx.stroke();
          }

          // Plane passing by (NO BOMB)
          const px = -100 + frame * 6; // slightly faster since it's just passing
          const py = 80 + Math.sin(frame * 0.08) * 10;
          ctx.save(); ctx.translate(px, py); ctx.scale(-1, 1); ctx.translate(-px, -py);
          drawDetailedPlane(ctx, px, py, 1.2, frame, 'idle');
          ctx.restore();
          
          ctx.restore(); // End window clip

          // Window Frame
          ctx.strokeStyle = '#222'; ctx.lineWidth = 10;
          ctx.strokeRect(50, 20, 700, 180);
          ctx.beginPath(); ctx.moveTo(400, 20); ctx.lineTo(400, 200); ctx.stroke();

          // Operations Room Foreground (Radar & Monitors)
          ctx.fillStyle = '#0a0d14';
          ctx.fillRect(0, 200, W, 200);
          
          // Giant Radar Screen in center
          ctx.fillStyle = '#051a05';
          ctx.beginPath(); ctx.arc(400, 300, 80, 0, Math.PI*2); ctx.fill();
          ctx.strokeStyle = '#0f0'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(400, 300, 80, 0, Math.PI*2); ctx.stroke();
          ctx.beginPath(); ctx.arc(400, 300, 40, 0, Math.PI*2); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(400, 220); ctx.lineTo(400, 380); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(320, 300); ctx.lineTo(480, 300); ctx.stroke();
          
          // Sweeping radar line
          ctx.save();
          ctx.translate(400, 300);
          ctx.rotate(frame * 0.05);
          ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -80); ctx.stroke();
          const rgrd = ctx.createLinearGradient(0, 0, 40, -80);
          rgrd.addColorStop(0, 'rgba(0, 255, 0, 0.4)');
          rgrd.addColorStop(1, 'rgba(0, 255, 0, 0)');
          ctx.fillStyle = rgrd;
          ctx.beginPath(); ctx.moveTo(0,0); ctx.arc(0, 0, 80, -Math.PI/2, -Math.PI/6); ctx.fill();
          ctx.restore();

          // Blips on Radar
          if (frame % 60 > 10) {
            ctx.fillStyle = '#0f0';
            ctx.beginPath(); ctx.arc(430, 270, 4, 0, Math.PI*2); ctx.fill();
            if (frame % 60 > 30) {
               ctx.beginPath(); ctx.arc(360, 330, 3, 0, Math.PI*2); ctx.fill();
            }
          }

          // Computer desks and glowing monitors
          ctx.fillStyle = '#1a2230';
          ctx.fillRect(100, 320, 150, 80);
          ctx.fillRect(550, 320, 150, 80);
          
          ctx.fillStyle = '#000';
          ctx.fillRect(120, 280, 60, 40); ctx.fillRect(600, 280, 60, 40);
          ctx.strokeStyle = '#333'; ctx.lineWidth = 3;
          ctx.strokeRect(120, 280, 60, 40); ctx.strokeRect(600, 280, 60, 40);
          
          // Data streams on monitors
          ctx.fillStyle = '#0ff';
          ctx.fillRect(125, 285 + (frame%20)*1.5, 40, 2);
          ctx.fillRect(125, 295 + ((frame+10)%20)*1.5, 30, 2);
          
          ctx.fillStyle = '#f0f';
          ctx.fillRect(605, 310 - (frame%15)*2, 35, 2);
          ctx.fillRect(605, 315 - ((frame+5)%15)*2, 20, 2);

        } else if (type === 'balanced') {
          // --- SECURING SUPPLY LINES ---
          drawSky(W, H * 0.75);

          // Draw Ground (Desert/Dirt)
          ctx.fillStyle = isDay ? '#8b7020' : (isSunset ? '#5a3a1a' : '#1a201a');
          ctx.fillRect(0, 300, W, 100);

          // Draw Road
          ctx.fillStyle = isDay ? '#333' : (isSunset ? '#222' : '#111');
          ctx.beginPath(); ctx.moveTo(0, 330); ctx.lineTo(W, 330); ctx.lineTo(W, 390); ctx.lineTo(0, 400); ctx.fill();
          
          // Draw Road dashed lines
          ctx.fillStyle = isSunset ? '#aa8866' : '#ddccaa';
          for (let i = 0; i < 10; i++) {
             let lx = (i * 100 - frame * 0.5) % W;
             if (lx < 0) lx += W;
             ctx.fillRect(lx, 360, 40, 5);
          }

          // Draw Supply Crates
          ctx.fillStyle = isDay ? '#5c4033' : '#2a1a11';
          ctx.fillRect(200, 270, 80, 50);
          ctx.fillRect(290, 290, 50, 30);
          ctx.fillStyle = '#111';
          ctx.fillRect(200, 280, 80, 5); ctx.fillRect(235, 270, 5, 50); // bands
          
          ctx.fillStyle = isSunset ? '#2a1010' : '#3a4a3a'; // military boxes
          ctx.fillRect(140, 290, 50, 40);

          // Draw Soldiers guarding the road
          const soldierScale = 4;
          const yPos = 250; // properly standing on the road (26 * 4 = 104px tall)
          
          // Slight bobbing for idle, none for guard
          const idleY = yPos + Math.sin(frame * 0.1) * 2;
          
          drawPixelArt(ctx, 350, yPos, soldierScale, 'soldier_guard');
          drawPixelArt(ctx, 500, idleY + 5, soldierScale, 'soldier_idle');
          drawPixelArt(ctx, 650, yPos - 10, soldierScale, 'soldier_guard');
          drawPixelArt(ctx, 50, idleY + 10, soldierScale, 'soldier_idle');

          if (isRainy) {
             ctx.strokeStyle = 'rgba(150, 180, 200, 0.4)'; ctx.lineWidth = 1; ctx.beginPath();
             for (let i = 0; i < 150; i++) {
               let rx = (i * 37 + frame * 10) % W; let ry = (i * 73 + frame * 20) % H;
               ctx.moveTo(rx, ry); ctx.lineTo(rx - 5, ry + 15);
             }
             ctx.stroke();
          }

        } else {
          // --- NORMAL OUTDOOR BOMBING SCENE (Strike / Raid) ---
          drawSky(W, H * 0.75);

          // Draw Ground
          ctx.fillStyle = isDay ? '#2b3b4a' : (isSunset ? '#36222b' : '#0f141e');
          ctx.fillRect(0, 300, W, 100);

          // Draw Ground Targets
          const targetX = 625;
          if (type === 'raid') {
            const cx = 800 - frame * 1.5;
            ctx.fillStyle = isSunset ? '#2c1e1e' : '#3a4a3a';
            ctx.fillRect(cx, 270, 60, 30);
            ctx.fillRect(cx + 60, 280, 20, 20); 
            ctx.fillRect(cx - 80, 275, 50, 25);
            ctx.fillRect(cx - 30, 285, 15, 15);
            ctx.fillStyle = '#111';
            ctx.beginPath(); ctx.arc(cx + 10, 300, 10, 0, Math.PI*2); ctx.arc(cx + 50, 300, 10, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(cx - 70, 300, 10, 0, Math.PI*2); ctx.arc(cx - 40, 300, 10, 0, Math.PI*2); ctx.fill();
          } else {
            ctx.fillStyle = isSunset ? '#1a1010' : (isDay ? '#2a3a2a' : '#1a202a');
            ctx.fillRect(520, 260, 180, 40);
            ctx.fillStyle = '#151a22';
            ctx.fillRect(540, 270, 20, 20); ctx.fillRect(580, 270, 20, 20); ctx.fillRect(620, 270, 20, 20);
            
            ctx.fillStyle = isSunset ? '#1a1010' : (isDay ? '#3a4a3a' : '#1f2530');
            ctx.fillRect(540, 180, 10, 80);
            ctx.fillRect(530, 180, 30, 5); 
            ctx.beginPath(); ctx.moveTo(545, 180); ctx.lineTo(545, 150); ctx.stroke(); 
            ctx.fillStyle = 'red'; ctx.fillRect(543, 145, 4, 4); 

            ctx.fillStyle = isSunset ? '#221515' : (isDay ? '#4a5a4a' : '#2a303a');
            ctx.fillRect(640, 240, 20, 20); 
            ctx.beginPath(); ctx.ellipse(650, 230, 30, 10, Math.PI/4, 0, Math.PI*2); ctx.fill(); 
            ctx.beginPath(); ctx.moveTo(650, 230); ctx.lineTo(630, 210); ctx.strokeStyle='#111'; ctx.lineWidth=2; ctx.stroke(); 
          }

          const px = 100 + frame * 3;
          const py = 80 + Math.sin(frame * 0.08) * 15;

          ctx.save();
          ctx.translate(px, py);
          ctx.scale(-1, 1);
          ctx.translate(-px, -py);
          drawDetailedPlane(ctx, px, py, 1.4, frame, 'idle');
          ctx.restore();

          if (frame > 40 && frame < 90) {
             const dropProgress = (frame - 40) / 50;
             const startX = 100 + 40 * 3;
             const startY = 80 + Math.sin(40 * 0.08) * 15;
             const targetEx = type === 'raid' ? 800 - 90 * 1.5 + 30 : 610;
             const targetEy = 280;
             
             const bombX = startX + (targetEx - startX) * dropProgress;
             const bombY = startY + (targetEy - startY) * Math.pow(dropProgress, 2);
             
             ctx.save();
             ctx.globalCompositeOperation = 'lighter';
             for(let t=0; t<5; t++) {
               ctx.fillStyle = `rgba(255, ${150 - t*30}, 0, ${1 - t*0.2})`;
               ctx.beginPath(); ctx.arc(bombX - t*3, bombY - t*6, 3, 0, Math.PI*2); ctx.fill();
             }
             ctx.restore();

             ctx.fillStyle = '#222';
             ctx.beginPath(); ctx.ellipse(bombX, bombY, 12, 6, Math.PI/3, 0, Math.PI*2); ctx.fill();
             ctx.fillStyle = '#555';
             ctx.beginPath(); ctx.ellipse(bombX+4, bombY-2, 3, 2, Math.PI/3, 0, Math.PI*2); ctx.fill(); 
          }

          if (frame >= 90) {
            const ef = frame - 90;
            const ex = type === 'raid' ? 800 - 90 * 1.5 + 30 : 610;
            const ey = 280;
            
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            
            // Initial Flash
            if (ef < 10) {
               ctx.fillStyle = `rgba(255, 255, 255, ${1 - ef/10})`;
               ctx.beginPath(); ctx.arc(ex, ey, 100 + ef*10, 0, Math.PI*2); ctx.fill();
            }
            
            // Fire Core and Sparks
            if (ef < 50) {
               const coreRadius = 40 + ef * 2.5;
               const coreAlpha = 1 - ef/50;
               const grad = ctx.createRadialGradient(ex, ey, 0, ex, ey, coreRadius);
               grad.addColorStop(0, `rgba(255, 255, 100, ${coreAlpha})`);
               grad.addColorStop(0.2, `rgba(255, 150, 0, ${coreAlpha * 0.8})`);
               grad.addColorStop(1, 'rgba(255, 0, 0, 0)');
               ctx.fillStyle = grad;
               ctx.beginPath(); ctx.arc(ex, ey, coreRadius, 0, Math.PI*2); ctx.fill();
               
               for (let i = 0; i < 30; i++) {
                 const seed = (i * 137) % 100 / 100;
                 const angle = seed * Math.PI + Math.PI; // top half hemisphere
                 const speed = 2 + seed * 8;
                 const sx = ex + Math.cos(angle) * speed * ef;
                 const sy = ey + Math.sin(angle) * speed * ef + (ef * ef * 0.05); // pseudo-gravity
                 const sparkAlpha = Math.max(0, coreAlpha - seed * 0.2);
                 ctx.fillStyle = `rgba(255, 200, 50, ${sparkAlpha})`;
                 ctx.beginPath(); ctx.arc(sx, sy, 2 + seed*3, 0, Math.PI*2); ctx.fill();
               }
            }
            
            ctx.globalCompositeOperation = 'source-over';
            
            // Expanding Smoke Cloud
            if (ef < 90) {
               const smokeRadius = 40 + ef * 3;
               const smokeAlpha = Math.max(0, (1 - Math.pow(ef/90, 2)) * 0.9);
               const sgrad = ctx.createRadialGradient(ex, ey - ef*0.6, 0, ex, ey - ef*0.6, smokeRadius);
               sgrad.addColorStop(0, `rgba(40, 40, 40, ${smokeAlpha})`);
               sgrad.addColorStop(1, 'rgba(30, 30, 30, 0)');
               ctx.fillStyle = sgrad;
               ctx.beginPath(); ctx.arc(ex, ey - ef*0.6, smokeRadius, 0, Math.PI*2); ctx.fill();
               
               // Secondary smoke puffs
               for(let i = 0; i < 7; i++) {
                 const seed = (i * 73) % 100 / 100;
                 const px = ex + (seed - 0.5) * smokeRadius * 1.5;
                 const py = ey - ef*(0.4 + seed*0.5) - (seed*25);
                 const pradius = smokeRadius * (0.4 + seed*0.6);
                 const pgrad = ctx.createRadialGradient(px, py, 0, px, py, pradius);
                 pgrad.addColorStop(0, `rgba(50, 50, 50, ${smokeAlpha})`);
                 pgrad.addColorStop(1, 'rgba(50, 50, 50, 0)');
                 ctx.fillStyle = pgrad;
                 ctx.beginPath(); ctx.arc(px, py, pradius, 0, Math.PI*2); ctx.fill();
               }
            }
            ctx.restore();
          }
          
          if (isRainy) {
             ctx.strokeStyle = 'rgba(150, 180, 200, 0.4)';
             ctx.lineWidth = 1;
             ctx.beginPath();
             for (let i = 0; i < 150; i++) {
               let rx = (i * 37 + frame * 10) % W;
               let ry = (i * 73 + frame * 20) % H;
               ctx.moveTo(rx, ry);
               ctx.lineTo(rx - 5, ry + 15);
             }
             ctx.stroke();
          }
        }

        for (let s = 0; s < 15; s++) {
          ctx.fillStyle = '#384858';
          ctx.fillRect((s * 61) % 800, (s * 37) % 200, 2, 2);
        }

        if (frame < maxFrames) {
          requestAnimationFrame(animate);
        } else {
          setTimeout(() => {
            overlay.classList.remove('active');
            G.animating = false;
            if (callback) callback();
          }, 400);
        }
      }

      animate();
    }

    // ===== ENEMY TURN =====
    
    function buildBanterHTML(img1, name1, color1, msg1, img2, name2, color2, msg2) {
      return 
        <div style="display: flex; flex-direction: column; gap: 10px; padding-top: 5px; direction: rtl;">
          <div style="display: flex; align-items: flex-start; gap: 10px; background: rgba(255,255,255,0.05); padding: 10px; border-radius: 10px; border-right: 3px solid ; text-align: right;">
             <img src="" style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px; border: 2px solid ; flex-shrink: 0; box-shadow: 0 4px 8px rgba(0,0,0,0.5);">
             <div>
               <b style="color:; font-size: 1.05em; display: block; margin-bottom: 3px;"></b>
               <span style="font-size: 0.9em; line-height: 1.4; color: #ddd;">""</span>
             </div>
          </div>
          <div style="display: flex; align-items: flex-start; flex-direction: row-reverse; gap: 10px; background: rgba(255,255,255,0.05); padding: 10px; border-radius: 10px; border-left: 3px solid ; text-align: left;">
             <img src="" style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px; border: 2px solid ; flex-shrink: 0; box-shadow: 0 4px 8px rgba(0,0,0,0.5);">
             <div style="width: 100%;">
               <b style="color:; font-size: 1.05em; display: block; margin-bottom: 3px;"></b>
               <span style="font-size: 0.9em; line-height: 1.4; color: #ddd; display: block;" dir="rtl">""</span>
             </div>
          </div>
        </div>
      ;
    }

    function checkBanterAndEndTurn(actionType, success) {
      if (!success) {
        if (actionType === 'strike') {
          const banterText = `<b style="color:#d9534f">Ø§Ù„Ø¬Ù†Ø±Ø§Ù„ Ø§Ù„Ù…Ù‡Ù†Ø¯Ø³:</b> "Ø£Ù„Ù… Ø£Ù‚Ù„ Ù„Ùƒ Ù„Ø§ ØªØ³ØªÙ…Ø¹ Ù„Ø¬Ù†Ø±Ø§Ù„ Ø§Ù„Ù‡Ø¬ÙˆÙ…ØŒ Ø§Ù„Ø·Ø§Ø¦Ø±Ø§Øª ØªØ­ØªØ§Ø¬ Ù„Ù„ØµÙŠØ§Ù†Ø© ÙˆØ§Ù„ÙˆÙ‚ÙˆØ¯ ÙˆÙ„ÙŠØ³ Ù„Ù„Ø­Ù…Ø§Ø³ Ø§Ù„ÙØ§Ø±Øº."<br><br><b style="color:#f0ad4e">Ø¬Ù†Ø±Ø§Ù„ Ø§Ù„Ù‡Ø¬ÙˆÙ…:</b> "Ø§Ù„Ø¯ÙØ§Ø¹ Ù„Ù† ÙŠÙ†Ù‡ÙŠ Ù‡Ø°Ù‡ Ø§Ù„Ø­Ø±Ø¨ ÙŠØ§ Ø³ÙŠØ¯ÙŠØŒ Ø£Ø¹Ø·Ù†ÙŠ Ø§Ù„Ø¥Ø°Ù† ÙˆØ³Ø£Ø­ÙŠÙ„ Ù…Ø·Ø§Ø±Ù‡Ù… Ø¥Ù„Ù‰ Ø±Ù…Ø§Ø¯!"`;
          setTimeout(() => {
            showNotification('Ù…Ù†Ø§ÙˆØ´Ø§Øª Ø§Ù„Ù‚ÙŠØ§Ø¯Ø© ðŸ—£ï¸', banterText, [{ text: 'Ù…ØªØ§Ø¨Ø¹Ø©', gold: true, action: () => { hideNotification(); endPlayerTurn(); } }]);
          }, 100);
          return;
        }
        if (actionType === 'recon') {
          const banterText = `<b style="color:#f0ad4e">Ø¬Ù†Ø±Ø§Ù„ Ø§Ù„Ù‡Ø¬ÙˆÙ…:</b> "Ù„Ù‚Ø¯ Ø£Ø¶Ø¹Ù†Ø§ Ù…ÙˆØ§Ø±Ø¯Ù†Ø§ Ø¹Ù„Ù‰ Ø§Ù„ØªÙ‚Ø§Ø· ØµÙˆØ± Ù„Ù„Ø±Ù…Ø§Ù„! Ù„Ùˆ Ø£Ø¹Ø·ÙŠØªÙ†ÙŠ Ù‡Ø°Ù‡ Ø§Ù„Ù…ÙˆØ§Ø±Ø¯ Ù„Ø¯Ù…Ø±ØªÙ‡Ù…."<br><br><b style="color:#5bc0de">Ø¬Ù†Ø±Ø§Ù„ Ø§Ù„Ø§Ø³ØªØ·Ù„Ø§Ø¹:</b> "Ø§Ù„Ù‚ØªØ§Ù„ Ø§Ù„Ø£Ø¹Ù…Ù‰ Ø§Ù†ØªØ­Ø§Ø±. Ø¯Ø¹Ù†ÙŠ Ø£ÙƒØ´Ù Ù„Ùƒ Ù…Ø§ ÙŠØ®ØªØ¨Ø¦ ÙÙŠ Ø§Ù„Ø¸Ù„Ø§Ù… Ø£ÙˆÙ„Ø§Ù‹."`;
          setTimeout(() => {
            showNotification('Ù…Ù†Ø§ÙˆØ´Ø§Øª Ø§Ù„Ù‚ÙŠØ§Ø¯Ø© ðŸ—£ï¸', banterText, [{ text: 'Ù…ØªØ§Ø¨Ø¹Ø©', gold: true, action: () => { hideNotification(); endPlayerTurn(); } }]);
          }, 100);
          return;
        }
        if (actionType === 'raid') {
          const banterText = `<b style="color:#d9534f">Ø§Ù„Ø¬Ù†Ø±Ø§Ù„ Ø§Ù„Ù…Ù‡Ù†Ø¯Ø³:</b> "Ù‡Ù„ Ø§Ù‚ØªÙ†Ø¹Øª Ø§Ù„Ø¢Ù† ÙŠØ§ Ø³ÙŠÙ Ø§Ù„Ø¹Ø¯Ø§Ù„Ø©ØŸ Ø§Ù„Ù‚ÙˆØ§Øª Ø§Ù„Ø®Ø§ØµØ© Ù„Ø§ ØªÙ†ÙØ¹ Ø¥Ø°Ø§ Ù„Ù… ØªØ¬Ø¯ Ù…Ø§ ØªØ³Ø±Ù‚Ù‡! ÙƒØ§Ù† Ø§Ù„Ø£Ø¬Ø¯Ø± ØªØ±Ùƒ Ø§Ù„Ù…ÙˆØ§Ø±Ø¯ Ù„ØªØ¹Ø²ÙŠØ² Ø¯ÙØ§Ø¹Ø§ØªÙ†Ø§."<br><br><b style="color:#5bc0de">Ø§Ù„Ø¬Ù†Ø±Ø§Ù„ Ø³ÙŠÙ:</b> "Ø§Ù„ØªÙƒØªÙŠÙƒØ§Øª Ø§Ù„Ø¬Ø±ÙŠØ¦Ø© ØªØ­Ù…Ù„ Ø§Ù„Ù…Ø®Ø§Ø·Ø±. Ø§Ù„Ø¬Ù„ÙˆØ³ Ø®Ù„Ù Ø§Ù„Ø¬Ø¯Ø±Ø§Ù† Ù„Ù† ÙŠØ­Ø³Ù… Ø§Ù„Ù…Ø¹Ø±ÙƒØ©ØŒ Ø¨Ù„ ÙŠØ¤Ø¬Ù„ Ø§Ù„Ù‡Ø²ÙŠÙ…Ø© ÙÙ‚Ø·."`;
          setTimeout(() => {
            showNotification('Ù…Ù†Ø§ÙˆØ´Ø§Øª Ø§Ù„Ù‚ÙŠØ§Ø¯Ø© ðŸ—£ï¸', banterText, [{ text: 'Ù…ØªØ§Ø¨Ø¹Ø©', gold: true, action: () => { hideNotification(); endPlayerTurn(); } }]);
          }, 100);
          return;
        }
      }
      endPlayerTurn();
    }

    function endPlayerTurn() {
      setWaitState(true, 'â³ Ø§Ù„Ø¹Ø¯Ùˆ ÙŠØ®Ø·Ø· ÙˆÙŠØªØ­Ø±Ùƒ...');
      // Check rest trophy
      if (G.warTurnsStreak >= 3 && !['strike', 'blind_strike', 'stealth_strike', 'full_assault', 'diversion'].includes(G.currentAdvice[G.selectedGeneral]?.action)) {
        G.tookRest = true;
        awardTrophy('warrior_rest');
        G.warTurnsStreak = 0;
      }

      G.resources += 1;
      addLog('+1 Ù…ÙˆØ§Ø±Ø¯ (Ø¥Ù†ØªØ§Ø¬ Ø§Ù„Ù…Ø·Ø§Ø±)', '');

      setTimeout(() => enemyTurn(), 800);
    }

    function enemyTurn() {
      addLog('â€” Ø¯ÙˆØ± Ø§Ù„Ø¹Ø¯Ùˆ â€”', 'danger');

      // Base attack chance + aggression boost from consequences
      let attackChance = 0.35 + G.turn * 0.02 + G.enemyAggressionBoost;

      // If enemy knows our location, MUCH higher attack chance
      if (G.enemyKnowsUs) {
        attackChance = 0.95; // Relentless attack!
        addLog('âš ï¸ Ø§Ù„Ø¹Ø¯Ùˆ ÙŠØ³ØªÙ‡Ø¯Ù Ù…Ø·Ø§Ø±Ùƒ Ø¨Ø¯Ù‚Ø©!', 'danger');
      }

      attackChance = Math.min(attackChance, 0.95);

      const fortified = G._fortified || false;
      G._fortified = false;

      let newlyDiscoveredByEnemy = false;

      if (Math.random() < attackChance) {
        if (fortified && Math.random() < 0.7) {
          addLog('ðŸ° Ø§Ù„ØªØ­ØµÙŠÙ†Ø§Øª ØµØ¯Øª Ù‡Ø¬ÙˆÙ… Ø§Ù„Ø¹Ø¯Ùˆ Ø¨Ø§Ù„ÙƒØ§Ù…Ù„!', 'important');
          if (!G.enemyKnowsUs) {
             G.enemyKnowsUs = true;
             newlyDiscoveredByEnemy = true;
             triggerRedAlarm();
             addLog('ðŸš¨ Ø§Ù„Ø¹Ø¯Ùˆ Ø±ØµØ¯ Ù…ÙˆÙ‚Ø¹ Ø§Ù†Ø·Ù„Ø§Ù‚ Ø¯ÙØ§Ø¹Ø§ØªÙ†Ø§! ØªÙ… ÙƒØ´Ù Ø§Ù„Ù‚Ø§Ø¹Ø¯Ø©!', 'danger');
          }
        } else if (G.upgrades.aa && (G.aaCooldown || 0) <= 0) {
          G.animating = true;
          playAirportAnimation(() => {
            G.animating = false;
            G.resources++;
            G.intel += 2;
            addLog('ðŸ›¢ï¸ Ù…Ù†Ø¸ÙˆÙ…Ø© Ø§Ù„Ø¯ÙØ§Ø¹ Ø§Ù„Ø¬ÙˆÙŠ Ø£Ø³Ù‚Ø·Øª Ù‡Ø¬ÙˆÙ… Ø§Ù„Ø¹Ø¯Ùˆ Ø¨Ù†Ø³Ø¨Ø© 100%! (+1 Ù…ÙˆØ§Ø±Ø¯ØŒ +2 Ù…Ø¹Ù„ÙˆÙ…Ø§Øª)', 'ally');
            G.aaCooldown = 2;
            G.aaDebrisTurns = 1;

            if (!G.enemyKnowsUs) {
               G.enemyKnowsUs = true;
               newlyDiscoveredByEnemy = true;
               triggerRedAlarm();
               addLog('ðŸš¨ Ø§Ù„Ø¹Ø¯Ùˆ Ø±ØµØ¯ Ù…Ø³Ø§Ø± ØµÙˆØ§Ø±ÙŠØ®Ù†Ø§ Ø§Ù„Ø¯ÙØ§Ø¹ÙŠØ©! ØªÙ… ÙƒØ´Ù Ø§Ù„Ù‚Ø§Ø¹Ø¯Ø©!', 'danger');
            }

            updateUI();
            G.turn++;
            setTimeout(() => {
              G.selectedGeneral = -1;
              updateUI();
              if (newlyDiscoveredByEnemy) {
                showDiscoveryModal('enemy_blind_hit', () => {
                  startTurn();
                });
              } else {
                startTurn();
              }
            }, 1200);
          }, 'aa_intercept');

          return; // Stop current function, continuation happens in callback
        } else {
          G.animating = true;
          playAirportAnimation(() => {
            G.animating = false;
            G.health--;
            G.damageWithoutRepair++;

            let resourceLossMsg = "";
            if (G.resources > 0) {
               G.resources--;
               resourceLossMsg = "<br><br><span style='color:#ff4444; font-weight:bold;'>[-1 Ù…ÙˆØ§Ø±Ø¯ Ø¨Ø³Ø¨Ø¨ Ø¯Ù…Ø§Ø± Ø§Ù„Ù…Ø³ØªÙˆØ¯Ø¹Ø§Øª]</span>";
               addLog('ðŸ”¥ ØªØ¶Ø±Ø± Ù…Ø³ØªÙˆØ¯Ø¹ Ø§Ù„Ø¥Ù…Ø¯Ø§Ø¯Ø§Øª (-1 Ù…ÙˆØ§Ø±Ø¯)', 'danger');
            }

            const boughtUpgrades = Object.keys(G.upgrades).filter(k => G.upgrades[k]);
            let hitUpgrade = false;
            if (boughtUpgrades.length > 0 && Math.random() < 0.5) {
              const toDestroy = boughtUpgrades[Math.floor(Math.random() * boughtUpgrades.length)];
              G.upgrades[toDestroy] = false;
              const names = { radar: 'Ø±Ø§Ø¯Ø§Ø± Ø§Ù„ÙƒØ´Ù Ø§Ù„Ù…Ø¨ÙƒØ±', walls: 'Ø§Ù„Ø¬Ø¯Ø±Ø§Ù† Ø§Ù„Ù…Ø­ØµÙ†Ø©', aa: 'Ù…Ù†Ø¸ÙˆÙ…Ø© Ø§Ù„Ø¯ÙØ§Ø¹ Ø§Ù„Ø¬ÙˆÙŠ', stealth: 'Ø§Ù„Ø³Ø±Ø¨ Ø§Ù„Ø´Ø¨Ø­ÙŠ', eng: 'Ø§Ù„ÙˆØ­Ø¯Ø© Ø§Ù„Ù‡Ù†Ø¯Ø³ÙŠØ©', ammo: 'Ø§Ù„Ø°Ø®Ø§Ø¦Ø± Ø§Ù„Ø®Ø§Ø±Ù‚Ø©' };
              addLog(`âš ï¸ ØªÙ„Ù‚ÙŠÙ†Ø§ Ø¶Ø±Ø¨Ø© Ù‚ÙˆÙŠØ© ØªØ³Ø¨Ø¨Øª Ø¨ØªØ­Ø·Ù… [${names[toDestroy]}]! (-1 ØµØ­Ø© Ø§Ù„Ù‚Ø§Ø¹Ø¯Ø©)`, 'danger');
              hitUpgrade = true;
              if (toDestroy === 'walls') {
                G.maxHealth--;
                if (G.health > G.maxHealth) G.health = G.maxHealth;
              }
            }

            if (G.enemyKnowsUs && !newlyDiscoveredByEnemy) {
              if (!hitUpgrade) addLog('ðŸ’¥ Ø¶Ø±Ø¨Ø© Ø¯Ù‚ÙŠÙ‚Ø© Ø£ØµØ§Ø¨Øª Ø§Ù„Ù…Ø·Ø§Ø± Ù…Ø¨Ø§Ø´Ø±Ø© ÙˆØªØ³Ø¨Ø¨Øª Ø¨Ø£Ø¶Ø±Ø§Ø± Ø¨Ù„ÙŠØºØ©! (-1 ØµØ­Ø© Ø§Ù„Ù‚Ø§Ø¹Ø¯Ø©)', 'danger');
              triggerRedAlarm();
            } else {
              if (!hitUpgrade) addLog('ðŸ’¥ Ù‚Ø°ÙŠÙØ© Ø¹Ø´ÙˆØ§Ø¦ÙŠØ© Ù„Ù„Ø¹Ø¯Ùˆ Ø³Ù‚Ø·Øª ÙˆØ£Ù„Ø­Ù‚Øª Ø£Ø¶Ø±Ø§Ø±Ø§Ù‹ Ù…Ø¨Ø§Ø´Ø±Ø© Ø¨Ø§Ù„Ù…Ø·Ø§Ø±! (-1 ØµØ­Ø© Ø§Ù„Ù‚Ø§Ø¹Ø¯Ø©)', 'danger');
              G.enemyKnowsUs = true;
              newlyDiscoveredByEnemy = true;
              triggerRedAlarm();
            }

            document.getElementById('screen-game').style.boxShadow = 'inset 0 0 100px rgba(204,51,51,0.3)';
            setTimeout(() => {
              document.getElementById('screen-game').style.boxShadow = 'none';
            }, 500);

            if (G.health === 1) awardTrophy('survivor');

            if (G.health <= 0) {
              defeat();
              return;
            }

            updateUI();
            G.turn++;
            setTimeout(() => {
              G.selectedGeneral = -1;
              updateUI();

              const attackMessages = [
                 "Ø§Ù„Ø¬Ù…ÙŠØ¹ Ø¥Ù„Ù‰ Ø§Ù„Ù…Ù„Ø§Ø¬Ø¦! Ø¥Ù†Ù‡Ù… ÙŠÙ‚ØµÙÙˆÙ† Ø§Ù„Ù…Ø·Ø§Ø±! ðŸ’¥",
                 "Ø§Ù„Ù†ÙŠØ±Ø§Ù† ØªÙ„ØªÙ‡Ù… Ù…Ø³ØªÙˆØ¯Ø¹ Ø§Ù„Ø°Ø®ÙŠØ±Ø© Ø§Ù„Ø§Ø­ØªÙŠØ§Ø·ÙŠ! Ù†Ø­ØªØ§Ø¬ ÙØ±Ù‚ Ø§Ù„Ø¥Ø·ÙØ§Ø¡ ÙÙˆØ±Ø§Ù‹! ðŸ”¥",
                 "Ù„Ù‚Ø¯ Ø¯Ù…Ø±ÙˆØ§ Ø§Ù„Ù…Ø¯Ø±Ø¬ Ø§Ù„Ø´Ø±Ù‚ÙŠ! Ø£Ø±Ø³Ù„ÙˆØ§ ÙØ±Ù‚ Ø§Ù„Ø¥Ù†Ù‚Ø§Ø° Ø­Ø§Ù„Ø§! ðŸš¨"
              ];
              const dramaMsg = attackMessages[Math.floor(Math.random() * attackMessages.length)];

              const proceedTurn = () => {
                 hideNotification();
                 if (newlyDiscoveredByEnemy) {
                   showDiscoveryModal('enemy_blind_hit', () => {
                     startTurn();
                   });
                 } else {
                   startTurn();
                 }
              };

              showNotification('Ù‡Ø¬ÙˆÙ… Ù…Ø¹Ø§Ø¯Ù! ðŸš¨', dramaMsg + resourceLossMsg, [{ text: 'ØªÙ… Ø§Ù„Ù‚Ø±Ø§Ø¡Ø©', action: proceedTurn }]);
            }, 1200);
          }, 'enemy_attack');

          return; // Stop current function, continuation happens in callback
        }
      } else {
        addLog('Ø§Ù„Ø¹Ø¯Ùˆ Ù„Ù… ÙŠÙ‡Ø§Ø¬Ù… Ù‡Ø°Ø§ Ø§Ù„Ø¯ÙˆØ±', '');
      }

      updateUI();

      G.turn++;
      setTimeout(() => {
        G.selectedGeneral = -1;
        updateUI();
        if (newlyDiscoveredByEnemy) {
          showDiscoveryModal('enemy_blind_hit', () => {
            startTurn();
          });
        } else {
          startTurn();
        }
      }, 1200);
    }

    // ===== MODAL TOGGLES =====
    const CODEX_CARDS = [
      { general: GENERALS[0], actionLabel: 'ØªÙˆØ¬ÙŠÙ‡ Ø§Ù„Ø¶Ø±Ø¨Ø©', title: 'Ù‡Ø¬ÙˆÙ… Ù…ÙˆØ¬Ù‡ Ù…Ø¨Ø§Ø´Ø±', cost: 3, advice: 'Ù‚ØµÙ Ù…Ø¨Ø§Ø´Ø± Ø¹Ù„Ù‰ Ù‚Ø§Ø¹Ø¯Ø© Ø§Ù„Ø¹Ø¯Ùˆ. Ø§Ù„ÙˆØ³ÙŠÙ„Ø© Ø§Ù„Ø£Ø³Ø§Ø³ÙŠØ© Ù„Ø­Ø³Ù… Ø§Ù„Ù…Ø¹Ø±ÙƒØ© Ù„ÙƒÙ†Ù‡Ø§ Ø³ØªÙƒØ´Ù Ù…ÙˆÙ‚Ø¹Ù†Ø§ Ù„Ù„Ø¹Ø¯Ùˆ!' },
      { general: { name: 'Ø§Ù„Ø¬Ù†Ø±Ø§Ù„ Ø¸Ù„ Ø§Ù„Ù„ÙŠÙ„', rank: 'Ø¹Ù…Ù„ÙŠØ§Øª Ø®Ø§ØµØ©', emoji: 'ðŸŒ™', img: 'assets/generals/night_shadow.png' }, actionLabel: 'Ù‚ØµÙ Ø®ÙÙŠ', title: 'Ù‡Ø¬ÙˆÙ… Ø¬ÙˆÙŠ Ø®ÙÙŠ', cost: 4, advice: 'Ù‚ØµÙ Ù…ÙˆÙ‚Ø¹ Ø§Ù„Ø¹Ø¯Ùˆ Ø¨Ø§Ø³ØªØ®Ø¯Ø§Ù… Ø·Ø§Ø¦Ø±Ø§Øª Ø§Ù„Ø´Ø¨Ø­. Ù…ÙˆÙ‚Ø¹Ù†Ø§ Ø³ÙŠØ¨Ù‚Ù‰ Ø¢Ù…Ù†Ø§Ù‹ ØªÙ…Ø§Ù…Ø§Ù‹ ÙˆØªÙƒÙ„ÙØªÙ‡Ø§ Ø£Ø¹Ù„Ù‰.' },
      { general: { name: 'Ø§Ù„Ø¬Ù†Ø±Ø§Ù„ Ø¹Ø§ØµÙØ© Ø§Ù„Ø­Ø¯ÙŠØ¯', rank: 'Ø³Ù„Ø§Ø­ Ø¬Ùˆ', emoji: 'âœˆï¸', img: 'assets/generals/iron_storm.png' }, actionLabel: 'Ù‡Ø¬ÙˆÙ… Ø´Ø§Ù…Ù„', title: 'Ù‚ØµÙ Ù…ÙƒØ«Ù', cost: 6, advice: 'Ø¥Ø±Ø³Ø§Ù„ Ø§Ù„Ø£Ø³Ø·ÙˆÙ„ Ø¨Ø§Ù„ÙƒØ§Ù…Ù„ ÙˆØªØ¯Ù…ÙŠØ± Ø§Ù„Ù‡Ø¯Ù ØªÙ…Ø§Ù…Ø§Ù‹. Ø£Ø¶Ø±Ø§Ø± Ø¬Ø³ÙŠÙ…Ø© ÙˆØªÙƒØ´Ù Ù…ÙˆÙ‚Ø¹Ù†Ø§ Ù„Ù„Ø¹Ø¯Ùˆ.' },
      { general: GENERALS[3], actionLabel: 'Ø§Ø³ØªØ·Ù„Ø§Ø¹', title: 'Ø§Ø³ØªØ·Ù„Ø§Ø¹ Ø¬ÙˆÙŠ', cost: 1, advice: 'Ø¥Ø±Ø³Ø§Ù„ Ø·Ø§Ø¦Ø±Ø© Ø§Ø³ØªØ·Ù„Ø§Ø¹ Ù„Ù…Ø³Ø­ Ù…Ù†Ø·Ù‚Ø© Ù…Ø­Ø¯Ø¯Ø© ÙÙŠ Ø§Ù„Ø®Ø±ÙŠØ·Ø© Ù„ØªØ£ÙƒÙŠØ¯ ÙˆØ¬ÙˆØ¯ Ø§Ù„Ø¹Ø¯Ùˆ Ø£Ùˆ Ø®Ù„ÙˆÙ‡Ø§ØŒ ÙˆØªØ²ÙŠØ¯ Ù†Ù‚Ø§Ø· Ø§Ù„Ù…Ø¹Ù„ÙˆÙ…Ø§Øª.' },
      { general: GENERALS[1], actionLabel: 'Ø¬Ù…Ø¹ Ø§Ù„Ù…Ø¹Ù„ÙˆÙ…Ø§Øª', title: 'ØªØ­Ù„ÙŠÙ„ Ø§Ø³ØªØ®Ø¨Ø§Ø±Ø§ØªÙŠ', cost: 2, advice: 'Ø¬Ù…Ø¹ Ù…Ø¹Ù„ÙˆÙ…Ø§Øª Ø¯Ù‚ÙŠÙ‚Ø© Ù„Ø§ÙƒØªØ´Ø§Ù Ù‚Ø·Ø§Ø¹Ø§Øª ÙÙŠ Ø§Ù„Ø®Ø±ÙŠØ·Ø©. (Ø¹Ù†Ø¯ ÙˆØµÙˆÙ„ Ø§Ù„Ù…Ø¹Ù„ÙˆÙ…Ø§Øª Ø¥Ù„Ù‰ 10 ÙŠÙƒØ´Ù Ù…ÙˆÙ‚Ø¹ Ù‚Ø§Ø¹Ø¯Ø© Ø§Ù„Ø¹Ø¯Ùˆ ØªÙ„Ù‚Ø§Ø¦ÙŠØ§Ù‹).' },
      { general: GENERALS[2], actionLabel: 'ØªØ­ØµÙŠÙ†', title: 'ØªØ¹Ø²ÙŠØ² Ø§Ù„Ø¯ÙØ§Ø¹Ø§Øª', cost: 2, advice: 'ØªØ¹Ø²ÙŠØ² Ø¯ÙØ§Ø¹Ø§Øª Ø§Ù„Ù…Ø·Ø§Ø± Ù„ØµØ¯ Ø£ÙŠ Ù‡Ø¬ÙˆÙ… Ù…ÙØ§Ø¬Ø¦ Ù…Ù† Ø§Ù„Ø¹Ø¯ÙˆØŒ ØªÙ‚Ù„Ù„ ÙØ±ØµØ© Ø§Ù„Ø¥ØµØ§Ø¨Ø© Ø¨Ù†Ø³Ø¨Ø© ÙƒØ¨ÙŠØ±Ø© Ù‡Ø°Ø§ Ø§Ù„Ø¯ÙˆØ±.' },
      { general: GENERALS[2], actionLabel: 'ØµÙŠØ§Ù†Ø©', title: 'ØªØ±Ù…ÙŠÙ… Ø§Ù„Ù…Ø·Ø§Ø±', cost: 2, advice: 'Ø¥Ø¬Ø±Ø§Ø¡ ØµÙŠØ§Ù†Ø© Ø¹Ø§Ø¬Ù„Ø© Ù„Ù„Ù…Ø¯Ø±Ø¬ ÙˆØ§Ù„Ø·Ø§Ø¦Ø±Ø§Øª Ù„Ø§Ø³ØªØ¹Ø§Ø¯Ø© Ù†Ù‚Ø§Ø· Ø§Ù„ØµØ­Ø© ÙˆØªØ¬Ù†Ø¨ Ø§Ù„Ù‡Ø²ÙŠÙ…Ø© Ø§Ù„Ù…Ø¤ÙƒØ¯Ø©.' },
      { general: GENERALS[4], actionLabel: 'ØºØ§Ø±Ø©', title: 'ØºØ§Ø±Ø© Ù„Ù†Ù‡Ø¨ Ø§Ù„Ù…ÙˆØ§Ø±Ø¯', cost: 2, advice: 'ØºØ§Ø±Ø© Ø¹Ù„Ù‰ Ø®Ø·ÙˆØ· Ø¥Ù…Ø¯Ø§Ø¯ Ø§Ù„Ø¹Ø¯Ùˆ Ù„Ø³Ø±Ù‚Ø© Ø§Ù„Ù…ÙˆØ§Ø±Ø¯. Ø¨Ù‡Ø§ Ù†Ø³Ø¨Ø© Ù…Ø®Ø§Ø·Ø±Ø©ØŒ ÙˆØ¥Ø°Ø§ Ù†Ø¬Ø­Øª ØªØ¶Ø¹Ù Ù‡Ø¬Ù…Ø§ØªÙ‡ Ø§Ù„Ù‚Ø§Ø¯Ù…Ø©.' },
      { general: GENERALS[5], actionLabel: 'ØªÙ…ÙˆÙŠÙ‡', title: 'Ø´Ù† Ù‡Ø¬ÙˆÙ… ÙˆÙ‡Ù…ÙŠ', cost: 3, advice: 'Ø¹Ù…Ù„ÙŠØ© ØªÙ…ÙˆÙŠÙ‡ Ù„ØªØ´ØªÙŠØª Ø§Ù†ØªØ¨Ø§Ù‡ Ø§Ù„Ø¹Ø¯Ùˆ ÙˆØªÙ‚Ù„ÙŠÙ„ Ø¹Ø¯ÙˆØ§Ù†ÙŠØªÙ‡ ÙˆÙØ±ØµØ© Ø¥ØµØ§Ø¨ØªÙ‡ Ù„Ù†Ø§ ÙÙŠ Ø§Ù„Ø¯ÙˆØ± Ø§Ù„Ù‚Ø§Ø¯Ù….' },
      { general: GENERALS[4], actionLabel: 'ØªÙˆØ§Ø²Ù†', title: 'ØªÙƒØªÙŠÙƒ Ù…ØªÙˆØ§Ø²Ù†', cost: 2, advice: 'ØªØ£Ù…ÙŠÙ† Ø§Ù„Ù…ÙˆØ§Ø±Ø¯ ÙˆÙƒØ´Ù Ù…Ù†Ø§Ø·Ù‚ Ø¬Ø¯ÙŠØ¯Ø© Ø¨Ø´ÙƒÙ„ Ù…ØªÙˆØ§Ø²Ù† ÙˆÙ…Ù†Ù‡Ø¬ÙŠ.' },
      { general: GENERALS[0], actionLabel: 'Ø¥Ø·Ù„Ø§Ù‚ Ø§Ù„Ù†Ø§Ø±', title: 'Ù‚ØµÙ Ø¹Ø´ÙˆØ§Ø¦ÙŠ', cost: 2, advice: 'Ù‚ØµÙ Ù…Ù†Ø·Ù‚Ø© Ù…Ø¬Ù‡ÙˆÙ„Ø© Ø¨Ø´ÙƒÙ„ Ø¹Ø´ÙˆØ§Ø¦ÙŠ Ø¨Ø­Ø«Ø§Ù‹ Ø¹Ù† Ù‡Ø¯Ù. Ø®ÙŠØ§Ø± ÙŠØ§Ø¦Ø³ Ø¹Ù†Ø¯ Ù†ÙØ§Ø¯ Ø®ÙŠØ§Ø±Ø§Øª Ø§Ù„Ø§Ø³ØªØ·Ù„Ø§Ø¹.' },
      { general: GENERALS[4], actionLabel: 'Ø±Ø§Ø­Ø©', title: 'Ø¥Ø±Ø§Ø­Ø© Ø§Ù„Ø·Ø§Ù‚Ù…', cost: 0, advice: 'Ø£Ø¹Ø·Ù Ø§Ù„Ø¬Ù†ÙˆØ¯ Ù‚Ø³Ø·Ø§Ù‹ Ù…Ù† Ø§Ù„Ø±Ø§Ø­Ø© Ù„Ø§Ù„ØªÙ‚Ø§Ø· Ø§Ù„Ø£Ù†ÙØ§Ø³ØŒ ÙˆØ¥ØµÙ„Ø§Ø­ Ø§Ù„Ù‚Ø§Ø¹Ø¯Ø© Ø¬Ø²Ø¦ÙŠØ§Ù‹ ÙˆØ§Ø³ØªØ¹Ø§Ø¯Ø© Ø¨Ø¹Ø¶ Ø§Ù„Ù…ÙˆØ§Ø±Ø¯.' }
    ];

    function toggleCodexModal() {
      const m = document.getElementById('codex-modal');
      const grid = document.getElementById('codex-grid');
      
      if (!m.classList.contains('active')) {
        grid.innerHTML = '';
        CODEX_CARDS.forEach((card, i) => {
          const el = document.createElement('div');
          el.className = 'general-card';
          el.style.transform = 'none';
          el.style.position = 'relative';
          
          
          el.innerHTML = `
            <div class="card-header" style="background: var(--primary-bg); padding: 10px;">
              <img src="${card.general.img}" alt="Avatar" style="width: 50px; height: 50px; border-radius: 6px; object-fit: cover; border: 1px solid #4a5565;">
              <div class="general-info" style="margin-right: 15px; text-align: right; display: flex; flex-direction: column; justify-content: center;">
                <div class="general-name" style="font-size: 15px;">${card.general.name}</div>
                <div class="general-rank" style="font-size: 12px;">${card.general.rank}</div>
              </div>
            </div>
            <div class="card-body">
              <div class="action-title">${card.title}</div>
              <div class="action-desc">${card.advice}</div>
              <div class="cost-badge" style="position: static; margin-top: 15px; display: inline-block;">ðŸ›¢ï¸ ${card.cost} Ù…ÙˆØ§Ø±Ø¯</div>
            </div>
          `;
          grid.appendChild(el);
        });
      }
      m.classList.toggle('active');
    }

    function toggleLogModal() {
      const m = document.getElementById('log-modal');
      m.classList.toggle('active');
    }

    function toggleMapModal() {
      const m = document.getElementById('map-modal');
      m.classList.toggle('active');
    }
    function toggleRnDModal() {
      const m = document.getElementById('rnd-modal');
      if (m.classList.contains('active')) {
        m.classList.remove('active');
      } else {
        m.classList.add('active');
        renderConsultation();
      }
    }
    function closeModalOnOutside(e) {
      if (e.target.classList.contains('glass-modal')) {
        e.target.classList.remove('active');
      }
    }

    // ===== CONSULTATION ROOM =====
    function renderConsultation() {
      const grid = document.getElementById('consult-grid');
      grid.innerHTML = '';

      const options = [
        { id: 'radar', icon: 'ðŸ“¡', label: 'Ø±Ø§Ø¯Ø§Ø± ÙƒØ´Ù Ù…Ø¨ÙƒØ±', desc: 'ÙŠØ²ÙŠØ¯ ÙƒÙØ§Ø¡Ø© Ø¬Ù…Ø¹ Ø§Ù„Ù…Ø¹Ù„ÙˆÙ…Ø§Øª', cost: 3 },
        { id: 'walls', icon: 'ðŸ›¡ï¸', label: 'Ø¬Ø¯Ø±Ø§Ù† Ù…Ø­ØµÙ†Ø©', desc: 'ÙŠØ²ÙŠØ¯ ØµØ­Ø© Ø§Ù„Ù‚Ø§Ø¹Ø¯Ø© Ø¨Ù…Ù‚Ø¯Ø§Ø± 1', cost: 3 },
        { id: 'aa', icon: 'ðŸš€', label: 'Ø¯ÙØ§Ø¹ Ø¬ÙˆÙŠ', desc: 'ÙŠØµØ¯ Ù‡Ø¬ÙˆÙ… Ø¨Ù†Ø³Ø¨Ø© 100% (ÙŠØ­ØªØ§Ø¬ Ù„Ø¯ÙˆØ± ÙƒØ§Ù…Ù„ Ù„Ø¥Ø¹Ø§Ø¯Ø© Ø§Ù„ØªØ°Ø®ÙŠØ±)', cost: 3 },
        { id: 'stealth', icon: 'ðŸ›©ï¸', label: 'Ø³Ø±Ø¨ Ø´Ø¨Ø­ÙŠ', desc: 'Ù†Ø¬Ø§Ø­ Ø§Ù„Ø¶Ø±Ø¨Ø© Ø§Ù„ØªØ³Ù„Ù„ÙŠØ© Ù…Ø¶Ù…ÙˆÙ†', cost: 3 },
        { id: 'eng', icon: 'ðŸ—ï¸', label: 'ÙˆØ­Ø¯Ø© Ù‡Ù†Ø¯Ø³ÙŠØ©', desc: 'Ø¥ØµÙ„Ø§Ø­ Ø§Ù„Ù‚Ø§Ø¹Ø¯Ø© Ø£ØµØ¨Ø­ Ù…Ø¬Ø§Ù†ÙŠØ§Ù‹ (0)', cost: 3 },
        { id: 'ammo', icon: 'ðŸ›¢ï¸', label: 'Ø°Ø®Ø§Ø¦Ø± Ø®Ø§Ø±Ù‚Ø©', desc: 'Ø§Ù„Ø¶Ø±Ø¨Ø© Ø§Ù„Ù…Ø¨Ø§Ø´Ø±Ø© ØªÙ†Ù‚Øµ 2 ØµØ­Ø©', cost: 3 }
      ];

      options.forEach(opt => {
        const isBought = G.upgrades[opt.id];
        const div = document.createElement('div');
        div.className = 'consult-option';
        if (isBought) {
          div.style.opacity = '0.5';
          div.style.borderColor = 'var(--gold)';
        }
        div.innerHTML = `
      <div class="icon">${opt.icon}</div>
      <div class="label">${opt.label}</div>
      <div class="desc">${opt.desc}</div>
      <div class="cost" style="color:${isBought ? 'var(--gold)' : 'var(--orange-warn)'}">${isBought ? 'âœ… ØªÙ… Ø§Ù„ØªØ·ÙˆÙŠØ±' : 'ØªÙƒÙ„ÙØ©: ' + opt.cost + ' Ù…ÙˆØ§Ø±Ø¯'}</div>
    `;
        if (!isBought) {
          div.onclick = () => buyUpgrade(opt.id, opt.cost);
        }
        grid.appendChild(div);
      });
    }

    function buyUpgrade(id, cost) {
      if (G.upgrades[id]) return;
      if (G.resources < cost) {
        showNotification('Ù…ÙˆØ§Ø±Ø¯ ØºÙŠØ± ÙƒØ§ÙÙŠØ©', `ØªØ­ØªØ§Ø¬ ${cost} Ù…ÙˆØ§Ø±Ø¯ Ù„Ø´Ø±Ø§Ø¡ Ù‡Ø°Ø§ Ø§Ù„ØªØ·ÙˆÙŠØ±.\nÙ„Ø¯ÙŠÙƒ: ${G.resources} Ù…ÙˆØ§Ø±Ø¯`, [{ text: 'Ø­Ø³Ù†Ù‹Ø§', action: hideNotification }]);
        return;
      }
      G.resources -= cost;
      G.upgrades[id] = true;

      const names = { radar: 'Ø±Ø§Ø¯Ø§Ø± ÙƒØ´Ù Ù…Ø¨ÙƒØ±', walls: 'Ø¬Ø¯Ø±Ø§Ù† Ù…Ø­ØµÙ†Ø©', aa: 'Ø¯ÙØ§Ø¹ Ø¬ÙˆÙŠ', stealth: 'Ø³Ø±Ø¨ Ø´Ø¨Ø­ÙŠ', eng: 'ÙˆØ­Ø¯Ø© Ù‡Ù†Ø¯Ø³ÙŠØ©', ammo: 'Ø°Ø®Ø§Ø¦Ø± Ø®Ø§Ø±Ù‚Ø©' };
      addLog(`â¬†ï¸ ØªÙ… Ø¥Ù†Ø¬Ø§Ø² ØªØ·ÙˆÙŠØ±: ${names[id]}`, 'important');

      if (id === 'walls') {
        G.maxHealth++;
        G.health++;
      }

      updateUI();
      renderConsultation();
    }

    // ===== ALLY SUPPORT =====
    function offerAllySupport() {
      if (G.allyHelps >= 3) return;
      const offers = [
        { type: 'repair', text: 'Ø­Ù„ÙØ§Ø¤Ùƒ ÙŠØ¹Ø±Ø¶ÙˆÙ† Ø¥ØµÙ„Ø§Ø­ Ø§Ù„Ù‚Ø§Ø¹Ø¯Ø© (+1 ØµØ­Ø©)', btn: 'Ù‚Ø¨ÙˆÙ„ Ø§Ù„Ø¥ØµÙ„Ø§Ø­' },
        { type: 'intel', text: 'Ø­Ù„ÙØ§Ø¤Ùƒ ÙŠØ´Ø§Ø±ÙƒÙˆÙ† Ù…Ø¹Ù„ÙˆÙ…Ø§Øª Ù‡Ø§Ù…Ø© (+3 Ù†Ù‚Ø§Ø· Ù…Ø¹Ù„ÙˆÙ…Ø§Øª)', btn: 'Ù‚Ø¨ÙˆÙ„ Ø§Ù„Ù…Ø¹Ù„ÙˆÙ…Ø§Øª' },
        { type: 'resources', text: 'Ø­Ù„ÙØ§Ø¤Ùƒ ÙŠÙ‚Ø¯Ù…ÙˆÙ† Ø¯Ø¹Ù…Ø§Ù‹ Ø¨Ø§Ù„Ù…ÙˆØ§Ø±Ø¯ (+4 Ù…ÙˆØ§Ø±Ø¯)', btn: 'Ù‚Ø¨ÙˆÙ„ Ø§Ù„Ù…ÙˆØ§Ø±Ø¯' },
        { type: 'shield', text: 'Ø­Ù„ÙØ§Ø¤Ùƒ ÙŠÙ‚Ø¯Ù…ÙˆÙ† Ø¯Ø±Ø¹Ù‹Ø§ ÙˆØ§Ù‚ÙŠÙ‹Ø§ (Ø­Ù…Ø§ÙŠØ© Ù…Ù† Ø§Ù„Ø¶Ø±Ø¨Ø© Ø§Ù„Ù‚Ø§Ø¯Ù…Ø©)', btn: 'Ù‚Ø¨ÙˆÙ„ Ø§Ù„Ø¯Ø±Ø¹' }
      ];

      let offer = G.health < G.maxHealth ? offers[0] : offers[Math.floor(Math.random() * offers.length)];
      G.allyOffer = offer;

      const banner = document.getElementById('ally-banner');
      document.getElementById('ally-text').textContent = offer.text;
      document.getElementById('ally-warning-text').textContent = `(ØªØ¨Ù‚Ù‰ ${3 - (G.allyHelps || 0)} Ù…Ø­Ø§ÙˆÙ„Ø§Øª Ù…Ø³Ø§Ø¹Ø¯Ø© Ù‚Ø¨Ù„ ÙƒØ´Ù Ù…ÙˆÙ‚Ø¹ Ø§Ù„Ø­Ù„ÙØ§Ø¡ Ù„Ù„Ø¹Ø¯Ùˆ)`;
      document.getElementById('btn-ally').textContent = offer.btn;
      banner.classList.add('active');
      addLog('ðŸ¤ ÙˆØµÙ„ Ø­Ù„ÙØ§Ø¤Ùƒ Ù„ØªÙ‚Ø¯ÙŠÙ… Ø§Ù„Ø¯Ø¹Ù…!', 'ally');
    }

    function acceptAlly() {
      if (!G.allyOffer) return;

      switch (G.allyOffer.type) {
        case 'repair':
          G.health = Math.min(G.maxHealth, G.health + 1);
          G.damageWithoutRepair = Math.max(0, G.damageWithoutRepair - 1);
          addLog('ðŸ¤ Ø§Ù„Ø­Ù„ÙØ§Ø¡ Ø£ØµÙ„Ø­ÙˆØ§ Ø§Ù„Ù‚Ø§Ø¹Ø¯Ø©!', 'ally');
          break;
        case 'intel':
          G.intel += 3;
          addLog('ðŸ¤ Ø§Ù„Ø­Ù„ÙØ§Ø¡ Ù‚Ø¯Ù…ÙˆØ§ Ù†Ù‚Ø§Ø· Ù…Ø¹Ù„ÙˆÙ…Ø§Øª!', 'ally');
          if (G.intel >= 10 && !G.isEnemyFound) {
            G.isEnemyFound = true;
            G.map[G.enemyPos] = 2;
            addLog('ðŸŽ¯ ØªÙ… ÙƒØ´Ù Ù…ÙˆÙ‚Ø¹ Ø§Ù„Ø¹Ø¯Ùˆ Ø¨ÙØ¶Ù„ Ø§Ù„Ø­Ù„ÙØ§Ø¡!', 'danger');
            awardTrophy('eagle_eye');
          }
          break;
        case 'resources':
          G.resources += 4;
          addLog('ðŸ¤ Ø§Ù„Ø­Ù„ÙØ§Ø¡ Ù‚Ø¯Ù…ÙˆØ§ Ø¥Ù…Ø¯Ø§Ø¯Ø§Øª!', 'ally');
          if (G.resources >= 15) awardTrophy('resourceful');
          break;
        case 'shield':
          G._fortified = true;
          addLog('ðŸ¤ Ø§Ù„Ø­Ù„ÙØ§Ø¡ Ù‚Ø¯Ù…ÙˆØ§ Ø¯Ø±Ø¹Ù‹Ø§ ÙˆØ§Ù‚ÙŠÙ‹Ø§!', 'ally');
          break;
      }

      G.allyHelps++;
      if (G.allyHelps >= 3) awardTrophy('alliance');

      document.getElementById('ally-banner').classList.remove('active');
      G.allyOffer = null;
      updateUI();
    }

    function declineAlly() {
      document.getElementById('ally-banner').classList.remove('active');
      G.allyOffer = null;
      addLog('Ø±ÙØ¶Øª Ù…Ø³Ø§Ø¹Ø¯Ø© Ø§Ù„Ø­Ù„ÙØ§Ø¡', '');
    }

    // ===== NOTIFICATIONS =====
    function showNotification(title, body, buttons) {
      document.getElementById('notif-title').textContent = title;
      document.getElementById('notif-body').innerHTML = body.replace(/\n/g, '<br>');
      const btnContainer = document.getElementById('notif-buttons');
      btnContainer.innerHTML = '';
      buttons.forEach(b => {
        const btn = document.createElement('button');
        btn.className = 'btn' + (b.gold ? ' btn-gold' : '');
        btn.textContent = b.text;
        btn.onclick = b.action;
        btnContainer.appendChild(btn);
      });
      document.getElementById('dim-overlay').classList.add('active');
      document.getElementById('notification').classList.add('active');
    }

    function hideNotification() {
      document.getElementById('dim-overlay').classList.remove('active');
      document.getElementById('notification').classList.remove('active');
    }

    // ===== TROPHIES =====
    function loadTrophies() {
      try { G.trophies = JSON.parse(localStorage.getItem('lastDecision_trophies') || '{}'); } catch { G.trophies = {}; }
    }

    function saveTrophies() {
      localStorage.setItem('lastDecision_trophies', JSON.stringify(G.trophies));
    }

    function awardTrophy(id) {
      if (G.trophies[id]) return;
      SFX.play("trophy");
      G.trophies[id] = true;
      saveTrophies();
      const t = TROPHIES[id];
      if (!t) return;
      const popup = document.getElementById('trophy-popup');
      document.getElementById('trophy-popup-icon').textContent = t.icon;
      document.getElementById('trophy-popup-name').textContent = t.name;
      document.getElementById('trophy-popup-text').textContent = t.desc;
      popup.classList.remove('active');
      void popup.offsetWidth;
      popup.classList.add('active');
      setTimeout(() => popup.classList.remove('active'), 4000);
      addLog(`ðŸ† Ø¥Ù†Ø¬Ø§Ø² Ø¬Ø¯ÙŠØ¯: ${t.name}`, 'important');
    }

    function renderTrophies() {
      const grid = document.getElementById('trophy-grid');
      grid.innerHTML = '';
      Object.entries(TROPHIES).forEach(([id, t]) => {
        const card = document.createElement('div');
        card.className = 'trophy-card' + (G.trophies[id] ? ' earned' : '');
        card.innerHTML = `
      <div class="icon">${G.trophies[id] ? t.icon : 'ðŸ”’'}</div>
      <div class="name">${t.name}</div>
      <div class="desc">${G.trophies[id] ? t.desc : '???'}</div>
    `;
        grid.appendChild(card);
      });
    }

    // ===== GAME END =====
    function victory() {
      awardTrophy('supreme');
      if (G.turn <= 10) awardTrophy('decisive');
      setTimeout(() => {
        document.getElementById('battle-overlay').classList.remove('active');
        showScreen('screen-gameover');
        document.getElementById('gameover-title').textContent = 'ðŸ† Ø§Ù„Ù†ØµØ±! ðŸ†';
        document.getElementById('gameover-title').className = 'gameover-title victory';
        document.getElementById('gameover-stats').innerHTML = `
      <div class="gameover-stat"><div class="val">${G.turn}</div><div class="lbl">Ø¹Ø¯Ø¯ Ø§Ù„Ø£Ø¯ÙˆØ§Ø±</div></div>
      <div class="gameover-stat"><div class="val">${G.health}/${G.maxHealth}</div><div class="lbl">ØµØ­Ø© Ø§Ù„Ù‚Ø§Ø¹Ø¯Ø©</div></div>
      <div class="gameover-stat"><div class="val">${G.totalStrikes}</div><div class="lbl">Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø§Ù„Ø¶Ø±Ø¨Ø§Øª</div></div>
      <div class="gameover-stat"><div class="val">${G.allyHelps}</div><div class="lbl">Ù…Ø³Ø§Ø¹Ø¯Ø§Øª Ø§Ù„Ø­Ù„ÙØ§Ø¡</div></div>
      <div class="gameover-stat"><div class="val">${Object.keys(G.trophies).length}/${Object.keys(TROPHIES).length}</div><div class="lbl">Ø§Ù„Ø¥Ù†Ø¬Ø§Ø²Ø§Øª</div></div>
    `;
      }, 800);
    }

    function defeat() {
      setTimeout(() => {
        showScreen('screen-gameover');
        document.getElementById('gameover-title').textContent = 'ðŸ’€ Ø§Ù„Ù‡Ø²ÙŠÙ…Ø© ðŸ’€';
        document.getElementById('gameover-title').className = 'gameover-title defeat';
        document.getElementById('gameover-stats').innerHTML = `
      <div class="gameover-stat"><div class="val">${G.turn}</div><div class="lbl">Ø¹Ø¯Ø¯ Ø§Ù„Ø£Ø¯ÙˆØ§Ø±</div></div>
      <div class="gameover-stat"><div class="val">${G.enemyHp}/3</div><div class="lbl">ØµØ­Ø© Ø§Ù„Ø¹Ø¯Ùˆ Ø§Ù„Ù…ØªØ¨Ù‚ÙŠØ©</div></div>
      <div class="gameover-stat"><div class="val">${G.totalStrikes}</div><div class="lbl">Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø§Ù„Ø¶Ø±Ø¨Ø§Øª</div></div>
      <div class="gameover-stat"><div class="val">${Object.keys(G.trophies).length}/${Object.keys(TROPHIES).length}</div><div class="lbl">Ø§Ù„Ø¥Ù†Ø¬Ø§Ø²Ø§Øª</div></div>
    `;
      }, 800);
    }

    // ===== HELPERS =====
    function isAdjacent(a, b) {
      const ar = Math.floor(a / 4), ac = a % 4;
      const br = Math.floor(b / 4), bc = b % 4;
      return Math.abs(ar - br) <= 1 && Math.abs(ac - bc) <= 1 && a !== b;
    }

    function checkScoutTrophy() {
      let count = 0;
      for (let i = 0; i < 16; i++) if (G.map[i] !== 0) count++;
      if (count >= 10) awardTrophy('scout_master');
    }

    function triggerStoryBeat() {
      if (G.turn === 3 && G.storyPhase === 0) {
        G.storyPhase = 1;
        addLog('ðŸ“– Ø§Ù„ØªÙ‚Ø§Ø±ÙŠØ± ØªØ´ÙŠØ± Ø¥Ù„Ù‰ ØªØ­Ø±ÙƒØ§Øª Ù…Ø´Ø¨ÙˆÙ‡Ø© Ù„Ù„Ø¹Ø¯Ùˆ...', 'important');
      }
      if (G.turn === 6 && G.storyPhase === 1) {
        G.storyPhase = 2;
        addLog('ðŸ“– Ø§Ù„Ù…Ø¹Ø±ÙƒØ© ØªØ´ØªØ¯. Ø§Ù„ÙˆÙ‚Øª ÙŠÙ†ÙØ¯!', 'danger');
      }
      if (G.turn === 10 && G.storyPhase === 2) {
        G.storyPhase = 3;
        addLog('ðŸ“– Ù‡Ø°Ù‡ ÙØ±ØµØªÙ†Ø§ Ø§Ù„Ø£Ø®ÙŠØ±Ø©. ÙŠØ¬Ø¨ Ø£Ù† Ù†Ù†Ù‡ÙŠ Ù‡Ø°Ø§ Ø§Ù„Ø¢Ù†!', 'danger');
      }
    }

    // ===== CANVAS RESIZE =====
    window.addEventListener('resize', () => {
      if (document.getElementById('screen-game').classList.contains('active')) {
        const canvas = document.getElementById('airportCanvas');
        if (canvas.parentElement) {
          canvas.width = canvas.parentElement.clientWidth;
          canvas.height = canvas.parentElement.clientHeight;
        }
      }
    });

    // ===== INIT =====
    loadTrophies();

    // Play music immediately on first user interaction anywhere
    document.addEventListener('click', () => {
      if (typeof SFX !== 'undefined' && !SFX.ctx) {
        SFX.init();
      }
    }, { once: true });

    // Attempt autoplay (might be blocked by browser policies)
    window.addEventListener('load', () => {
      if (typeof SFX !== 'undefined' && !SFX.ctx) {
        SFX.init();
      }
    });
  
