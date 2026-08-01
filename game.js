function toggleSoundSettings() {
      const panel = document.getElementById('sound-settings-panel');
      panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
      if (typeof SFX !== 'undefined' && !SFX.ctx) SFX.init();
    }

    function updateBGMVolume(val) {
      document.getElementById('bgm-val').textContent = val + '%';
      if (typeof SFX !== 'undefined') SFX.setBGMVolume(val / 100);
    }

    function updateSFXVolume(val) {
      document.getElementById('sfx-val').textContent = val + '%';
      if (typeof SFX !== 'undefined') SFX.setSFXVolume(val / 100);
    }

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

      currentTrack: 'default',
      setBGMState(state) {
        if (!this.bgm) return;
        // Priority logic: If discovery is playing, do not switch to red-alarm
        if (this.currentTrack === 'discovery' && state === 'red-alarm') {
          return;
        }
        if (this.currentTrack === state) return;

        this.currentTrack = state;
        const wasPlaying = !this.bgm.paused;
        const currentVol = this.bgm.volume;

        // إيقاف المقطوعة الحالية بالكامل قبل تشغيل التالية
        this.bgm.pause();
        this.bgm.currentTime = 0;

        if (state === 'default') {
          this.bgm.src = 'March_Toward_the_Iron_Gates.mp3';
        } else if (state === 'discovery') {
          this.bgm.src = 'Chronicles_of_the_Ascendant.mp3';
        } else if (state === 'red-alarm') {
          this.bgm.src = 'Red-Alarm.mp3';
        }

        this.bgm.loop = true;
        this.bgm.volume = currentVol;
        // تأكيد التشغيل دائماً عند الأحداث الهامة لتجنب تعليق المتصفح
        if (wasPlaying || state === 'discovery' || state === 'red-alarm') {
          this.bgm.play().catch(e => console.log('BGM play failed', e));
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
      visualTurn: 1,
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
      damageWithoutRepair: 0,
      repairTimer: 0
    };

    // ===== TROPHY DEFINITIONS =====
    const TROPHIES = {
      first_strike: { name: 'الضربة الأولى', icon: '💥', desc: 'نفذ أول ضربة ناجحة على العدو' },
      eagle_eye: { name: 'عين النسر', icon: '🦅', desc: 'اكتشف موقع قاعدة العدو' },
      survivor: { name: 'الناجي', icon: '🛡️', desc: 'نجا من الهزيمة بنقطة واحدة' },
      alliance: { name: 'المحالف', icon: '🤝', desc: 'اقبل مساعدة الحلفاء مرتين' },
      warrior_rest: { name: 'استراحة محارب', icon: '☕', desc: 'خذ استراحة بعد 3 أدوار حرب متتالية' },
      supreme: { name: 'القائد الأعلى', icon: '👑', desc: 'اربح اللعبة' },
      resourceful: { name: 'سيد الموارد', icon: '🛢️', desc: 'اجمع 15 نقطة موارد' },
      scholar: { name: 'العالِم', icon: '📖', desc: 'اجمع 10 نقاط معرفة' },
      scout_master: { name: 'رئيس الكشافة', icon: '🔭', desc: 'اكشف 10 مواقع على الخريطة' },
      decisive: { name: 'القرار الحاسم', icon: '⚡', desc: 'اربح قبل الدور 10' }
    };

    // ===== GENERALS =====
    const GENERALS = [
      { name: 'الجنرال صقر', rank: 'هجوم', type: 'strike', emoji: '🦅', img: 'assets/generals/iron_falcon.png' },
      { name: 'الجنرال ثعلب الصحراء', rank: 'معلومات', type: 'intel', emoji: '🦊', img: 'assets/generals/desert_fox.png' },
      { name: 'جنرال التحصينات', rank: 'دفاع', type: 'defense', emoji: '🛡️', img: 'assets/generals/shield_nation.png' },
      { name: 'الجنرال نسر', rank: 'استطلاع', type: 'scout', emoji: '👁️', img: 'assets/generals/eagle_eye.png' },
      { name: 'الجنرال قلب الأسد', rank: 'قيادة', type: 'versatile', emoji: '🦁', img: 'assets/generals/lionheart.png' },
      { name: 'الجنرال سيف', rank: 'تكتيك', type: 'tactical', emoji: '⚔️', img: 'assets/generals/sword_justice.png' }
    ];

    // ===== STORY =====
    const STORY = [
      'وصلت تقارير مقلقة...\nعدوٌ مجهولٌ يهدّد أمن المنطقة .\nمطارك العسكري هو خط الدفاع الأخير.\n\n<span>المهمّة: اكتشف موقع العدو ودمّر قاعدته قبل أن يدمر قاعدتك!.</span>',
    ];

    // ===== INIT =====
    function initGame() {
      G.turn = 1;
      G.visualTurn = 1;
      G.health = 3;
      G.maxHealth = 3;
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
      G.aaDebrisTurns = 0;

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
      G.repairTimer = 0;
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
      addLog('مرحبًا بك أيها القائد. مطارك جاهز.', 'important');
      addLog('حدد موقع قاعدة العدو ودمرها!', 'important');
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

      }
    }

    function showDiscoveryModal(reason, callback) {
      triggerRedAlarm();
      if (typeof SFX !== 'undefined') SFX.play('alert');
      const m = document.getElementById('discovery-modal');
      const storyEl = document.getElementById('discovery-story');
      const adviceEl = document.getElementById('discovery-advice');

      if (reason === 'enemy_blind_hit') {
        storyEl.innerHTML = "لقد حدث ما لم يكن بالحسبان!<br>قذيفة طائشة من قصف العدو أو طائرة استطلاع معادية حلقت بالخطأ فوق مطارنا السري.<br><br>النشاط الملحوظ كشف إحداثياتنا للعدو بشكل قاطع!";
      } else if (reason === 'player_strike') {
        storyEl.innerHTML = "رادارات العدو تمكنت من تتبع مسار طائراتنا العائدة من الهجوم الأخير وكشفت موقع مطارنا السري!<br><br>لم يعد التخفي خياراً متاحاً.";
      }

      if (!G.isEnemyFound) {
        adviceEl.innerHTML = "نحن الآن على أهبة الاستعداد.<br><br><span style='color: #ff9999;'>يجب علينا الإسراع في البحث عن قاعدة العدو وكشفها</span><br>قبل أن يمطرنا بوابل من النيران المركزة.";
      } else {
        adviceEl.innerHTML = "العدو يعرف مكاننا ونحن نعرف مكانه.<br><br><span style='color: #ff9999;'>يجب علينا ضربه فوراً والتخلص من تهديده</span><br>قبل أن يدمرنا تماماً!";
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
    
    function generateMapFormation() {
      const hexes = [{ q: 0, r: 0 }];
      const getNeighbors = (q, r) => [
        { q: q + 1, r: r }, { q: q + 1, r: r - 1 }, { q: q, r: r - 1 },
        { q: q - 1, r: r }, { q: q - 1, r: r + 1 }, { q: q, r: r + 1 }
      ];
      
      while (hexes.length < 16) {
        let candidates = [];
        for (let h of hexes) {
          for (let n of getNeighbors(h.q, h.r)) {
            if (!hexes.some(ex => ex.q === n.q && ex.r === n.r) && !candidates.some(c => c.q === n.q && c.r === n.r)) {
              candidates.push(n);
            }
          }
        }
        let picked = candidates[Math.floor(Math.random() * candidates.length)];
        hexes.push(picked);
      }
      
      // Calculate layout
      const size = 32; // half width (approximately)
      const w = Math.sqrt(3) * size;
      const h = 2 * size;
      
      let coords = hexes.map(hex => {
        return {
          x: size * Math.sqrt(3) * (hex.q + hex.r / 2),
          y: size * 3 / 2 * hex.r
        };
      });
      
      let minX = Math.min(...coords.map(c => c.x));
      let maxX = Math.max(...coords.map(c => c.x));
      let minY = Math.min(...coords.map(c => c.y));
      let maxY = Math.max(...coords.map(c => c.y));
      
      let cx = (minX + maxX) / 2;
      let cy = (minY + maxY) / 2;
      
      // Center them in the 270x300 container
      let containerCx = 270 / 2;
      let containerCy = 300 / 2;
      
      G.hexCoords = hexes;
      G.mapCoords = coords.map(c => ({
        left: c.x - cx + containerCx - 30, // 30 is half of 60px width
        top: c.y - cy + containerCy - 34.64 // 34.64 is half of 69.28px height
      }));
    }

    function buildMap() {
      generateMapFormation();
      const grid = document.getElementById('map-grid');
      grid.innerHTML = '';
      const labels = 'أبتثجحخدذرزسشصضط'.split('');
      for (let i = 0; i < 16; i++) {
        const cell = document.createElement('div');
        cell.className = 'map-cell';
        cell.id = 'cell-' + i;
        cell.style.left = G.mapCoords[i].left + 'px';
        cell.style.top = G.mapCoords[i].top + 'px';
        cell.innerHTML = `<span class="cell-label">${labels[i]}${Math.floor(i / 4) + 1}</span>`;
        cell.dataset.idx = i;
        grid.appendChild(cell);
      }
      updateMap();
    }

    function updateMap() {
      const labels = 'أبتثجحخدذرزسشصضط'.split('');
      for (let i = 0; i < 16; i++) {
        const cell = document.getElementById('cell-' + i);
        if (!cell) continue;
        cell.className = 'map-cell';

        if (G.map[i] === 0) {
          cell.title = "غير مكشوف";
          cell.innerHTML = `<span style="font-size:16px">❓</span><span class="cell-label">${labels[i]}${Math.floor(i / 4) + 1}</span>`;
        } else if (G.map[i] === 1) {
          cell.classList.add('revealed');
          cell.title = "تم الكشف (منطقة آمنة)";
          cell.innerHTML = `<span style="font-size:16px">✅</span><span class="cell-label">${labels[i]}${Math.floor(i / 4) + 1}</span>`;
        } else if (G.map[i] === 2) {
          cell.classList.add('enemy-found');
          cell.title = "هدف العدو (مكشوف)";
          cell.innerHTML = `<span style="font-size:16px">🎯</span><span class="cell-label">${labels[i]}${Math.floor(i / 4) + 1}</span>`;
        } else if (G.map[i] === 3) {
          cell.classList.add('hit');
          cell.title = "تم تدميره (أصيب)";
          cell.innerHTML = `<span style="font-size:16px">💥</span><span class="cell-label">${labels[i]}${Math.floor(i / 4) + 1}</span>`;
        } else if (G.map[i] === -1) {
          cell.classList.add('miss');
          cell.title = "ضربة خاطئة";
          cell.innerHTML = `<span style="font-size:16px">✖</span><span class="cell-label">${labels[i]}${Math.floor(i / 4) + 1}</span>`;
        }
      }
    }

    // ===== UI UPDATE =====
    function updateUI() {
      const alarm = document.getElementById('red-alarm-overlay');
      if (alarm) {
        alarm.classList.remove('active');
      }

      document.getElementById('turn-counter').textContent = 'الدور: ' + G.turn;
      document.getElementById('stat-resources').textContent = G.resources;
      document.getElementById('stat-intel').textContent = G.intel;
      document.getElementById('stat-enemy-hp').textContent = G.enemyHp;

      // Health pips
      const hd = document.getElementById('health-display');
      hd.innerHTML = '';
      for (let i = 0; i < G.maxHealth; i++) {
        const pip = document.createElement('div');
        pip.className = 'health-pip';
        if (i >= G.health) {
          pip.classList.add('destroyed');
          if (i === G.health && G.repairTimer > 0) {
            pip.innerHTML = `<span style="font-size: 11px; display: flex; align-items: center; justify-content: center; height: 100%; color: #d4a030; text-shadow: 0 0 2px #000;">🔧${G.repairTimer}</span>`;
          }
        } else {
          if (i === G.health - 1 && G.damageWithoutRepair > 0) pip.classList.add('damaged');
          if (G._fortified) pip.classList.add('shielded');
        }
        hd.appendChild(pip);
      }

      // Upgrade display
      // Music State Logic based on game state
      if (typeof SFX !== 'undefined' && SFX.setBGMState) {
        if (G.isEnemyFound) {
          SFX.setBGMState('discovery');
        } else if (G.redAlarmTriggered) {
          SFX.setBGMState('red-alarm');
        } else {
          SFX.setBGMState('default');
        }
      }

      const ud = document.getElementById('upgrade-display');
      ud.innerHTML = '<span style="font-size:12px;color:var(--text-dim)">التطويرات:</span>';
      ['radar', 'walls', 'aa', 'stealth', 'eng', 'ammo'].forEach(key => {
        const pip = document.createElement('div');
        pip.className = 'upgrade-pip' + (G.upgrades[key] ? ' active' : '');
        ud.appendChild(pip);
      });

      // Intel hint
      const hint = document.getElementById('intel-hint');
      if (G.isEnemyFound) {
        hint.textContent = '🎯 تم تحديد موقع العدو! نفذ الضربات!';
        hint.style.color = '#e08060';
      } else if (G.intel >= 8) {
        hint.textContent = '🔥 معلومات عالية! قريب من الكشف';
        hint.style.color = 'var(--gold)';
      } else {
        hint.textContent = 'اجمع المعلومات لكشف موقع العدو (' + G.intel + '/10)';
        hint.style.color = 'var(--text-dim)';
      }

      // Enemy status
      const esc = document.getElementById('enemy-status-container');
      if (G.enemyKnowsUs) {
        esc.innerHTML = '<div class="enemy-status-bar">⚠️ العدو يعلم موقع مطارك! هجماته أقوى وأدق</div>';
      } else {
        esc.innerHTML = '';
      }

      // Mode button logic removed

      updateMap();
    }

    // ===== EVENT LOG =====
    function addLog(text, type = '') {
      if (typeof SFX !== 'undefined') {
        if (text.includes('💥')) SFX.play('explosion');
        else if (text.includes('⚠️') || text.includes('🎯')) SFX.play('alert');
        else if (text.includes('فاشلة') || text.includes('خاطئة')) SFX.play('error');
        else if (text.includes('🏆') || text.includes('نجح')) SFX.play('trophy');
        else if (text.includes('+') || text.includes('موارد') || text.includes('معرفة') || type === 'ally' || text.includes('تم تطوير')) SFX.play('gain');
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


    function interpolateColor(c1, c2, factor) {
      if (factor > 1) factor = 1;
      if (factor < 0) factor = 0;
      let result = "#";
      for (let i = 1; i <= 5; i += 2) {
        let v1 = parseInt(c1.substr(i, 2), 16);
        let v2 = parseInt(c2.substr(i, 2), 16);
        let v = Math.round(v1 + factor * (v2 - v1)).toString(16);
        if (v.length === 1) v = "0" + v;
        result += v;
      }
      return result;
    }

    function getSkyColors(timeVal) {
      // timeVal goes 0..4 over 4 turns
      // 0 = Dawn, 1 = Day, 2 = Sunset, 3 = Night
      let t = (timeVal % 4 + 4) % 4;
      if (t < 1) return { top: interpolateColor('#1a2538', '#3a7bd5', t), bottom: interpolateColor('#0a0f1a', '#3a6073', t), sunY: 0.8 - t * 0.6, sunColor: '#fffdf0', isMoon: false };
      if (t < 2) return { top: interpolateColor('#3a7bd5', '#2d1b2e', t - 1), bottom: interpolateColor('#3a6073', '#b04a43', t - 1), sunY: 0.2 + (t - 1) * 0.6, sunColor: '#ffcc66', isMoon: false };
      if (t < 3) return { top: interpolateColor('#2d1b2e', '#050a12', t - 2), bottom: interpolateColor('#df9857', '#0a0f1a', t - 2), sunY: 0.8 - (t - 2) * 0.6, sunColor: '#eef3f7', isMoon: true };
      return { top: interpolateColor('#050a12', '#1a2538', t - 3), bottom: interpolateColor('#0a0f1a', '#0a0f1a', t - 3), sunY: 0.2 + (t - 3) * 0.6, sunColor: '#eef3f7', isMoon: true };
    }
    function drawHighResPilot(ctx, x, y, scale, state) {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.beginPath(); ctx.ellipse(0, 32, 12, 3, 0, 0, Math.PI * 2); ctx.fill();

      // Legs (Dark tactical pants)
      ctx.fillStyle = '#2b2f2b';
      ctx.beginPath(); ctx.roundRect(-6, 12, 5, 18, 2); ctx.fill();
      ctx.beginPath(); ctx.roundRect(1, 12, 5, 18, 2); ctx.fill();

      // Boots
      ctx.fillStyle = '#111';
      ctx.beginPath(); ctx.roundRect(-7, 28, 6, 4, 1); ctx.fill();
      ctx.beginPath(); ctx.roundRect(1, 28, 6, 4, 1); ctx.fill();

      // Torso & Tactical Jacket (Olive green)
      ctx.fillStyle = '#3a4435';
      ctx.beginPath(); ctx.roundRect(-9, -5, 18, 20, 4); ctx.fill();

      // Tactical Vest (Dark gray/black)
      ctx.fillStyle = '#1a1c1a';
      ctx.beginPath(); ctx.roundRect(-7, -2, 14, 16, 2); ctx.fill();

      // Vest pouches/details
      ctx.fillStyle = '#2a2c2a';
      ctx.fillRect(-6, 8, 3, 5);
      ctx.fillRect(-2, 8, 4, 5);
      ctx.fillRect(3, 8, 3, 5);
      // Chest strap
      ctx.fillRect(-7, 2, 14, 2);

      // Shoulders / Epaulettes (Dark green with gold stars)
      ctx.fillStyle = '#2b3526';
      ctx.beginPath(); ctx.roundRect(-12, -5, 6, 6, 2); ctx.fill();
      ctx.beginPath(); ctx.roundRect(6, -5, 6, 6, 2); ctx.fill();
      ctx.fillStyle = '#ffd700'; // Gold stars
      ctx.fillRect(-10, -3, 2, 2); ctx.fillRect(-8, -3, 2, 2);
      ctx.fillRect(6, -3, 2, 2); ctx.fillRect(8, -3, 2, 2);

      // Head / Face
      ctx.fillStyle = '#a67b5b'; // Skin
      ctx.beginPath(); ctx.arc(0, -12, 7, 0, Math.PI * 2); ctx.fill();

      // Eyes (Stern)
      ctx.fillStyle = '#fff';
      ctx.fillRect(-4, -14, 3, 2);
      ctx.fillRect(1, -14, 3, 2);
      ctx.fillStyle = '#000';
      ctx.fillRect(-3, -14, 1.5, 1.5);
      ctx.fillRect(2, -14, 1.5, 1.5);
      // Eyebrows (angry/stern)
      ctx.fillStyle = '#222';
      ctx.beginPath(); ctx.moveTo(-5, -15); ctx.lineTo(-2, -13.5); ctx.lineTo(-2, -14.5); ctx.fill();
      ctx.beginPath(); ctx.moveTo(5, -15); ctx.lineTo(2, -13.5); ctx.lineTo(2, -14.5); ctx.fill();

      // Tactical Mask (Covering nose and mouth)
      ctx.fillStyle = '#151715';
      ctx.beginPath();
      ctx.moveTo(-6, -11); ctx.lineTo(6, -11); ctx.lineTo(4, -5); ctx.lineTo(-4, -5); ctx.fill();
      // Mask vents
      ctx.fillStyle = '#333';
      ctx.fillRect(-2, -9, 4, 1.5);
      ctx.fillRect(-1, -7, 2, 1);

      // Helmet (Dark tactical)
      ctx.fillStyle = '#1e2220';
      ctx.beginPath();
      ctx.arc(0, -14, 8, Math.PI, 0); // Top dome
      ctx.lineTo(8, -10); // Right ear
      ctx.lineTo(9, -7); ctx.lineTo(6, -7); ctx.lineTo(5, -11); // Right side
      ctx.lineTo(-5, -11); // Forehead edge
      ctx.lineTo(-6, -7); ctx.lineTo(-9, -7); ctx.lineTo(-8, -10); // Left ear
      ctx.fill();

      // Winged Skull Emblem on Helmet (Gold)
      ctx.fillStyle = '#cda434';
      ctx.fillRect(-1.5, -19.5, 3, 3); // Skull center
      ctx.fillRect(-5, -19, 3, 1); ctx.fillRect(2, -19, 3, 1); // Inner Wings
      ctx.fillRect(-6, -20, 4, 1); ctx.fillRect(2, -20, 4, 1); // Outer Wings

      // Arms & Actions
      ctx.fillStyle = '#3a4435'; // Sleeves

      if (state === 'pilot_salute') {
        // Left arm down
        ctx.beginPath(); ctx.roundRect(-11, 0, 4, 12, 2); ctx.fill();
        ctx.fillStyle = '#111'; ctx.beginPath(); ctx.roundRect(-11, 10, 4, 4, 1); ctx.fill();

        // Right arm saluting
        ctx.fillStyle = '#3a4435';
        ctx.beginPath();
        ctx.moveTo(8, -2); ctx.lineTo(14, -6); ctx.lineTo(9, -12);
        ctx.strokeStyle = '#3a4435'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
        // Glove at forehead
        ctx.fillStyle = '#111';
        ctx.beginPath(); ctx.arc(9, -12, 2.5, 0, Math.PI * 2); ctx.fill();
      } else if (state === 'pilot_helmet') {
        // Both arms up adjusting helmet
        ctx.beginPath(); ctx.moveTo(-8, -2); ctx.lineTo(-12, -6); ctx.lineTo(-7, -10);
        ctx.moveTo(8, -2); ctx.lineTo(12, -6); ctx.lineTo(7, -10);
        ctx.strokeStyle = '#3a4435'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
        // Gloves on helmet
        ctx.fillStyle = '#111';
        ctx.beginPath(); ctx.arc(-7, -10, 2.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(7, -10, 2.5, 0, Math.PI * 2); ctx.fill();
      } else if (state === 'pilot_climb') {
        // Arms reaching up/forward
        ctx.beginPath(); ctx.moveTo(-8, -2); ctx.lineTo(-10, -8); ctx.lineTo(-6, -14);
        ctx.moveTo(8, -2); ctx.lineTo(10, -8); ctx.lineTo(6, -14);
        ctx.strokeStyle = '#3a4435'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
        ctx.fillStyle = '#111';
        ctx.beginPath(); ctx.arc(-6, -14, 2.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(6, -14, 2.5, 0, Math.PI * 2); ctx.fill();
      } else {
        // Default (idle)
        ctx.beginPath(); ctx.roundRect(-11, 0, 4, 12, 2); ctx.fill();
        ctx.beginPath(); ctx.roundRect(7, 0, 4, 12, 2); ctx.fill();
        ctx.fillStyle = '#111';
        ctx.beginPath(); ctx.roundRect(-11, 10, 4, 4, 1); ctx.fill();
        ctx.beginPath(); ctx.roundRect(7, 10, 4, 4, 1); ctx.fill();
      }

      ctx.restore();
    }

    function drawHighResSoldier(ctx, x, y, scale, state) {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.beginPath();
      ctx.ellipse(5, 25, 12, 3, 0, 0, Math.PI * 2);
      ctx.fill();

      // Legs
      ctx.fillStyle = '#4a554a';
      ctx.beginPath(); ctx.roundRect(0, 10, 4, 15, 2); ctx.fill();
      ctx.beginPath(); ctx.roundRect(6, 10, 4, 15, 2); ctx.fill();

      // Body (Torso)
      ctx.fillStyle = '#3a4a3a';
      ctx.beginPath(); ctx.roundRect(-2, -5, 14, 16, 3); ctx.fill();

      // Vest / Harness
      ctx.fillStyle = '#222';
      ctx.fillRect(0, -3, 3, 12);
      ctx.fillRect(7, -3, 3, 12);
      ctx.fillRect(-2, 2, 14, 3);

      // Head
      ctx.fillStyle = '#dfba97';
      ctx.beginPath(); ctx.arc(5, -10, 5, 0, Math.PI * 2); ctx.fill();

      // Helmet
      ctx.fillStyle = '#3a4a3a';
      ctx.beginPath(); ctx.arc(5, -11, 6, Math.PI, 0); ctx.fill();
      ctx.fillRect(-1, -11, 12, 3);

      // Goggles
      ctx.fillStyle = '#111';
      ctx.fillRect(2, -9, 8, 3);

      // Arms & Weapon
      ctx.fillStyle = '#4a554a';
      if (state === 'soldier_guard' || state === 'guard') {
        // Holding rifle forward
        ctx.beginPath(); ctx.roundRect(-4, -2, 12, 4, 2); ctx.fill();
        ctx.fillStyle = '#111'; // Rifle
        ctx.fillRect(-2, 0, 18, 3);
        ctx.fillRect(8, -1, 3, 4);
      } else if (state === 'pilot_idle') {
        ctx.beginPath(); ctx.roundRect(3, -2, 4, 12, 2); ctx.fill();
      } else if (state === 'pilot_salute') {
        ctx.beginPath(); ctx.moveTo(5, -2); ctx.lineTo(12, -8); ctx.lineTo(8, -12);
        ctx.strokeStyle = '#4a554a'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.stroke();
      } else {
        // Idle arm
        ctx.beginPath(); ctx.roundRect(3, -2, 4, 12, 2); ctx.fill();
      }

      ctx.restore();
    }

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
        updateUI(); // Trigger discovery music immediately

        showNotification('اكتشاف حاسم! 🎯', 'بفضل تراكم 10 نقاط معلومات، استخباراتنا تمكنت أخيراً من فك شفرة موقع قاعدة العدو الرئيسية!\n\n<span style="color:#f0ad4e; font-weight:bold;">طائراتنا الهجومية بانتظار أوامرك لتدميرهم.</span>', [{
          text: 'ممتاز! استعدوا للهجوم',
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

    // ===== PROCEDURAL VECTOR CLOUDS =====
    function drawVectorCumulusCloud(ctx, x, y, scale, isNight, isSunset, alpha = 0.95) {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);
      ctx.globalAlpha = alpha;

      let topColor = '#FFFFFF';
      let bottomColor = '#D4EEFE';
      let shadowColor = 'rgba(150, 205, 250, 0.75)';
      let strokeHighlight = 'rgba(255, 255, 255, 0.95)';

      if (isSunset) {
        topColor = '#FFF5E4';
        bottomColor = '#FFD8B3';
        shadowColor = 'rgba(255, 175, 120, 0.75)';
        strokeHighlight = 'rgba(255, 245, 230, 0.95)';
      } else if (isNight) {
        topColor = 'rgba(75, 90, 115, 0.85)';
        bottomColor = 'rgba(42, 52, 72, 0.85)';
        shadowColor = 'rgba(25, 32, 48, 0.75)';
        strokeHighlight = 'rgba(130, 150, 185, 0.6)';
      }

      // Layer 1: Under-shadow Base Layer
      ctx.fillStyle = shadowColor;
      ctx.beginPath();
      ctx.arc(-55, 2, 22, Math.PI * 0.5, Math.PI * 1.35);
      ctx.arc(-30, -18, 30, Math.PI * 0.9, Math.PI * 1.7);
      ctx.arc(8, -32, 40, Math.PI * 1.0, Math.PI * 1.9);
      ctx.arc(48, -20, 28, Math.PI * 1.2, Math.PI * 2.0);
      ctx.arc(75, 2, 20, Math.PI * 1.5, Math.PI * 0.5);
      ctx.lineTo(-55, 22);
      ctx.closePath();
      ctx.fill();

      // Layer 2: Main Cloud Body
      const grad = ctx.createLinearGradient(0, -40, 0, 15);
      grad.addColorStop(0, topColor);
      grad.addColorStop(1, bottomColor);
      ctx.fillStyle = grad;

      ctx.beginPath();
      ctx.arc(-55, -2, 20, Math.PI * 0.5, Math.PI * 1.35);
      ctx.arc(-30, -22, 28, Math.PI * 0.9, Math.PI * 1.7);
      ctx.arc(8, -36, 38, Math.PI * 1.0, Math.PI * 1.9);
      ctx.arc(48, -24, 26, Math.PI * 1.2, Math.PI * 2.0);
      ctx.arc(75, -2, 18, Math.PI * 1.5, Math.PI * 0.5);
      ctx.lineTo(-55, 18);
      ctx.closePath();
      ctx.fill();

      // Layer 3: Top White Highlight Arcs
      if (!isNight) {
        ctx.strokeStyle = strokeHighlight;
        ctx.lineWidth = 3.5;
        ctx.lineCap = 'round';

        ctx.beginPath();
        ctx.arc(-30, -22, 26, Math.PI * 1.0, Math.PI * 1.55);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(8, -36, 35, Math.PI * 1.1, Math.PI * 1.75);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(48, -24, 23, Math.PI * 1.2, Math.PI * 1.85);
        ctx.stroke();
      }

      ctx.restore();
    }

    function drawVectorWhispyCloud(ctx, x, y, scale, isNight, isSunset, alpha = 0.85) {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);
      ctx.globalAlpha = alpha;

      let topColor = '#FFFFFF';
      let bottomColor = '#D4EEFE';
      let shadowColor = 'rgba(150, 210, 250, 0.7)';

      if (isSunset) {
        topColor = '#FFF5E4';
        bottomColor = '#FFE0C2';
        shadowColor = 'rgba(255, 180, 130, 0.7)';
      } else if (isNight) {
        topColor = 'rgba(75, 90, 115, 0.75)';
        bottomColor = 'rgba(40, 50, 70, 0.75)';
        shadowColor = 'rgba(25, 32, 48, 0.6)';
      }

      // Shadow
      ctx.fillStyle = shadowColor;
      ctx.beginPath();
      ctx.arc(-45, 2, 9, Math.PI * 0.5, Math.PI * 1.5);
      ctx.arc(-15, -6, 12, Math.PI * 0.9, Math.PI * 1.7);
      ctx.arc(18, -4, 10, Math.PI * 1.1, Math.PI * 1.9);
      ctx.arc(45, 2, 7, Math.PI * 1.5, Math.PI * 0.5);
      ctx.closePath();
      ctx.fill();

      // Main body
      const grad = ctx.createLinearGradient(0, -10, 0, 6);
      grad.addColorStop(0, topColor);
      grad.addColorStop(1, bottomColor);
      ctx.fillStyle = grad;

      ctx.beginPath();
      ctx.arc(-45, 0, 8, Math.PI * 0.5, Math.PI * 1.5);
      ctx.arc(-15, -8, 11, Math.PI * 0.9, Math.PI * 1.7);
      ctx.arc(18, -6, 9, Math.PI * 1.1, Math.PI * 1.9);
      ctx.arc(45, 0, 6, Math.PI * 1.5, Math.PI * 0.5);
      ctx.closePath();
      ctx.fill();

      if (!isNight) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(-15, -8, 9, Math.PI * 1.0, Math.PI * 1.6);
        ctx.stroke();
      }

      ctx.restore();
    }

    // ===== AIRPORT CANVAS ANIMATION =====



    function drawDetailedPlane(ctx, px, py, scale, frame, animState) {
      ctx.save();
      ctx.translate(px, py);
      // Make the plane intrinsically larger for a majestic appearance
      ctx.scale(scale * 1.8, scale * 1.8);

      // Afterburner glow during takeoff
      if (animState === 'takeoff' && frame > 100) {
        const glowLen = 30 + Math.sin(frame * 0.5) * 20;
        const grad = ctx.createLinearGradient(45, 0, 45 + glowLen, 0);
        grad.addColorStop(0, '#fff');
        grad.addColorStop(0.2, '#0df');
        grad.addColorStop(1, 'rgba(0, 200, 255, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(45, -2); ctx.lineTo(45 + glowLen, -10); ctx.lineTo(45 + glowLen, 10); ctx.lineTo(45, 2);
        ctx.fill();
      }

      // === Stealth Fighter Design (3D faceted appearance) ===

      // Far Wing (visible underneath/behind)
      ctx.fillStyle = '#1c2026';
      ctx.beginPath();
      ctx.moveTo(-10, -5); ctx.lineTo(25, -25); ctx.lineTo(35, -25); ctx.lineTo(20, -5);
      ctx.fill();

      // Lower Body / Belly (Shadowed facet)
      const bellyGrad = ctx.createLinearGradient(0, 0, 0, 15);
      bellyGrad.addColorStop(0, '#222831');
      bellyGrad.addColorStop(1, '#11151c');
      ctx.fillStyle = bellyGrad;
      ctx.beginPath();
      ctx.moveTo(-70, 2); // Nose bottom
      ctx.lineTo(-30, 12); // Intake bottom
      ctx.lineTo(20, 10); // Belly
      ctx.lineTo(45, 4);  // Engine bottom
      ctx.lineTo(45, 0);
      ctx.lineTo(-70, 0);
      ctx.fill();

      // Upper Body (Light facet)
      const upperGrad = ctx.createLinearGradient(0, -15, 0, 0);
      upperGrad.addColorStop(0, '#4a5568');
      upperGrad.addColorStop(1, '#2d3748');
      ctx.fillStyle = upperGrad;
      ctx.beginPath();
      ctx.moveTo(-75, 0); // Nose tip
      ctx.lineTo(-40, -8); // Nose slope
      ctx.lineTo(-10, -10); // Canopy base
      ctx.lineTo(25, -12); // Spine
      ctx.lineTo(50, -5); // Tail base
      ctx.lineTo(50, 0); // Engine top
      ctx.lineTo(-75, 0);
      ctx.fill();

      // Side Intake (Angular)
      ctx.fillStyle = '#111';
      ctx.beginPath();
      ctx.moveTo(-35, 2); ctx.lineTo(-25, 8); ctx.lineTo(5, 8); ctx.lineTo(-5, 2);
      ctx.fill();
      // Intake lip highlight
      ctx.strokeStyle = '#5a667a'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(-35, 2); ctx.lineTo(-25, 8); ctx.stroke();

      // Canopy (Golden/orange stealth coating)
      const canopyGrad = ctx.createLinearGradient(-35, -15, -10, -5);
      canopyGrad.addColorStop(0, '#f6ad55'); // Bright gold
      canopyGrad.addColorStop(0.5, '#dd6b20');
      canopyGrad.addColorStop(1, '#7b341e');
      ctx.fillStyle = canopyGrad;
      ctx.beginPath();
      ctx.moveTo(-35, -6);
      ctx.lineTo(-25, -14); // High point
      ctx.lineTo(-5, -10); // Rear slope
      ctx.lineTo(-10, -5); // Base
      ctx.fill();
      // Canopy highlight
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.beginPath(); ctx.moveTo(-30, -12); ctx.lineTo(-15, -10); ctx.stroke();

      // Near Wing (Angular 3D)
      const wingGrad = ctx.createLinearGradient(0, 0, 0, 25);
      wingGrad.addColorStop(0, '#3a4454');
      wingGrad.addColorStop(1, '#1a202c');
      ctx.fillStyle = wingGrad;
      ctx.beginPath();
      ctx.moveTo(-20, 5); // Wing root front
      ctx.lineTo(-5, 25); // Wing tip front
      ctx.lineTo(25, 25); // Wing tip rear
      ctx.lineTo(15, 5); // Wing root rear
      ctx.fill();
      // Wing edge highlight
      ctx.strokeStyle = '#5a667a';
      ctx.beginPath(); ctx.moveTo(-20, 5); ctx.lineTo(-5, 25); ctx.stroke();

      // Twin Tail Fins (V-shape, near fin)
      const tailGrad = ctx.createLinearGradient(35, -25, 45, -5);
      tailGrad.addColorStop(0, '#4a5568');
      tailGrad.addColorStop(1, '#1a202c');
      ctx.fillStyle = tailGrad;
      ctx.beginPath();
      ctx.moveTo(25, -10);
      ctx.lineTo(40, -30);
      ctx.lineTo(52, -30);
      ctx.lineTo(45, -5);
      ctx.fill();
      // Tail edge highlight
      ctx.strokeStyle = '#6a788e';
      ctx.beginPath(); ctx.moveTo(25, -10); ctx.lineTo(40, -30); ctx.stroke();

      // Engine Nozzle
      ctx.fillStyle = '#111';
      ctx.beginPath();
      ctx.moveTo(45, -4); ctx.lineTo(55, -2); ctx.lineTo(55, 2); ctx.lineTo(45, 4);
      ctx.fill();
      // Nozzle interior glow (ambient)
      ctx.fillStyle = '#0bf';
      ctx.beginPath(); ctx.ellipse(54, 0, 1, 2, 0, 0, Math.PI * 2); ctx.fill();

      // Tactical Decals / Panel Lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(20, -10); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-60, -2); ctx.lineTo(-40, 2); ctx.stroke();

      // Anti-collision lights (Blinking)
      if (Math.floor(frame / 10) % 2 === 0) {
        ctx.fillStyle = '#ff3333';
        ctx.beginPath(); ctx.arc(-15, 8, 2, 0, Math.PI * 2); ctx.fill(); // bottom light
        ctx.beginPath(); ctx.arc(35, -12, 1.5, 0, Math.PI * 2); ctx.fill(); // top light
      }

      ctx.restore();
    }

    // ===== PROCEDURAL 3D ENVIRONMENT GRAPHICS =====
    function drawProcedural3DMountains(ctx, W, H, isDay, isSunset) {
      const baseH = H * 0.55;

      // Color Palettes based on Time of Day
      let bgTop = isDay ? '#3f566e' : (isSunset ? '#4a2f3a' : '#141c28');
      let bgBot = isDay ? '#243445' : (isSunset ? '#261822' : '#0a0f18');

      let midTop = isDay ? '#4f6985' : (isSunset ? '#5d3b48' : '#1a2433');
      let midBot = isDay ? '#293949' : (isSunset ? '#2e1c26' : '#0c121c');

      let fgTop = isDay ? '#6280a1' : (isSunset ? '#704656' : '#223044');
      let fgMid = isDay ? '#415770' : (isSunset ? '#4c2d3b' : '#16202e');
      let fgBot = isDay ? '#212f3d' : (isSunset ? '#24141d' : '#080d14');

      let highlightColor = isDay ? 'rgba(255, 255, 255, 0.35)' : (isSunset ? 'rgba(255, 200, 150, 0.3)' : 'rgba(120, 160, 220, 0.18)');

      // --- LAYER 1: Far Distant Mountain Waves (Smooth Rolling Background) ---
      const bgGrad = ctx.createLinearGradient(0, baseH - 120, 0, baseH);
      bgGrad.addColorStop(0, bgTop);
      bgGrad.addColorStop(1, bgBot);
      ctx.fillStyle = bgGrad;

      ctx.beginPath();
      ctx.moveTo(-20, baseH);
      for (let x = -20; x <= W + 20; x += 15) {
        let mH = baseH - 55 - Math.sin(x * 0.007) * 35 - Math.cos(x * 0.015) * 45;
        ctx.lineTo(x, mH);
      }
      ctx.lineTo(W + 20, baseH);
      ctx.closePath();
      ctx.fill();

      // --- LAYER 2: Midground Mountain Ridge (Smooth Curved Ridge with Shading) ---
      const midGrad = ctx.createLinearGradient(0, baseH - 90, 0, baseH);
      midGrad.addColorStop(0, midTop);
      midGrad.addColorStop(1, midBot);
      ctx.fillStyle = midGrad;

      ctx.beginPath();
      ctx.moveTo(-20, baseH);
      for (let x = -20; x <= W + 20; x += 15) {
        let mH = baseH - 35 - Math.cos(x * 0.011) * 35 - Math.sin(x * 0.022) * 25;
        ctx.lineTo(x, mH);
      }
      ctx.lineTo(W + 20, baseH);
      ctx.closePath();
      ctx.fill();

      // Midground Rim Highlight Curve
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let x = -20; x <= W + 20; x += 15) {
        let mH = baseH - 35 - Math.cos(x * 0.011) * 35 - Math.sin(x * 0.022) * 25;
        if (x === -20) ctx.moveTo(x, mH);
        else ctx.lineTo(x, mH);
      }
      ctx.stroke();

      // --- LAYER 3: Main Foreground Mountain Range (3D Volumetric Curves with Multi-stop Gradients) ---
      const fgGrad = ctx.createLinearGradient(0, baseH - 110, 0, baseH);
      fgGrad.addColorStop(0, fgTop);
      fgGrad.addColorStop(0.45, fgMid);
      fgGrad.addColorStop(1, fgBot);
      ctx.fillStyle = fgGrad;

      ctx.beginPath();
      ctx.moveTo(-20, baseH);
      for (let x = -20; x <= W + 20; x += 12) {
        let mH = baseH - 25 - Math.sin(x * 0.009 + 0.5) * 45 - Math.cos(x * 0.018) * 30 - Math.sin(x * 0.035) * 15;
        ctx.lineTo(x, mH);
      }
      ctx.lineTo(W + 20, baseH);
      ctx.closePath();
      ctx.fill();

      // Foreground Sunlit Edge Sheen & Ridge Line Highlights (3D Depth Stroke)
      ctx.strokeStyle = highlightColor;
      ctx.lineWidth = 2.2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      let drawing = false;
      for (let x = -20; x <= W + 20; x += 10) {
        let mH = baseH - 25 - Math.sin(x * 0.009 + 0.5) * 45 - Math.cos(x * 0.018) * 30 - Math.sin(x * 0.035) * 15;
        let slope = (Math.cos(x * 0.009 + 0.5) * 0.009 * 45) - (Math.sin(x * 0.018) * 0.018 * 30);
        if (slope > -0.1) {
          if (!drawing) { ctx.moveTo(x, mH); drawing = true; }
          else ctx.lineTo(x, mH);
        } else {
          drawing = false;
        }
      }
      ctx.stroke();

      // Base Atmospheric Haze Blend
      const fog = ctx.createLinearGradient(0, baseH - 30, 0, baseH);
      fog.addColorStop(0, 'rgba(44, 64, 44, 0)');
      fog.addColorStop(1, isDay ? 'rgba(38, 56, 38, 0.7)' : 'rgba(10, 16, 22, 0.9)');
      ctx.fillStyle = fog;
      ctx.fillRect(0, baseH - 30, W, 30);
    }

    function drawProcedural3DHangar(ctx, bx, by, w, h, isDay, isSunset, globalTime, index = 0) {
      const depthX = 14;
      const depthY = 6;

      // Color Palettes for Time-of-Day
      const roofLit = isDay ? '#6a7e96' : (isSunset ? '#5c4554' : '#283648');
      const roofMid = isDay ? '#48576b' : (isSunset ? '#3e2d38' : '#1a2432');
      const roofShd = isDay ? '#2a3545' : (isSunset ? '#22161e' : '#0e1520');
      const roofSpec = isDay ? '#9bb0c7' : (isSunset ? '#8a6b7d' : '#455b75');

      // --- 1. 3D SIDE WALL & ROOF PERSPECTIVE EXTENSION (Depth Back Side) ---
      // Side Wall Perspective Face
      const sideGrad = ctx.createLinearGradient(bx + w, by + 22, bx + w + depthX, by + h + depthY);
      sideGrad.addColorStop(0, roofMid);
      sideGrad.addColorStop(1, '#0b1017');
      ctx.fillStyle = sideGrad;

      ctx.beginPath();
      ctx.moveTo(bx + w, by + 22);
      ctx.lineTo(bx + w + depthX, by + 22 + depthY);
      ctx.lineTo(bx + w + depthX, by + h + depthY);
      ctx.lineTo(bx + w, by + h);
      ctx.closePath();
      ctx.fill();

      // Side Wall Vertical Panel Seams
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.lineWidth = 1;
      for (let sx = 4; sx < depthX; sx += 4) {
        ctx.beginPath();
        ctx.moveTo(bx + w + sx, by + 22 + (sx / depthX) * depthY);
        ctx.lineTo(bx + w + sx, by + h + (sx / depthX) * depthY);
        ctx.stroke();
      }

      // Roof Side Perspective Arch Extension
      ctx.fillStyle = roofShd;
      ctx.beginPath();
      ctx.arc(bx + w / 2 + depthX, by + 22 + depthY, w / 2, Math.PI * 1.5, 0);
      ctx.lineTo(bx + w, by + 22);
      ctx.arc(bx + w / 2, by + 22, w / 2, 0, Math.PI * 1.5, true);
      ctx.closePath();
      ctx.fill();

      // --- 2. 3D FRONT FACADE & VAULTED METALLIC ROOF DOME ---
      const roofGrad = ctx.createLinearGradient(bx, by, bx + w, by);
      roofGrad.addColorStop(0, roofShd);
      roofGrad.addColorStop(0.2, roofMid);
      roofGrad.addColorStop(0.4, roofLit);
      roofGrad.addColorStop(0.55, roofSpec); // Metallic spec sheen
      roofGrad.addColorStop(0.75, roofMid);
      roofGrad.addColorStop(1, roofShd);
      ctx.fillStyle = roofGrad;

      ctx.beginPath();
      ctx.arc(bx + w / 2, by + 22, w / 2, Math.PI, 0);
      ctx.fill();

      // Corrugated 3D Roof Steel Arch Ribs (Concentric Arches with dual highlights)
      for (let r = 0.25; r <= 0.88; r += 0.21) {
        // Dark Under-shadow Line
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(bx + w / 2, by + 22, (w / 2) * r, Math.PI, 0);
        ctx.stroke();

        // Bright Specular Edge Highlight Line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(bx + w / 2, by + 22, (w / 2) * r - 1, Math.PI, 0);
        ctx.stroke();
      }

      // Outer Arch Fascia Steel Rim Frame
      ctx.strokeStyle = '#8297af';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(bx + w / 2, by + 22, w / 2, Math.PI, 0);
      ctx.stroke();

      // --- 3. FRONT WALL BODY & SUPPORT COLUMNS ---
      const facadeGrad = ctx.createLinearGradient(bx, by + 22, bx, by + h);
      facadeGrad.addColorStop(0, roofLit);
      facadeGrad.addColorStop(0.6, roofMid);
      facadeGrad.addColorStop(1, roofShd);
      ctx.fillStyle = facadeGrad;
      ctx.fillRect(bx, by + 22, w, h - 22);

      // Heavy 3D Armored Corner Pillars
      const pillarGradLeft = ctx.createLinearGradient(bx, by + 22, bx + 12, by + 22);
      pillarGradLeft.addColorStop(0, '#1c2533');
      pillarGradLeft.addColorStop(0.5, '#45566b');
      pillarGradLeft.addColorStop(1, '#222d3d');
      ctx.fillStyle = pillarGradLeft;
      ctx.fillRect(bx, by + 22, 12, h - 22);

      const pillarGradRight = ctx.createLinearGradient(bx + w - 12, by + 22, bx + w, by + 22);
      pillarGradRight.addColorStop(0, '#222d3d');
      pillarGradRight.addColorStop(0.5, '#45566b');
      pillarGradRight.addColorStop(1, '#151d28');
      ctx.fillStyle = pillarGradRight;
      ctx.fillRect(bx + w - 12, by + 22, 12, h - 22);

      // --- 4. RECESSED HANGAR BAY ENTRANCE & VOLUMETRIC ATMOSPHERE ---
      const doorW = w - 30;
      const doorH = h - 30;
      const doorX = bx + 15;
      const doorY = by + 30;

      // Dark Deep Interior Vault
      const intGrad = ctx.createLinearGradient(doorX, doorY, doorX, doorY + doorH);
      intGrad.addColorStop(0, '#04070c');
      intGrad.addColorStop(1, '#0d131c');
      ctx.fillStyle = intGrad;
      ctx.fillRect(doorX, doorY, doorW, doorH);

      // Deep Recess Top & Side Shadows
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.fillRect(doorX, doorY, doorW, 6);
      ctx.fillRect(doorX, doorY, 5, doorH);
      ctx.fillRect(doorX + doorW - 5, doorY, 5, doorH);

      // Interior Stealth Fighter Nose Silhouette (Adds realism inside bay!)
      ctx.fillStyle = '#080d14';
      ctx.beginPath();
      ctx.moveTo(doorX + doorW / 2 - 12, doorY + doorH);
      ctx.lineTo(doorX + doorW / 2, doorY + doorH - 18);
      ctx.lineTo(doorX + doorW / 2 + 12, doorY + doorH);
      ctx.closePath();
      ctx.fill();

      // Volumetric Amber Floodlight Light Cone Output
      const isNight = G.visualTurn % 4 > 1.5 && G.visualTurn % 4 < 3.5;
      const lightGrad = ctx.createLinearGradient(doorX + doorW / 2, doorY, doorX + doorW / 2, doorY + doorH + 15);
      lightGrad.addColorStop(0, isNight ? 'rgba(255, 205, 70, 0.55)' : 'rgba(255, 230, 150, 0.28)');
      lightGrad.addColorStop(0.6, isNight ? 'rgba(255, 180, 40, 0.2)' : 'rgba(255, 210, 100, 0.08)');
      lightGrad.addColorStop(1, 'rgba(255, 160, 20, 0)');
      ctx.fillStyle = lightGrad;
      ctx.beginPath();
      ctx.moveTo(doorX + 6, doorY);
      ctx.lineTo(doorX + doorW - 6, doorY);
      ctx.lineTo(doorX + doorW + 18, doorY + doorH + 15);
      ctx.lineTo(doorX - 18, doorY + doorH + 15);
      ctx.closePath();
      ctx.fill();

      // --- 5. INDUSTRIAL HAZARD HEADER LINTEL & OVERHEAD FLOODLIGHTS ---
      const hazardY = doorY - 8;
      ctx.fillStyle = '#11171d';
      ctx.fillRect(doorX - 2, hazardY, doorW + 4, 8);

      // Yellow/Black Diagonal Stripe Pattern
      ctx.fillStyle = '#e6b800';
      for (let s = -2; s < doorW + 4; s += 14) {
        ctx.beginPath();
        ctx.moveTo(doorX + s, hazardY + 8);
        ctx.lineTo(doorX + s + 7, hazardY);
        ctx.lineTo(doorX + s + 11, hazardY);
        ctx.lineTo(doorX + s + 4, hazardY + 8);
        ctx.closePath();
        ctx.fill();
      }
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.lineWidth = 1;
      ctx.strokeRect(doorX - 2, hazardY, doorW + 4, 8);

      // Overhead Fixture Lamps
      for (let s = 0; s < doorW - 10; s += 18) {
        const lx = doorX + s + 9;
        const ly = hazardY - 3;

        ctx.fillStyle = '#222d38';
        ctx.fillRect(lx - 4, ly - 3, 8, 4);

        ctx.fillStyle = '#ffe066';
        ctx.shadowColor = '#ffe066';
        ctx.shadowBlur = isNight ? 12 : 4;
        ctx.beginPath();
        ctx.arc(lx, ly + 1, 2.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // --- 6. APEX AVIATION WARNING BEACON (On Center Hangar) ---
      if (index === 1 && Math.floor(globalTime * 0.15) % 2 === 0) {
        ctx.fillStyle = '#ff2222';
        ctx.shadowColor = '#ff2222';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(bx + w / 2, by - 2, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    function drawProcedural3DControlTower(ctx, tx, ty, tw, th, isDay, isSunset, globalTime) {
      // 3D Shaft Gradient
      const shaftGrad = ctx.createLinearGradient(tx, ty, tx + tw, ty);
      shaftGrad.addColorStop(0, '#1a222e');
      shaftGrad.addColorStop(0.3, '#384657');
      shaftGrad.addColorStop(0.75, '#283445');
      shaftGrad.addColorStop(1, '#121822');

      ctx.fillStyle = shaftGrad;
      ctx.fillRect(tx + 8, ty, tw - 16, th);

      // Tower Support Ribs
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(tx + 17, ty); ctx.lineTo(tx + 17, ty + th);
      ctx.moveTo(tx + tw - 17, ty); ctx.lineTo(tx + tw - 17, ty + th);
      ctx.stroke();

      // 3D Cantilevered Glass Cabin
      const cabY = ty - 24;
      const cabH = 26;
      const cabW = tw + 16;
      const cabX = tx - 8;

      // 3D Underside Cone Support
      ctx.fillStyle = '#161f2a';
      ctx.beginPath();
      ctx.moveTo(tx + 6, ty);
      ctx.lineTo(tx + tw - 6, ty);
      ctx.lineTo(cabX + cabW, cabY + cabH);
      ctx.lineTo(cabX, cabY + cabH);
      ctx.closePath();
      ctx.fill();

      // Glass Cabin Facets
      const isNight = G.visualTurn % 4 > 1.5 && G.visualTurn % 4 < 3.5;
      const glassGrad = ctx.createLinearGradient(cabX, cabY, cabX + cabW, cabY);
      glassGrad.addColorStop(0, '#183a46');
      glassGrad.addColorStop(0.3, isNight ? '#5fe0ed' : '#7ce8f5');
      glassGrad.addColorStop(0.7, isNight ? '#2ab0c0' : '#4fc4d0');
      glassGrad.addColorStop(1, '#102833');

      ctx.fillStyle = glassGrad;
      ctx.beginPath();
      ctx.moveTo(cabX + 6, cabY);
      ctx.lineTo(cabX + cabW - 6, cabY);
      ctx.lineTo(cabX + cabW, cabY + cabH);
      ctx.lineTo(cabX, cabY + cabH);
      ctx.closePath();
      ctx.fill();

      // Glass Reflections
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.beginPath();
      ctx.moveTo(cabX + 12, cabY + 2);
      ctx.lineTo(cabX + 26, cabY + 2);
      ctx.lineTo(cabX + 18, cabY + cabH - 2);
      ctx.lineTo(cabX + 6, cabY + cabH - 2);
      ctx.fill();

      // Glass Frame Struts
      ctx.strokeStyle = '#121a24';
      ctx.lineWidth = 2;
      for (let s = 10; s < cabW - 5; s += 12) {
        ctx.beginPath();
        ctx.moveTo(cabX + s, cabY);
        ctx.lineTo(cabX + s, cabY + cabH);
        ctx.stroke();
      }

      // Roof Cap
      ctx.fillStyle = '#0e141e';
      ctx.beginPath();
      ctx.moveTo(cabX - 4, cabY);
      ctx.lineTo(cabX + cabW + 4, cabY);
      ctx.lineTo(cabX + cabW - 6, cabY - 12);
      ctx.lineTo(cabX + 6, cabY - 12);
      ctx.closePath();
      ctx.fill();

      const roofTopY = cabY - 12;
      const centerX = tx + tw / 2;

      // --- 1. RADAR DISH (ON LEFT SIDE OF ROOF: centerX - 14) ---
      if (G.upgrades && G.upgrades.radar) {
        const radarX = centerX - 14;
        ctx.save();
        ctx.translate(radarX, roofTopY - 6);

        // Pedestal/Mast Stand
        ctx.fillStyle = '#26303d';
        ctx.fillRect(-3, 0, 6, 8);
        ctx.fillStyle = '#18202a';
        ctx.fillRect(-5, 6, 10, 2);

        // Continuous 360-degree Y-Axis Rotation
        const angle = globalTime * 0.04;
        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);

        const dishRadiusX = Math.max(5, 22 * Math.abs(cosA) + 3);
        const dishRadiusY = 11;
        const isFacingFront = sinA >= 0;
        const facingSide = cosA >= 0 ? 1 : -1;

        // Joint Cap
        ctx.fillStyle = '#4a5768';
        ctx.beginPath(); ctx.arc(0, 0, 3.5, 0, Math.PI * 2); ctx.fill();

        ctx.translate(0, -4);

        if (!isFacingFront) {
          // --- BACK FACE OF DISH (Full 3D Curved Shell) ---
          // Main Back Shell Body
          const backGrad = ctx.createLinearGradient(-dishRadiusX, -6, dishRadiusX, -6);
          backGrad.addColorStop(0, '#1c2533');
          backGrad.addColorStop(0.35, '#3e4d61');
          backGrad.addColorStop(0.7, '#2a3646');
          backGrad.addColorStop(1, '#16202c');
          ctx.fillStyle = backGrad;

          ctx.beginPath();
          ctx.ellipse(0, -6, dishRadiusX, dishRadiusY, 0, 0, Math.PI * 2);
          ctx.fill();

          // Outer Edge Rim Highlight
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
          ctx.lineWidth = 1.2;
          ctx.stroke();

          // Structural Back Bracing (X-Truss & Center Hub)
          ctx.strokeStyle = '#141c26';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(-dishRadiusX * 0.7, -6); ctx.lineTo(dishRadiusX * 0.7, -6);
          ctx.moveTo(0, -6 - dishRadiusY * 0.7); ctx.lineTo(0, -6 + dishRadiusY * 0.7);
          ctx.stroke();

          // Center Mounting Plate Hub
          ctx.fillStyle = '#2d3848';
          ctx.beginPath();
          ctx.ellipse(0, -6, Math.min(5, dishRadiusX * 0.4), 3.5, 0, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // --- FRONT FACE OF DISH (Full 3D Concave Metallic Bowl) ---
          // Outer Metallic Dish Bowl
          const frontGrad = ctx.createLinearGradient(-dishRadiusX, -6, dishRadiusX, -6);
          frontGrad.addColorStop(0, '#324050');
          frontGrad.addColorStop(0.3, '#7c8e9e');
          frontGrad.addColorStop(0.7, '#a2b3c4');
          frontGrad.addColorStop(1, '#24303e');
          ctx.fillStyle = frontGrad;

          ctx.beginPath();
          ctx.ellipse(0, -6, dishRadiusX, dishRadiusY, 0, 0, Math.PI * 2);
          ctx.fill();

          // Outer Rim Highlight Line
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.lineWidth = 1.4;
          ctx.stroke();

          // Inner Concave Depth Shadow
          const innerGrad = ctx.createLinearGradient(-dishRadiusX * 0.5, -12, dishRadiusX * 0.5, 0);
          innerGrad.addColorStop(0, 'rgba(12, 18, 26, 0.75)');
          innerGrad.addColorStop(1, 'rgba(45, 60, 75, 0.15)');
          ctx.fillStyle = innerGrad;
          ctx.beginPath();
          ctx.ellipse(0, -6, Math.max(3, dishRadiusX - 3), dishRadiusY - 2.5, 0, 0, Math.PI * 2);
          ctx.fill();

          // Feed Horn Receiver Arm
          const hornLen = (dishRadiusX * 0.55) * facingSide;
          ctx.strokeStyle = '#e0e8f5';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(0, -6);
          ctx.lineTo(hornLen, -9);
          ctx.stroke();

          // Red Receiver Sensor Light
          ctx.fillStyle = '#ff3333';
          ctx.shadowColor = '#ff3333';
          ctx.shadowBlur = 5;
          ctx.beginPath(); ctx.arc(hornLen, -9, 2, 0, Math.PI * 2); ctx.fill();
          ctx.shadowBlur = 0;
        }

        ctx.restore();
      }

      // --- 2. RED WARNING ALARM BEACON (ON RIGHT SIDE OF ROOF: centerX + 14) ---
      const beaconX = centerX + (G.upgrades && G.upgrades.radar ? 14 : 0);
      const beaconY = roofTopY - 6;

      ctx.fillStyle = '#222';
      ctx.fillRect(beaconX - 2, beaconY, 4, 6);

      if (G.enemyKnowsUs || G.health < G.maxHealth) G.alarmActive = true;
      if (G.alarmActive) {
        const rotAngle = globalTime * 0.08;
        const isFront = Math.sin(rotAngle) > 0;
        ctx.fillStyle = isFront ? '#ff3333' : '#660000';
        ctx.shadowColor = '#ff3333'; ctx.shadowBlur = isFront ? 15 : 4;
        ctx.beginPath(); ctx.arc(beaconX, beaconY - 3, 4, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;

        if (isFront) {
          ctx.save();
          ctx.translate(beaconX, beaconY - 3);
          const beamX = Math.cos(rotAngle) * 280;
          const beamY = Math.sin(rotAngle) * 90 + 40;
          const grad = ctx.createLinearGradient(0, 0, beamX, beamY);
          grad.addColorStop(0, 'rgba(255, 30, 30, 0.6)');
          grad.addColorStop(1, 'rgba(255, 30, 30, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(beamX - 90, beamY);
          ctx.lineTo(beamX + 90, beamY);
          ctx.fill();
          ctx.restore();
        }
      } else {
        ctx.fillStyle = '#880000';
        ctx.beginPath(); ctx.arc(beaconX, beaconY - 3, 3.5, 0, Math.PI * 2); ctx.fill();
      }
    }

    function drawProcedural3DTHAADSystem(ctx, aax, aay, globalTime) {
      ctx.save();
      ctx.translate(aax, aay);

      const isReloading = G.aaCooldown && G.aaCooldown > 0;

      // 1. Ground Outrigger Hydraulic Stabilizers
      ctx.fillStyle = '#182018';
      ctx.fillRect(-52, -2, 8, 4);
      ctx.fillRect(44, -2, 8, 4);
      ctx.fillStyle = '#4a5848';
      ctx.fillRect(-50, -8, 4, 8);
      ctx.fillRect(46, -8, 4, 8);

      // 2. Heavy 8x8 Tactical Truck Chassis Frame
      const truckW = 100;
      const truckX = -50;
      const truckY = -20;

      // Lower Chassis Frame
      ctx.fillStyle = '#151b14';
      ctx.fillRect(truckX, truckY + 10, truckW, 10);

      // 3. Heavy 8-Wheel System (4 Dual Axles)
      const wheelXs = [-40, -24, 18, 36];
      wheelXs.forEach(wx => {
        // Outer Tire Rubber
        ctx.fillStyle = '#111711';
        ctx.beginPath(); ctx.arc(wx, 0, 7, 0, Math.PI * 2); ctx.fill();
        // Inner Steel Rim
        ctx.fillStyle = '#323d31';
        ctx.beginPath(); ctx.arc(wx, 0, 4, 0, Math.PI * 2); ctx.fill();
        // Axle Cap
        ctx.fillStyle = '#6a7869';
        ctx.beginPath(); ctx.arc(wx, 0, 1.8, 0, Math.PI * 2); ctx.fill();
      });

      // 4. Armored Driver Cabin (Front Left of TEL Truck)
      const cabGrad = ctx.createLinearGradient(truckX, truckY, truckX + 28, truckY);
      cabGrad.addColorStop(0, '#222b21');
      cabGrad.addColorStop(0.5, '#354333');
      cabGrad.addColorStop(1, '#253023');
      ctx.fillStyle = cabGrad;

      ctx.beginPath();
      ctx.moveTo(truckX, truckY + 12);
      ctx.lineTo(truckX, truckY + 4);
      ctx.lineTo(truckX + 8, truckY - 4); // Slanted windshield
      ctx.lineTo(truckX + 26, truckY - 4);
      ctx.lineTo(truckX + 28, truckY + 12);
      ctx.closePath();
      ctx.fill();

      // Cabin Armor Edge Highlight
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Slanted Bulletproof Windshield
      ctx.fillStyle = '#182b26';
      ctx.beginPath();
      ctx.moveTo(truckX + 2, truckY + 3);
      ctx.lineTo(truckX + 8, truckY - 2);
      ctx.lineTo(truckX + 16, truckY - 2);
      ctx.lineTo(truckX + 16, truckY + 3);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.fillRect(truckX + 4, truckY - 1, 6, 3);

      // Headlight Fixtures
      ctx.fillStyle = '#ffea88';
      ctx.shadowColor = '#ffea88'; ctx.shadowBlur = 4;
      ctx.fillRect(truckX, truckY + 6, 2, 4);
      ctx.shadowBlur = 0;

      // Main Truck Flatbed Deck
      ctx.fillStyle = '#2b362a';
      ctx.fillRect(truckX + 26, truckY + 2, 74, 10);

      // 5. THAAD Hydraulic Lift Actuator Arm & Rear Pivot Mount
      // Pivot is at rear of truck flatbed deck: (-15, truckY + 2)
      const pivotX = -15;
      const pivotY = truckY + 2;

      ctx.fillStyle = '#1c241b';
      ctx.beginPath(); ctx.arc(pivotX, pivotY, 4.5, 0, Math.PI * 2); ctx.fill();

      // Elevation Angle (Stowed horizontal when reloading, elevated ~45° when ready)
      const elevationAngle = isReloading ? 0 : (-0.7 + Math.sin(globalTime * 0.02) * 0.03);

      // Hydraulic Cylinder Piston on Truck Deck
      if (!isReloading) {
        ctx.strokeStyle = '#9aa898';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(truckX + 50, truckY + 4);
        ctx.lineTo(pivotX + Math.cos(elevationAngle) * 30, pivotY + Math.sin(elevationAngle) * 30);
        ctx.stroke();
      }

      ctx.save();
      ctx.translate(pivotX, pivotY);
      ctx.rotate(elevationAngle);

      // 6. THAAD 8-Cell Missile Launcher Container Pack
      // Container extends FORWARD from the pivot hinge!
      const packW = 64;
      const packH = 24;
      const packX = -4; // Starts just behind pivot and extends forward 64px
      const packY = -packH;

      // Main Container Body Gradient
      const packGrad = ctx.createLinearGradient(packX, packY, packX + packW, packY + packH);
      packGrad.addColorStop(0, '#2d3b2b');
      packGrad.addColorStop(0.35, '#425440');
      packGrad.addColorStop(0.7, '#314030');
      packGrad.addColorStop(1, '#1b241a');
      ctx.fillStyle = packGrad;

      ctx.beginPath();
      ctx.roundRect(packX, packY, packW, packH, 3);
      ctx.fill();

      // Container Structural Ribs / Armor Plates
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.lineWidth = 1.5;
      for (let rx = packX + 12; rx < packX + packW - 8; rx += 13) {
        ctx.beginPath(); ctx.moveTo(rx, packY); ctx.lineTo(rx, packY + packH); ctx.stroke();
      }

      // Top Highlight Edge
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(packX, packY); ctx.lineTo(packX + packW, packY); ctx.stroke();

      // Rear Hinge Support & Deflector Cap
      ctx.fillStyle = '#141a14';
      ctx.fillRect(packX - 3, packY + 2, 4, packH - 4);

      // 7. THAAD Launch Canister Tubes (Front Face)
      const capX = packX + packW;
      const capY = packY + 2;

      ctx.fillStyle = '#111711';
      ctx.fillRect(capX, capY, 5, packH - 4);

      // 8 Canister Tube Front Caps (2 Rows of 4 Tubes)
      for (let r = 0; r < 2; r++) {
        for (let c = 0; c < 4; c++) {
          const tx = capX + 2;
          const ty = capY + 3 + r * 10 + c * 2.2;

          // Tube Ring
          ctx.fillStyle = '#d0dad0';
          ctx.beginPath(); ctx.arc(tx, ty, 2.5, 0, Math.PI * 2); ctx.fill();

          // Red Missile Tip Light / Sensor
          ctx.fillStyle = isReloading ? '#555' : '#ff2222';
          if (!isReloading && Math.floor(globalTime * 0.1 + c) % 2 === 0) {
            ctx.shadowColor = '#ff2222'; ctx.shadowBlur = 4;
          }
          ctx.beginPath(); ctx.arc(tx, ty, 1.2, 0, Math.PI * 2); ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      ctx.restore(); // End Launcher Pack Rotation

      ctx.restore(); // End THAAD System Translation

      // 8. Cooldown Reloading Indicator Floating Badge
      if (isReloading) {
        ctx.fillStyle = 'rgba(20, 25, 20, 0.85)';
        ctx.strokeStyle = '#d4a030';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(aax - 32, aay - 60, 64, 24, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffdd66';
        ctx.font = 'bold 12px "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⏳ ' + G.aaCooldown, aax, aay - 48);
      }
    }

    function drawProcedural3DFortifiedWalls(ctx, W, H, globalTime, drawHazardBar = true) {
      const wallY = H * 0.55 + 16;
      const wallH = 22;

      // 1. Outer Anti-Tank Concrete Barriers (Dragon's Teeth) on Tarmac
      const toothSpacing = 50;
      for (let tx = -10; tx <= W + 20; tx += toothSpacing) {
        ctx.fillStyle = '#1c242c';
        ctx.beginPath();
        ctx.moveTo(tx, wallY + 12);
        ctx.lineTo(tx + 8, wallY + 2);
        ctx.lineTo(tx + 16, wallY + 12);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#3a4856';
        ctx.beginPath();
        ctx.moveTo(tx + 8, wallY + 2);
        ctx.lineTo(tx + 16, wallY + 12);
        ctx.lineTo(tx + 12, wallY + 12);
        ctx.closePath();
        ctx.fill();
      }

      // 2. Main 3D Reinforced Concrete & Armor Plate Perimeter Wall
      const wallGrad = ctx.createLinearGradient(0, wallY - wallH, 0, wallY);
      wallGrad.addColorStop(0, '#4a5a6b');
      wallGrad.addColorStop(0.3, '#324150');
      wallGrad.addColorStop(0.7, '#24303c');
      wallGrad.addColorStop(1, '#151e26');
      ctx.fillStyle = wallGrad;
      ctx.fillRect(-20, wallY - wallH, W + 40, wallH);

      // Top Steel Edge Rim & Bevel Highlight
      ctx.fillStyle = '#6a7d91';
      ctx.fillRect(-20, wallY - wallH, W + 40, 2.5);

      // Interlocking Modular Armor Panels & Vertical Pillars
      const panelW = 55;
      for (let px = -20; px <= W + 40; px += panelW) {
        // Vertical Steel Pillar Joint
        const pillarGrad = ctx.createLinearGradient(px, wallY - wallH - 3, px + 10, wallY - wallH - 3);
        pillarGrad.addColorStop(0, '#24303c');
        pillarGrad.addColorStop(0.5, '#526478');
        pillarGrad.addColorStop(1, '#18222a');
        ctx.fillStyle = pillarGrad;
        ctx.fillRect(px, wallY - wallH - 3, 10, wallH + 3);

        // Pillar Top Cap
        ctx.fillStyle = '#7a8fa6';
        ctx.fillRect(px - 1, wallY - wallH - 5, 12, 2.5);

        // Panel Recessed Grooves & Rivets
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(px + 12, wallY - wallH + 4, panelW - 14, wallH - 8);

        // Steel Rivet Dots
        ctx.fillStyle = '#8aa0b8';
        ctx.fillRect(px + 14, wallY - wallH + 6, 2, 2);
        ctx.fillRect(px + panelW - 4, wallY - wallH + 6, 2, 2);
        ctx.fillRect(px + 14, wallY - 6, 2, 2);
        ctx.fillRect(px + panelW - 4, wallY - 6, 2, 2);
      }

      // 3. High-Tech Hologram Laser Barrier Grid (Pulsing Cyan Shield Line)
      const barrierY = wallY - wallH - 6;
      ctx.strokeStyle = 'rgba(0, 220, 255, 0.6)';
      ctx.shadowColor = '#00dcff';
      ctx.shadowBlur = 8;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-20, barrierY);
      ctx.lineTo(W + 20, barrierY);
      ctx.stroke();

      // Pulsing Vertical Security Nodes
      for (let nx = 15; nx < W; nx += 110) {
        const pulse = Math.sin(globalTime * 0.08 + nx) * 0.5 + 0.5;
        ctx.fillStyle = pulse > 0.4 ? '#00e5ff' : '#0077aa';
        ctx.shadowColor = '#00e5ff';
        ctx.shadowBlur = 10 * pulse;
        ctx.beginPath();
        ctx.arc(nx, barrierY, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      // 4. Razor Wire Coil Strand across Top Rim
      ctx.strokeStyle = 'rgba(210, 225, 240, 0.8)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let rx = -20; rx <= W + 20; rx += 8) {
        const ry = barrierY - 4 + Math.sin(rx * 0.4) * 3;
        if (rx === -20) ctx.moveTo(rx, ry);
        else ctx.lineTo(rx, ry);
      }
      ctx.stroke();

      // 5. Heavy Armored Guard Bastions / Watchtowers at Perimeter Intervals
      const towerXs = [W * 0.15, W * 0.50, W * 0.85];
      towerXs.forEach(tx => {
        ctx.save();
        ctx.translate(tx, wallY - wallH - 4);

        // Bastion Octagonal Tower Shaft
        const bGrad = ctx.createLinearGradient(-12, 0, 12, 0);
        bGrad.addColorStop(0, '#1c2630');
        bGrad.addColorStop(0.4, '#425366');
        bGrad.addColorStop(1, '#141d24');
        ctx.fillStyle = bGrad;
        ctx.fillRect(-12, -18, 24, 22);

        // Bastion Roof Canopy
        ctx.fillStyle = '#101720';
        ctx.beginPath();
        ctx.moveTo(-16, -18);
        ctx.lineTo(16, -18);
        ctx.lineTo(12, -24);
        ctx.lineTo(-12, -24);
        ctx.closePath();
        ctx.fill();

        // Observation Slit with Glowing Security Glass
        ctx.fillStyle = '#00dcff';
        ctx.shadowColor = '#00dcff';
        ctx.shadowBlur = 6;
        ctx.fillRect(-8, -14, 16, 3);
        ctx.shadowBlur = 0;

        // Searchlight Sweep Beam
        const beamAngle = Math.sin(globalTime * 0.03 + tx) * 0.4 - 0.2;
        ctx.save();
        ctx.translate(0, -22);
        ctx.rotate(beamAngle);

        const beamGrad = ctx.createLinearGradient(0, 0, 0, 140);
        beamGrad.addColorStop(0, 'rgba(0, 220, 255, 0.45)');
        beamGrad.addColorStop(1, 'rgba(0, 220, 255, 0)');
        ctx.fillStyle = beamGrad;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-25, 140);
        ctx.lineTo(25, 140);
        ctx.closePath();
        ctx.fill();

        // Lens Bulb
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(0, 0, 2.5, 0, Math.PI * 2); ctx.fill();

        ctx.restore();
        ctx.restore();
      });

      // 6. Bottom Security Hazard Stripe Line
      if (drawHazardBar) {
        const hazardY = H - 20;
        ctx.fillStyle = '#182028';
        ctx.fillRect(0, hazardY, W, 20);
        for (let hx = 0; hx < W; hx += 30) {
          ctx.fillStyle = '#ffcc00';
          ctx.beginPath();
          ctx.moveTo(hx, hazardY);
          ctx.lineTo(hx + 15, hazardY);
          ctx.lineTo(hx + 5, hazardY + 20);
          ctx.lineTo(hx - 10, hazardY + 20);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = '#111';
          ctx.beginPath();
          ctx.moveTo(hx + 15, hazardY);
          ctx.lineTo(hx + 30, hazardY);
          ctx.lineTo(hx + 20, hazardY + 20);
          ctx.lineTo(hx + 5, hazardY + 20);
          ctx.closePath();
          ctx.fill();
        }
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(0, hazardY, W, 2);
      }
    }

    function drawProcedural3DEngineeringUnit(ctx, ex, ey, globalTime) {
      ctx.save();
      ctx.translate(ex, ey);

      // 1. Heavy Caterpillar Treads & Wheels
      const treadW = 74;
      const treadH = 14;
      const treadX = -37;
      const treadY = -14;

      // Lower Tread Band
      ctx.fillStyle = '#121812';
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(treadX, treadY, treadW, treadH, 6); else ctx.rect(treadX, treadY, treadW, treadH);
      ctx.fill();
      ctx.strokeStyle = '#283428';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Dual Roller Wheels (5 Wheels)
      for (let wx = treadX + 9; wx <= treadX + treadW - 9; wx += 14) {
        ctx.fillStyle = '#2a3629';
        ctx.beginPath(); ctx.arc(wx, treadY + 7, 4.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#526650';
        ctx.beginPath(); ctx.arc(wx, treadY + 7, 2, 0, Math.PI * 2); ctx.fill();
      }

      // 2. Heavy Armored Vehicle Body Superstructure
      const bodyX = -32;
      const bodyY = -34;
      const bodyW = 64;
      const bodyH = 20;

      const bodyGrad = ctx.createLinearGradient(bodyX, bodyY, bodyX, bodyY + bodyH);
      bodyGrad.addColorStop(0, '#f2ab00');
      bodyGrad.addColorStop(0.4, '#d49200');
      bodyGrad.addColorStop(0.8, '#a67200');
      bodyGrad.addColorStop(1, '#664600');
      ctx.fillStyle = bodyGrad;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(bodyX, bodyY, bodyW, bodyH, 3); else ctx.rect(bodyX, bodyY, bodyW, bodyH);
      ctx.fill();

      // Body Bevel Edge Highlight
      ctx.strokeStyle = '#ffce42';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(bodyX, bodyY); ctx.lineTo(bodyX + bodyW, bodyY);
      ctx.stroke();

      // Rear Generator & Gas Tanks (Red & Blue Cylinders)
      ctx.fillStyle = '#cc2222'; ctx.fillRect(bodyX + 4, bodyY - 10, 6, 10); // Red Oxygen
      ctx.fillStyle = '#2266cc'; ctx.fillRect(bodyX + 12, bodyY - 10, 6, 10); // Blue Acetylene

      // Industrial Hazard Stripe Panel
      const hazardY = bodyY + bodyH - 6;
      ctx.fillStyle = '#111';
      ctx.fillRect(bodyX + 20, hazardY, 36, 5);
      ctx.fillStyle = '#ffcc00';
      for (let sx = 20; sx < 56; sx += 8) {
        ctx.beginPath();
        ctx.moveTo(bodyX + sx, hazardY + 5);
        ctx.lineTo(bodyX + sx + 4, hazardY);
        ctx.lineTo(bodyX + sx + 7, hazardY);
        ctx.lineTo(bodyX + sx + 3, hazardY + 5);
        ctx.closePath();
        ctx.fill();
      }

      // Operator Cabin (Right Side)
      ctx.fillStyle = '#182418';
      ctx.fillRect(bodyX + 38, bodyY - 14, 20, 14);
      // Tinted Cyan Window
      ctx.fillStyle = '#44ccff';
      ctx.shadowColor = '#44ccff'; ctx.shadowBlur = 3;
      ctx.fillRect(bodyX + 42, bodyY - 11, 12, 8);
      ctx.shadowBlur = 0;
      // Protective Cage Bars
      ctx.strokeStyle = '#111'; ctx.lineWidth = 1;
      ctx.strokeRect(bodyX + 42, bodyY - 11, 12, 8);

      // 3. 3D Lattice Boom Crane Arm (Hydraulic Telescopic Boom)
      const boomPivotX = bodyX + 10;
      const boomPivotY = bodyY + 4;
      const boomAngle = -0.7 + Math.sin(globalTime * 0.03) * 0.04;
      const boomLen = 75;

      ctx.save();
      ctx.translate(boomPivotX, boomPivotY);
      ctx.rotate(boomAngle);

      // Lattice Boom Truss Elements
      ctx.strokeStyle = '#e69d00';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, -3); ctx.lineTo(boomLen, -2);
      ctx.moveTo(0, 3); ctx.lineTo(boomLen, 2);
      ctx.stroke();

      // Diagonal Cross Bracing (Lattice Structure)
      ctx.strokeStyle = '#b87c00';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let bx = 0; bx < boomLen; bx += 10) {
        ctx.moveTo(bx, -3); ctx.lineTo(bx + 10, 3);
        ctx.moveTo(bx + 10, -3); ctx.lineTo(bx, 3);
      }
      ctx.stroke();

      // Boom Apex Pulley Wheel
      ctx.fillStyle = '#222';
      ctx.beginPath(); ctx.arc(boomLen, 0, 4, 0, Math.PI * 2); ctx.fill();

      ctx.restore(); // End Boom Rotation

      // 4. Steel Cable & Heavy Lifting Hook Assembly
      const tipX = boomPivotX + Math.cos(boomAngle) * boomLen;
      const tipY = boomPivotY + Math.sin(boomAngle) * boomLen;
      const hookY = tipY + 35 + Math.sin(globalTime * 0.05) * 3;

      // Winch Steel Cable
      ctx.strokeStyle = '#cccccc';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(tipX, tipY);
      ctx.lineTo(tipX, hookY);
      ctx.stroke();

      // Heavy Crane Hook Block
      ctx.fillStyle = '#222';
      ctx.fillRect(tipX - 4, hookY - 4, 8, 6);
      ctx.strokeStyle = '#666'; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(tipX, hookY + 4, 4, 0, Math.PI);
      ctx.stroke();

      // 5. Dynamic Electric Arc Welding Sparks (Bright Cyan/White Arc Flash)
      if (Math.random() < 0.6) {
        const sparkX = tipX + (Math.random() - 0.5) * 6;
        const sparkY = hookY + 6 + (Math.random() - 0.5) * 4;

        // Radiant Arc Glow
        const glowGrad = ctx.createRadialGradient(sparkX, sparkY, 0, sparkX, sparkY, 25);
        glowGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
        glowGrad.addColorStop(0.3, 'rgba(100, 220, 255, 0.7)');
        glowGrad.addColorStop(1, 'rgba(0, 150, 255, 0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath(); ctx.arc(sparkX, sparkY, 25, 0, Math.PI * 2); ctx.fill();

        // Intense Arc Flash Point
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#88eeff';
        ctx.shadowBlur = 15;
        ctx.beginPath(); ctx.arc(sparkX, sparkY, 4, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;

        // Flying Spark Particles
        for (let p = 0; p < 6; p++) {
          const px = sparkX + (Math.random() - 0.5) * 25;
          const py = sparkY + Math.random() * 20;
          ctx.fillStyle = Math.random() < 0.5 ? '#ffffff' : '#88e0ff';
          ctx.beginPath(); ctx.arc(px, py, Math.random() * 2 + 0.8, 0, Math.PI * 2); ctx.fill();
        }
      }

      ctx.restore(); // End Translation
    }

    function drawProcedural3DRunway(ctx, W, H, isDay, isSunset, globalTime) {
      const isNight = !isDay;
      const runwayY = H * 0.67;
      const runwayH = 95;

      // 1. Concrete Shoulder Pads
      ctx.fillStyle = isDay ? '#1b241c' : '#0d140d';
      ctx.beginPath();
      ctx.moveTo(-15, runwayY - 10);
      ctx.lineTo(W + 15, runwayY - 10);
      ctx.lineTo(W + 35, runwayY + runwayH + 12);
      ctx.lineTo(-35, runwayY + runwayH + 12);
      ctx.closePath();
      ctx.fill();

      // Top & Bottom Shoulder Bevel Rims
      ctx.fillStyle = '#2d382e';
      ctx.fillRect(-15, runwayY - 10, W + 30, 10);

      // 2. Main 3D Heavy Military Asphalt Runway Slab
      const rwGrad = ctx.createLinearGradient(0, runwayY, 0, runwayY + runwayH);
      rwGrad.addColorStop(0, '#1c222a');
      rwGrad.addColorStop(0.2, '#28313d');
      rwGrad.addColorStop(0.5, isDay ? '#3a4656' : (isSunset ? '#2e2836' : '#222b38')); // Metallic center sheen
      rwGrad.addColorStop(0.85, '#242c37');
      rwGrad.addColorStop(1, '#161b22');
      ctx.fillStyle = rwGrad;

      ctx.beginPath();
      ctx.moveTo(-10, runwayY);
      ctx.lineTo(W + 10, runwayY);
      ctx.lineTo(W + 30, runwayY + runwayH);
      ctx.lineTo(-30, runwayY + runwayH);
      ctx.closePath();
      ctx.fill();

      // 3D Front Edge Asphalt Slab Thickness (Depth)
      const slabDepthGrad = ctx.createLinearGradient(0, runwayY + runwayH, 0, runwayY + runwayH + 8);
      slabDepthGrad.addColorStop(0, '#12171e');
      slabDepthGrad.addColorStop(1, '#090c10');
      ctx.fillStyle = slabDepthGrad;
      ctx.fillRect(-30, runwayY + runwayH, W + 60, 8);

      // Rubber Tire Skid Marks (Jet Landing Weathering)
      ctx.fillStyle = 'rgba(10, 14, 20, 0.45)';
      for (let rx = 40; rx < W; rx += 170) {
        ctx.fillRect(rx, runwayY + 34, 75, 7);
        ctx.fillRect(rx + 35, runwayY + 54, 90, 6);
        ctx.fillRect(rx - 30, runwayY + 44, 55, 5);
      }

      // --- 3. ICAO STANDARD MILITARY RUNWAY MARKINGS ---
      // Continuous Yellow Boundary Lines
      ctx.fillStyle = '#f5b800';
      ctx.fillRect(-10, runwayY + 3, W + 20, 3.5);
      ctx.fillRect(-30, runwayY + runwayH - 6.5, W + 60, 3.5);

      // Threshold Piano Key Markings (Runway Ends)
      ctx.fillStyle = '#e8f0f8';
      const keyH = 24;
      for (let k = 0; k < 7; k++) {
        const ky = runwayY + 12 + k * 10;
        ctx.fillRect(10, ky, keyH, 6); // Left Threshold
        ctx.fillRect(W - 10 - keyH, ky, keyH, 6); // Right Threshold
      }

      // Touchdown Zone Aiming Point Blocks (TDZ Double Rectangles)
      ctx.fillRect(W * 0.22, runwayY + 18, 45, 12);
      ctx.fillRect(W * 0.22, runwayY + runwayH - 30, 45, 12);
      ctx.fillRect(W * 0.75, runwayY + 18, 45, 12);
      ctx.fillRect(W * 0.75, runwayY + runwayH - 30, 45, 12);

      // Dashed White Centerline with 3D Drop Shadow
      const dashW = 40;
      const dashGap = 35;
      const centerY = runwayY + runwayH / 2 - 3.5;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      for (let dx = -10; dx <= W + 40; dx += dashW + dashGap) {
        ctx.fillRect(dx + 2, centerY + 2, dashW, 7);
      }
      ctx.fillStyle = '#f0f6ff';
      for (let dx = -10; dx <= W + 40; dx += dashW + dashGap) {
        ctx.fillRect(dx, centerY, dashW, 7);
      }

      // --- 4. HIGH-INTENSITY FLUSH INSET RUNWAY LIGHTS ---
      const lightSpacing = 60;
      for (let lx = 0; lx <= W + 20; lx += lightSpacing) {
        const isBlinking = Math.sin(globalTime * 0.08 + lx * 0.05) > 0;
        drawRunwayFixtureLight(ctx, lx, runwayY - 3, isNight, isBlinking, 'rgba(0, 220, 255, 0.5)', '#ffffff');
        drawRunwayFixtureLight(ctx, lx, runwayY + runwayH + 3, isNight, isBlinking, 'rgba(0, 220, 255, 0.5)', '#ffffff');
      }

      // Entry & Exit Threshold Beacons
      drawRunwayFixtureLight(ctx, 12, runwayY - 3, isNight, true, 'rgba(0, 255, 100, 0.6)', '#00ff66');
      drawRunwayFixtureLight(ctx, 12, runwayY + runwayH + 3, isNight, true, 'rgba(0, 255, 100, 0.6)', '#00ff66');
      drawRunwayFixtureLight(ctx, W - 12, runwayY - 3, isNight, true, 'rgba(255, 34, 34, 0.6)', '#ff2222');
      drawRunwayFixtureLight(ctx, W - 12, runwayY + runwayH + 3, isNight, true, 'rgba(255, 34, 34, 0.6)', '#ff2222');
    }

    function drawRunwayFixtureLight(ctx, x, y, isNight, isLit, glowColor, coreColor) {
      ctx.fillStyle = '#1c242c';
      ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();

      if (isLit) {
        if (isNight) {
          ctx.fillStyle = glowColor;
          ctx.beginPath(); ctx.arc(x, y, 8, 0, Math.PI * 2); ctx.fill();
        }
        ctx.fillStyle = coreColor;
        ctx.beginPath(); ctx.arc(x, y, 2.2, 0, Math.PI * 2); ctx.fill();
      }
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

      if (animState === 'takeoff') totalFrames = 220;
      if (animState === 'resource_gain') totalFrames = 90;
      if (animState === 'enemy_attack') totalFrames = 80;
      if (animState === 'aa_intercept') totalFrames = 80;

      let fireOrigins = [];
      let fires = [];
      let smokes = [];
      if (G.health < G.maxHealth) {
        const missing = G.maxHealth - G.health;
        for (let i = 0; i < missing; i++) {
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

      let clouds = [
        { x: 60,  y: 40,  scale: 1.1, speed: 0.25, type: 'cumulus', alpha: 0.95 },
        { x: 380, y: 30,  scale: 0.85, speed: 0.18, type: 'cumulus', alpha: 0.88 },
        { x: 680, y: 65,  scale: 1.25, speed: 0.32, type: 'cumulus', alpha: 0.92 },
        { x: 220, y: 100, scale: 0.95, speed: 0.15, type: 'whispy',  alpha: 0.82 },
        { x: 540, y: 120, scale: 1.05, speed: 0.22, type: 'whispy',  alpha: 0.78 },
        { x: -100, y: 85, scale: 1.35, speed: 0.35, type: 'cumulus', alpha: 0.9 }
      ];

      function drawPixelRect(x, y, w, h, c) {
        ctx.fillStyle = c;
        ctx.fillRect(Math.floor(x), Math.floor(y), Math.floor(w), Math.floor(h));
      }


      function drawFrame() {
        frame++;
        const globalTime = performance.now() * 0.05;
        if (!G.visualTurn) G.visualTurn = G.turn;
        G.visualTurn += (G.turn - G.visualTurn) * 0.05;

        if (canvas.parentElement && canvas.parentElement.clientWidth > 0) {
          const targetW = Math.floor(canvas.parentElement.clientWidth);
          const targetH = Math.floor(canvas.parentElement.clientHeight);
          if (canvas.width !== targetW || canvas.height !== targetH) {
            canvas.width = targetW;
            canvas.height = targetH;
          }
        }

        const W = canvas.width || 800;
        const H = canvas.height || 400;

        const skyData = getSkyColors(G.visualTurn - 1);
        const grd = ctx.createLinearGradient(0, 0, 0, H * 0.55);
        grd.addColorStop(0, skyData.top);
        grd.addColorStop(1, skyData.bottom);
        ctx.fillStyle = grd; ctx.fillRect(0, 0, W, H);

        ctx.fillStyle = skyData.sunColor;
        ctx.beginPath();
        ctx.arc(W * 0.7, H * skyData.sunY, 40, 0, Math.PI * 2);
        if (skyData.isMoon) {
          ctx.fill();
          ctx.fillStyle = grd;
          ctx.beginPath(); ctx.arc(W * 0.7 - 10, H * skyData.sunY - 5, 35, 0, Math.PI * 2); ctx.fill();
        } else {
          ctx.shadowColor = skyData.sunColor;
          ctx.shadowBlur = 30;
          ctx.fill();
          ctx.shadowBlur = 0;
        }

        // Stars
        for (let i = 0; i < 40; i++) {
          const sx = (i * 97 + globalTime * 0.1) % W;
          const sy = (i * 53) % (H * 0.4);
          const starAlpha = Math.max(0, Math.sin(globalTime * 0.05 + i)) * (skyData.isMoon ? 1 : 0);
          if (starAlpha > 0) {
            ctx.fillStyle = `rgba(200, 220, 255, ${starAlpha})`;
            ctx.beginPath(); ctx.arc(sx, sy, 1.5, 0, Math.PI * 2); ctx.fill();
          }
        }

        drawProcedural3DMountains(ctx, W, H, isDay, isSunset);

        clouds.forEach(c => {
          c.x += c.speed;
          if (c.x - 120 * c.scale > W) c.x = -130 * c.scale;
          if (c.type === 'whispy') {
            drawVectorWhispyCloud(ctx, c.x, c.y, c.scale, skyData.isMoon, isSunset, c.alpha);
          } else {
            drawVectorCumulusCloud(ctx, c.x, c.y, c.scale, skyData.isMoon, isSunset, c.alpha);
          }
        });

        drawProcedural3DMountains(ctx, W, H, isDay, isSunset);

        const groundGrad = ctx.createLinearGradient(0, H * 0.55, 0, H);
        groundGrad.addColorStop(0, isDay ? '#2c402c' : '#1a261a');
        groundGrad.addColorStop(1, isDay ? '#1b291b' : '#0d140d');
        ctx.fillStyle = groundGrad; ctx.fillRect(0, H * 0.55, W, H * 0.45);

        // Fortified Wall Background Perimeter (BEHIND hangars & tower)
        if (G.upgrades && G.upgrades.walls) {
          try {
            drawProcedural3DFortifiedWalls(ctx, W, H, globalTime, true);
          } catch (err) {
            console.error("Fortified walls draw error:", err);
          }
        }

        const isNight = !isDay;
        const runwayY = H * 0.67;

        // Master-Level Procedural 3D Runway & Airfield
        try {
          drawProcedural3DRunway(ctx, W, H, isDay, isSunset, globalTime);
        } catch (err) {
          console.error("Runway draw error:", err);
        }

        // Airport Buildings (Hangars & Control Tower IN FRONT of wall)
        const hangarW = 120;
        const hangarH = 80;
        for (let i = 0; i < 3; i++) {
          const bx = W * 0.1 + i * W * 0.28;
          const by = H * 0.55 - hangarH + 20;
          drawProcedural3DHangar(ctx, bx, by, hangarW, hangarH, isDay, isSunset, globalTime, i);
        }

        const tx = W * 0.82; const tw = 50; const th = H * 0.28; const ty = H * 0.55 - th + 20;
        drawProcedural3DControlTower(ctx, tx, ty, tw, th, isDay, isSunset, globalTime);

        // Upgrades Drawing
        if (G.upgrades && G.upgrades.stealth) {
          const sx = W * 0.65; const sy = runwayY - 10;
          ctx.save(); ctx.translate(sx, sy);
          ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(60, -20); ctx.lineTo(20, -5); ctx.lineTo(60, 10); ctx.fill();
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



        if (G.upgrades && G.upgrades.aa) {
          const aax = W * 0.70; const aay = H * 0.55 + 16;
          drawProcedural3DTHAADSystem(ctx, aax, aay, globalTime);
        }

        if (G.aaDebrisTurns && G.aaDebrisTurns > 0) {
          const dx = W * 0.4; const dy = H * 0.55 + 20;
          ctx.fillStyle = '#333'; ctx.fillRect(dx - 15, dy - 5, 30, 10);
          ctx.fillStyle = '#222'; ctx.fillRect(dx + 10, dy - 12, 15, 12);
          ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(dx - 5, dy, 12, 0, Math.PI * 2); ctx.fill();
          if (Math.random() < 0.5) {
            ctx.fillStyle = 'rgba(100,100,100,0.5)';
            ctx.beginPath(); ctx.arc(dx + (Math.random() - 0.5) * 20, dy - 10 - Math.random() * 20, 10 + Math.random() * 10, 0, Math.PI * 2); ctx.fill();
          }
        }

        if (G.upgrades && G.upgrades.eng) {
          const ex = W * 0.06; const ey = H * 0.55 + 16;
          drawProcedural3DEngineeringUnit(ctx, ex, ey, globalTime);
        }

        if (G.upgrades && G.upgrades.ammo) {
          const amx = W * 0.45; const amy = H * 0.55 + 15;
          ctx.fillStyle = '#222'; ctx.fillRect(amx, amy - 20, 60, 20);
          ctx.fillStyle = '#333'; ctx.fillRect(amx + 5, amy - 15, 50, 15);
          ctx.fillStyle = '#111'; ctx.fillRect(amx + 15, amy - 15, 10, 15); ctx.fillRect(amx + 35, amy - 15, 10, 15);
          ctx.fillStyle = '#ffaa00'; ctx.fillRect(amx + 10, amy - 25, 40, 5);
          ctx.fillStyle = '#111'; ctx.fillRect(amx + 15, amy - 25, 5, 5); ctx.fillRect(amx + 25, amy - 25, 5, 5); ctx.fillRect(amx + 35, amy - 25, 5, 5);
          if (Math.sin(globalTime * 0.1) > 0) {
            ctx.fillStyle = '#ff3300'; ctx.beginPath(); ctx.arc(amx + 5, amy - 22, 2, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(amx + 55, amy - 22, 2, 0, Math.PI * 2); ctx.fill();
          }
        }

        if (isRainy) {
          ctx.strokeStyle = 'rgba(180, 200, 220, 0.3)';
          ctx.lineWidth = 1.5; ctx.beginPath();
          rainDrops.forEach(r => {
            ctx.moveTo(r.x, r.y); ctx.lineTo(r.x - r.s * 0.4, r.y + r.s * 1.5);
            r.y += r.s * 1.5; r.x -= r.s * 0.4;
            if (r.y > H) {
              r.y = -10; r.x = Math.random() * W + 100;
              // splash
              ctx.moveTo(r.x, H); ctx.lineTo(r.x - 3, H - 3);
              ctx.moveTo(r.x, H); ctx.lineTo(r.x + 3, H - 3);
            }
          });
          ctx.stroke();
        } if (animState === 'enemy_attack') {
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

        let basePx = Math.max(W * 0.16, 210);
        let px = basePx, py = runwayY + 30, planeScale = 1;
        let planeVisible = true;
        let pilotVisible = true;
        let pilotState = 'pilot_idle';
        let pilotX = px - 180, pilotY = py - 30;

        if (animState === 'takeoff') {
          if (frame < 30) {
            pilotState = 'pilot_idle';
          } else if (frame < 60) {
            pilotState = 'pilot_salute';
          } else if (frame < 80) {
            pilotState = 'pilot_helmet';
          } else if (frame < 120) {
            pilotState = 'pilot_climb';
            pilotX += (frame - 80) * 4.5;
            pilotY -= (frame - 80) * 0.4;
          } else {
            pilotVisible = false;
            const pFrame = frame - 120;
            const takeoffDur = 100;
            const planeProgress = Math.min(pFrame / takeoffDur, 1);
            if (planeProgress < 0.4) {
              px = basePx + planeProgress * W * 0.8; py = runwayY + 30; planeScale = 1;
            } else if (planeProgress < 0.7) {
              const t = (planeProgress - 0.4) / 0.3;
              const startX = basePx + 0.4 * W * 0.8;
              px = startX + t * W * 0.5; py = runwayY + 30 - t * 40; planeScale = 1 - t * 0.2;
            } else {
              const t = (planeProgress - 0.7) / 0.3;
              const startX = basePx + 0.4 * W * 0.8 + W * 0.5;
              px = startX + t * W * 0.3; py = runwayY - 10 - t * 100; planeScale = 0.8 - t * 0.3;
            }
          }
        }

        let pilotYOffset = (animState === 'idle') ? Math.sin(globalTime * 0.05 + 1) * 2 : 0;
        if (pilotVisible && animState !== 'enemy_attack') {
          drawHighResPilot(ctx, pilotX, pilotY + pilotYOffset, 2.2, pilotState);
        }

        if (planeVisible && animState !== 'enemy_attack') {
          let altitude = (runwayY + 30) - py;
          if (altitude < 180) {
            let shadowAlpha = Math.max(0, 0.45 * (1 - altitude / 180));
            let shadowScale = 1 - (altitude / 350);

            ctx.save();
            // Ground Y position for shadow directly underneath the plane fuselage/wheels
            let groundY = py + 18 + altitude * 0.55;
            ctx.translate(px + altitude * 0.25, groundY);

            // Contact shadow directly beneath wheels when landed
            if (altitude < 20) {
              ctx.fillStyle = `rgba(0, 0, 0, ${(1 - altitude / 20) * 0.5})`;
              ctx.beginPath();
              ctx.ellipse(0, 2, 70 * planeScale, 6 * planeScale, 0, 0, Math.PI * 2);
              ctx.fill();
            }

            // Scale and skew the aircraft directional shadow
            ctx.scale(-planeScale * 1.6 * shadowScale, planeScale * 1.6 * shadowScale * 0.25);
            ctx.transform(1, 0, -0.35, 1, 0, 0); // Natural perspective shear

            ctx.fillStyle = `rgba(0, 0, 0, ${shadowAlpha * 0.75})`;
            ctx.beginPath();
            // Stealth Fighter Silhouette (Top-down)
            ctx.moveTo(-75, 0); // Nose tip
            ctx.lineTo(-40, -10); // Nose widen
            ctx.lineTo(-20, -15); // Wing root front
            ctx.lineTo(-5, -45); // Wing tip front
            ctx.lineTo(15, -45); // Wing tip rear
            ctx.lineTo(15, -15); // Wing root rear
            ctx.lineTo(35, -10); // Tail root front
            ctx.lineTo(45, -25); // Tail tip front
            ctx.lineTo(55, -25); // Tail tip rear
            ctx.lineTo(50, -5); // Tail root rear
            ctx.lineTo(50, 5); // Engine rear
            ctx.lineTo(55, 25); // Near Tail tip rear
            ctx.lineTo(45, 25); // Near Tail tip front
            ctx.lineTo(35, 10); // Near Tail root front
            ctx.lineTo(15, 15); // Near Wing root rear
            ctx.lineTo(15, 45); // Near Wing tip rear
            ctx.lineTo(-5, 45); // Near Wing tip front
            ctx.lineTo(-20, 15); // Near Wing root front
            ctx.lineTo(-40, 10); // Nose widen
            ctx.closePath();
            ctx.fill();

            ctx.restore();
          }

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
          ctx.fillStyle = 'rgba(224, 128, 96, 0.8)'; ctx.fillText('⚠️ العدو يعلم موقعك', W - 20, 55);
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
          general: GENERALS[0], // صقر الحديد - always the attack general
          action: 'strike',
          target: G.enemyPos,
          title: 'ضربة جوية مباشرة',
          advice: `قاعدة العدو مكشوفة في القطاع ${getCellName(G.enemyPos)}. أنصح بضربة مركزة بكل قوتنا النارية!`,
          actionLabel: '💥',
          cost: 3,
          consequence: 'سيكشف العدو موقع مطارنا وسيشن هجمات أقوى بنسبة 30%',
          consequenceType: 'expose_base'
        });

        // Attack option 2: Stealth strike (lower risk but costs more)
        pool.push({
          general: { name: 'الجنرال ظل الليل', rank: 'عمليات خاصة', type: 'stealth', emoji: '🌙', img: 'assets/generals/night_shadow.png' },
          action: 'stealth_strike',
          target: G.enemyPos,
          title: 'ضربة تسللية ليلية',
          advice: `أقترح هجومًا تسلليًا بطائرات خفية. الضربة أضعف لكنها لن تكشف موقعنا للعدو.`,
          actionLabel: '🌙 تنفيذ الضربة التسللية',
          cost: 4,
          consequence: 'ضربة أضعف (قد لا تنجح) لكن لن يكتشف العدو مطارنا',
          consequenceType: 'safe_strike'
        });

        // Attack option 3: Full assault (devastating but very costly)
        pool.push({
          general: { name: 'الجنرال العاصفة', rank: 'سلاح جو', type: 'airforce', emoji: '✈️', img: 'assets/generals/iron_storm.png' },
          action: 'full_assault',
          target: G.enemyPos,
          title: 'هجوم شامل بالسلاح الجوي',
          advice: `أقترح إطلاق كل طائراتنا في هجوم ساحق! سيسبب ضررًا مضاعفًا لكنه مكلف جدًا وسيترك دفاعاتنا مكشوفة.`,
          actionLabel: '🔥 هجوم شامل ساحق',
          cost: 6,
          consequence: 'ضرر مضاعف لكن العدو سيكتشف مطارنا ويهاجم مباشرة هذا الدور',
          consequenceType: 'full_assault'
        });



        // Repair if damaged
        if (G.health < G.maxHealth) {
          pool.push({
            general: GENERALS[2],
            action: 'repair',
            title: 'إصلاح القاعدة المتضررة',
            advice: `قاعدتنا متضررة (${G.health}/${G.maxHealth}). كل دور بدون إصلاح يعني اقترابنا من الهزيمة!`,
            actionLabel: '🔧',
            cost: 2,
            consequence: null,
            consequenceType: null
          });
        }

        // Tactical: diversion
        pool.push({
          general: GENERALS[5], // سيف العدالة
          action: 'diversion',
          title: 'خطة تمويه وإلهاء',
          advice: 'أقترح إرسال طائرات مسيّرة وهمية لإلهاء العدو ثم ضرب قاعدته من الجهة المعاكسة.',
          actionLabel: '🎭',
          cost: 3,
          consequence: 'نجاح الضربة غير مضمون لكن إذا نجحت ستجعل العدو لا يهاجم لدور واحد',
          consequenceType: 'diversion'
        });

        // Resource raid 
        pool.push({
          general: GENERALS[5], // سيف
          action: 'resource_raid',
          title: 'غارة لنهب الموارد',
          advice: 'أقترح تنفيذ غارة سريعة للاستيلاء على إمدادات وموارد جديدة.',
          actionLabel: '🛢️',
          cost: 1,
          consequence: 'خطورة متوسطة ولكن المكافأة كبيرة',
          consequenceType: 'raid_risk'
        });

        if (G.resources <= 1 || G.health <= 2) {
          pool.push({
            general: pickGeneral('versatile'),
            action: 'rest',
            title: 'التقاط الأنفاس وأعمال الصيانة',
            advice: 'إعطاء الجنود قسطاً من الراحة، وإصلاح ما يمكن إصلاحه وفرز الأدوات المدمّرة.',
            actionLabel: '💤 (+1 موارد، +1 صحة)',
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

        if (G.resources <= 1 && !G.currentAdvice.some(a => a.cost <= 0)) {
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
          title: 'استطلاع جوي',
          advice: `أنصح بإرسال طائرة استطلاع للقطاع ${getCellName(scoutCell)} لكشف مواقع العدو`,
          actionLabel: '🔍',
          cost: 1,
          consequence: G.totalScouted > 2 ? 'كثرة الاستطلاع قد تكشف نوايانا للعدو' : null,
          consequenceType: G.totalScouted > 2 ? 'scout_risk' : null
        });

        // Intel gathering
        pool.push({
          general: pickGeneral('intel'),
          action: 'gather_intel',
          title: 'جمع المعلومات',
          advice: 'نحتاج لتكثيف عمليات جمع المعلومات لتضييق نطاق البحث عن العدو',
          actionLabel: '🕵️',
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
          title: 'ضربة عمياء',
          advice: `لدي حدس أن العدو في القطاع ${getCellName(strikeCell)}. أقترح ضربة مباشرة!`,
          actionLabel: '🎯',
          cost: 2,
          consequence: 'إذا أخطأنا نخسر الموارد والعدو سيعلم بوجود تهديد',
          consequenceType: 'blind_miss_risk'
        });

        // Defense
        if (G.health < G.maxHealth) {
          pool.push({
            general: pickGeneral('defense'),
            action: 'repair',
            title: 'إصلاح القاعدة',
            advice: 'قاعدتنا متضررة! يجب إصلاحها فورًا قبل أن يضرب العدو مجددًا',
            actionLabel: '🔧',
            cost: 2,
            consequence: null,
            consequenceType: null
          });
        }

        // Fortify
        pool.push({
          general: GENERALS[2],
          action: 'fortify',
          title: 'تحصين الدفاعات',
          advice: 'نحتاج لتعزيز دفاعاتنا لصد هجمات العدو المحتملة',
          actionLabel: '🏰',
          cost: 2,
          consequence: 'يقلل احتمال الإصابة لدور واحد بنسبة 100%',
          consequenceType: 'fortify'
        });

        // Balanced
        pool.push({
          general: pickGeneral('versatile'),
          action: 'balanced',
          title: 'خطة متوازنة',
          advice: 'أقترح توزيع جهودنا بين الدفاع والاستطلاع لتحقيق التوازن',
          actionLabel: '⚖️',
          cost: 2,
          consequence: null,
          consequenceType: null
        });

        // Resource raid
        pool.push({
          general: pickGeneral('tactical'),
          action: 'resource_raid',
          title: 'غارة على الموارد',
          advice: 'أقترح تنفيذ غارة للاستيلاء على موارد إضافية من المنطقة المحايدة',
          actionLabel: '🛢️',
          cost: 1,
          consequence: 'خطورة متوسطة ولكن المكافأة كبيرة',
          consequenceType: 'raid_risk'
        });

        if (G.resources <= 1 || G.health <= 2) {
          pool.push({
            general: pickGeneral('versatile'),
            action: 'rest',
            title: 'التقاط الأنفاس وأعمال الصيانة',
            advice: 'إعطاء الجنود قسطاً من الراحة، وإصلاح ما يمكن إصلاحه وفرز الأدوات المدمّرة.',
            actionLabel: '💤 (+1 موارد، +1 صحة)',
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

        if (G.resources <= 1 && !G.currentAdvice.some(a => a.cost <= 0)) {
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
      const labels = 'أبتثجحخدذرزسشصضط'.split('');
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
        <div class="dogtag-cost">${adv.cost < 0 ? "+" : "-"}${Math.abs(adv.cost)} 🛢️</div>
      </div>
      <div class="dogtag-right">
        <div class="general-name">
          <span>${adv.general.emoji}</span>
          <span>${adv.general.name}</span>
        </div>
        <span class="general-rank">${adv.general.rank}</span>
        <div class="dogtag-title">${adv.actionLabel} — ${adv.title}</div>
        <div class="general-advice">"${adv.advice}"</div>
        ${adv.consequence ? `<div class="general-consequence">⚠️ ${adv.consequence}</div>` : ''}
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
    <button class="btn btn-gold" id="btn-execute" onclick="executeChoice()" disabled style="font-size:14px;padding:12px 30px;opacity:0.5">تنفيذ الأمر</button>
    <button class="btn" id="btn-skip" onclick="skipTurn()" style="font-size:13px;padding:10px 20px;opacity:0.8;border-color:#4a5565;">⏭️ تخطّي الدور (+1 🛢️)</button>
    
  `;

      initMobileCarousel();
    }

    // ===== MOBILE CAROUSEL =====

    

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
      setWaitState(true, '⏳ جاري تخطي الدور والعدو يخطط...');
      document.getElementById('generals-row').innerHTML = '';
      G.resources += 1;
      G.consecutiveWarTurns = 0;
      addLog('⏭️ تخطّي الدور — القوات تجمع إمدادات بسيطة (+1 🛢️)', 'ally');
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

      const seq = ["⚡ جاري إرسال الأوامر والتحرك التنفيذي..."];

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
        showNotification('موارد غير كافية', `يتطلب ${cost} موارد لتنفيذ هذه الخطة.\nلديك ${G.resources} فقط.`, [
          { text: 'حسناً', action: () => hideNotification() }
        ]);
        return;
      }

      G.animating = true;
      setWaitState(true, '⏳ جاري تنفيذ الخطة...');
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
      playActionAnimation('resource', '⏳ جاري إراحة القوات وإجراء الصيانة...', () => {
        G.resources += 1;
        let healLog = '';
        if (G.health < G.maxHealth) {
          G.health++;
          G.damageWithoutRepair = Math.max(0, G.damageWithoutRepair - 1);
          healLog = ' و +1 صحة للقاعدة';
        }
        let pros = ['تأمين (+1) موارد واستعادة النشاط', 'إراحة الجنود يخفف من خطر انهيار المعنويات' + (healLog ? '، وإصلاح أضرار القاعدة' : '')];
        let cons = ['ترك الفرصة للعدو للمبادرة والحركة بحرية'];
        let story = "خيم الهدوء على المطار لأول مرة منذ بدء العمليات. ارتاح الجنود وتلقت الطائرات صيانة شاملة، بينما وصلت إمدادات جديدة بهدوء استعداداً للجولة القادمة.";
        showResultModal("التقاط الأنفاس ⛺", story, pros, cons, () => {
          addLog(`+1 موارد${healLog} (التقاط الأنفاس وأعمال الصيانة)`, 'ally');
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
                <h4 style="color: #3c3; margin-top: 0; margin-bottom: 3px; font-size: 0.9em;">الإيجابيات</h4>
                <ul style="margin: 0; padding-right: 12px; color: #dfd; font-size: 0.85em;">
                    ${pros.map(p => `<li style="margin-bottom: 3px;">${p}</li>`).join('')}
                </ul>
            </div>
            <div style="flex: 1; background: rgba(200, 50, 50, 0.1); padding: 8px; border-right: 3px solid #f44; border-radius: 4px;">
                <h4 style="color: #f44; margin-top: 0; margin-bottom: 3px; font-size: 0.9em;">السلبيات</h4>
                <ul style="margin: 0; padding-right: 12px; color: #fdd; font-size: 0.85em;">
                    ${cons.map(c => `<li style="margin-bottom: 3px;">${c}</li>`).join('')}
                </ul>
            </div>
        </div>
      `;
      showNotification(title, html, [{ text: 'حسناً، أكمل', gold: true, action: () => { hideNotification(); if (callback) callback(); } }]);
    }

    // ===== ACTION IMPLEMENTATIONS =====
    function executeScout(target, consequenceType) {
      playActionAnimation('scout', '🔍 جاري الاستطلاع...', () => {
        let pros = [];
        let cons = [];
        let story = "";
        let title = "نتائج الاستطلاع 🔍";

        if (consequenceType === 'scout_risk' && Math.random() > 0.6) {
          G.enemyAggressionBoost += 0.1;
          cons.push('العدو رصد طائرات الاستطلاع وأصبح أكثر حذراً');
        } else {
          pros.push('مهمة الاستطلاع تمت بسرية تامة');
        }

        if (target === G.enemyPos) {
          G.map[target] = 2;
          G.isEnemyFound = true;
          G.intel += 3;
          awardTrophy('eagle_eye');
          title = "اكتشاف حاسم! 🎯";
          story = "اخترقت طائرات الاستطلاع الغيوم لتكشف عن مجمع عسكري ضخم للعدو. أرسل الطيار الإحداثيات بلهفة: 'لقد وجدناهم! القاعدة الرئيسية في متناول أيدينا!'";
          pros.push(`تحديد الموقع الدقيق للعدو في القطاع ${getCellName(target)}`);
          pros.push('كسب +3 نقاط معلومات إضافية');
          showResultModal(title, story, pros, cons, () => { checkBanterAndEndTurn('recon', true); });
        } else {
          const adj = isAdjacent(target, G.enemyPos);
          G.map[target] = 1;
          G.intel += 1;
          G.totalScouted++;
          pros.push(`مسح القطاع ${getCellName(target)} وتأكيد خلوه من القواعد الرئيسية`);
          pros.push('كسب +1 نقاط معلومات');

          if (G.intel >= 10) {
            story = "رغم أن القطاع فارغ، إلا أن طائراتنا التقطت آخر إشارة ناقصة ليكتمل لغز موقع العدو تماماً!";
            pros.push('اكتملت المعلومات الاستخباراتية بنسبة 100%!');
          } else if (adj) {
            story = "رغم أن القطاع المستهدف كان يبدو مهجوراً، التقطت أجهزة الرصد ذبذبات لاسلكية مشفرة من مسافة قريبة. العدو ليس ببعيد، نحن نقترب من العرين!";
            pros.push('تم التقاط إشارات مشبوهة، العدو في أحد القطاعات المجاورة!');
          } else {
            story = "عادت طائراتنا بعد مسح شامل للقطاع ولم تجد سوى صمت مطبق وطبيعة قاسية. كل منطقة فارغة تقربنا خطوة نحو الهدف الحقيقي.";
            cons.push('القطاع نظيف ولا توجد آثار قريبة للعدو');
          }
          showResultModal(title, story, pros, cons, () => { checkBanterAndEndTurn('recon', false); });
        }
        checkScoutTrophy();
        updateUI();
      });
    }

    function executeGatherIntel() {
      playActionAnimation('scout', '🕵️ جمع المعلومات...', () => {
        const intelGain = G.upgrades.radar ? 3 : 2;
        G.intel += intelGain;
        let pros = [`جمع +${intelGain} نقاط معلومات هامة${G.upgrades.radar ? ' (+1 بفضل رادار الكشف المبكر)' : ''}`];
        let cons = ["استهلاك للموارد والوقت دون القيام بهجوم مباشر"];
        let story = "عملت شبكة جواسيسنا وراداراتنا على مدار الساعة، لجمع الشذرات المتناثرة من البيانات لتركيب الصورة الكاملة للموقف.";

        if (G.intel >= 10 && !G.isEnemyFound) {
          G.isEnemyFound = true;
          G.map[G.enemyPos] = 2;
          awardTrophy('eagle_eye');
          if (typeof SFX !== 'undefined' && SFX.setBGMState) SFX.setBGMState('discovery');
          story = "أخيراً! تقاطعت خيوط المعلومات واكتملت الصورة في غرفة العمليات. لقد قمنا بتحديد مكان اختباء الجنرال المعادي بشكل قاطع!";
          pros.push(`اكتشاف موقع قاعدة العدو في القطاع ${getCellName(G.enemyPos)}`);
        } else {
          const unknowns = [];
          for (let i = 0; i < 16; i++) if (G.map[i] === 0 && i !== G.enemyPos) unknowns.push(i);
          if (unknowns.length) {
            const reveal = unknowns[Math.floor(Math.random() * unknowns.length)];
            G.map[reveal] = 1;
            pros.push(`تحليل البيانات كشف القطاع ${getCellName(reveal)} وأكد خلوه من العدو`);
          }
        }
        showResultModal("جمع المعلومات 🕵️", story, pros, cons, () => { endPlayerTurn(); });
        updateUI();
      });
    }

    // ===== DIRECT STRIKE (exposes our base) =====
    function executeStrike(adv) {
      G.totalStrikes++;
      playActionAnimation('strike', '💥 جاري تنفيذ الضربة الجوية...', () => {
        let pros = []; let cons = [];
        let newlyDiscovered = false;
        if (adv.consequenceType === 'expose_base') {
          if (!G.enemyKnowsUs) newlyDiscovered = true;
          G.enemyKnowsUs = true;
          G.enemyAggressionBoost += 0.3;
          if (newlyDiscovered) {
            cons.push('العدو تتبع مسار الطائرات العائدة واكتشف موقع مطارنا السري!');
          } else {
            cons.push('العدو بات أكثر استعداداً وشراسة للانتقام المباشر');
          }
        }

        const dmg = G.upgrades.ammo ? 2 : 1;
        G.enemyHp -= dmg;
        G.map[adv.target] = 3;
        pros.push(`إصابة مباشرة وناجحة لقاعدة العدو (-${dmg} صحة)`);

        if (G.totalStrikes === 1) awardTrophy('first_strike');
        if (G.enemyHp <= 0) { victory(); return; }

        let story = "انقضّت طائراتنا كالصقور الجارحة من بين السحب، ودكت دفاعات العدو بقوة لا ترحم. الدخان المتصاعد من قاعدتهم يروي قصة تفوقنا، لكن في الحرب، كل ضربة لها ثمن.";
        if (newlyDiscovered) {
          showDiscoveryModal('player_strike', () => {
            showResultModal('نجاح المهمة الهجومية! 💥', story, pros, cons, () => { endPlayerTurn(); });
            updateUI();
          });
        } else {
          showResultModal('نجاح المهمة الهجومية! 💥', story, pros, cons, () => { endPlayerTurn(); });
          updateUI();
        }
      });
    }

    // ===== STEALTH STRIKE (safe but weaker) =====
    function executeStealthStrike(adv) {
      G.totalStrikes++;
      playActionAnimation('strike', '🌙 جاري تنفيذ الضربة التسللية...', () => {
        const successChance = G.upgrades.stealth ? 1.0 : 0.55;
        let pros = []; let cons = []; let story = ""; let title = "";

        if (Math.random() < successChance) {
          const dmg = G.upgrades.ammo ? 2 : 1;
          G.enemyHp -= dmg;
          G.map[adv.target] = 3;
          pros.push(`نجاح التسلل! إصابة قاعدة العدو (-${dmg} صحة)`);
          if (!G.enemyKnowsUs) {
            pros.push('موقع مطارنا لا يزال قيد الكتمان التام');
          }
          story = "تحت جنح الظلام وتخفي الرادارات، تسللت طائرات الشبح لضرب الهدف بدقة جراحية ثم الانسحاب كالسراب، تاركة العدو في حيرة من أمره حول مصدر الضربة.";
          title = "ضربة تسللية ناجحة! 🌙";
          if (G.totalStrikes === 1) awardTrophy('first_strike');
          if (G.enemyHp <= 0) { victory(); return; }
        } else {
          cons.push('العدو اكتشف طائراتنا وتصدى لها قبل تحقيق إصابة مباشرة');
          if (!G.enemyKnowsUs) {
            pros.push('رغم الفشل، لم يتمكن العدو من تحديد موقع مطارنا');
          }
          story = "لسوء الحظ، التقطت مستشعرات العدو المتقدمة ذبذبات المحركات في اللحظة الأخيرة، مما أجبر طائراتنا على الانسحاب لتجنب فخ محقق دون إتمام المهمة.";
          title = "الضربة فشلت 😔";
        }
        showResultModal(title, story, pros, cons, () => { endPlayerTurn(); });
        updateUI();
      });
    }

    // ===== FULL ASSAULT (devastating but very risky) =====
    function executeFullAssault(adv) {
      G.totalStrikes++;
      playActionAnimation('strike', '🔥 هجوم شامل بكل القوة الجوية...', () => {
        let pros = []; let cons = [];
        const dmg = G.upgrades.ammo ? 3 : 2;
        G.enemyHp -= dmg;
        G.map[adv.target] = 3;
        pros.push(`هجوم كاسح دمر دفاعات العدو بضرر مضاعف (-${dmg} صحة)`);

        const newlyDiscovered = !G.enemyKnowsUs;
        G.enemyKnowsUs = true;
        G.enemyAggressionBoost += 0.4;

        if (newlyDiscovered) cons.push('العدو كشف مطارنا بشكل قطعي بسبب حجم الهجوم!');
        cons.push('ارتفاع كبير جداً في مستوى عدوانية العدو');

        if (G.totalStrikes === 1) awardTrophy('first_strike');
        if (G.enemyHp <= 0) { victory(); return; }

        let story = "السماء أظلمت بأسراب طائراتنا في هجوم شامل لا يبقي ولا يذر. سُحقت مباني العدو تحت وابل القنابل، إلا أن دوي الانفجارات كشف مكاننا وجعلنا هدفاً صريحاً للانتقام!";

        const counterHit = Math.random() < 0.7;
        if (counterHit) {
          triggerRedAlarm();
          G.health--;
          G.damageWithoutRepair++;
          cons.push('تعرضنا لهجوم مضاد فوري وموجع (-1 صحة للقاعدة)');
          story += " ولم نكد نحتفل حتى انهالت علينا صواريخ العدو الانتقامية في هجوم مضاد سريع ألحق بنا أضراراً بالغة!";
          if (G.health <= 0) {
            defeat();
            return;
          }
          if (G.health === 1) awardTrophy('survivor');
        } else {
          pros.push('لحسن الحظ لم يتمكن العدو من الرد فوراً رغم شراسة الهجوم');
        }

        if (newlyDiscovered) {
          showDiscoveryModal('player_strike', () => {
            showResultModal('هجوم شامل! 🔥', story, pros, cons, () => { endPlayerTurn(); });
            updateUI();
          });
        } else {
          showResultModal('هجوم شامل! 🔥', story, pros, cons, () => { endPlayerTurn(); });
          updateUI();
        }
      });
    }

    // ===== DIVERSION (confusion tactic) =====
    function executeDiversion(adv) {
      G.totalStrikes++;
      playActionAnimation('strike', '🎭 تنفيذ خطة التمويه والإلهاء...', () => {
        let pros = []; let cons = []; let story = ""; let title = "";
        const success = Math.random() < 0.6;

        if (success) {
          const dmg = G.upgrades.ammo ? 2 : 1;
          G.enemyHp -= dmg;
          G.map[G.enemyPos] = 3;
          G.enemyAggressionBoost = Math.max(0, G.enemyAggressionBoost - 0.2);
          G.enemySkipNextTurn = true;

          pros.push(`ضربة التفافية ناجحة من الخلف (-${dmg} صحة)`);
          pros.push('العدو في حالة ارتباك مما قلل من عدوانيته وتماسكه');
          pros.push('ارتباك العدو سيمنعه من الهجوم في الدور القادم');
          story = "ابتلعت قوات العدو الطعم، متجهة بكل قوتها نحو طائراتنا الوهمية. في هذه الأثناء، انقضت قواتنا الحقيقية من الخلف كشبح قاتل، محققة إصابة مدمرة دون مقاومة تذكر.";
          title = "خطة التمويه نجحت! 🎭";
          if (G.totalStrikes === 1) awardTrophy('first_strike');
          if (G.enemyHp <= 0) { victory(); return; }
        } else {
          G.enemyAggressionBoost += 0.1;
          cons.push('فشل التمويه، ولم نحقق أي إصابة');
          cons.push('ازداد وعي العدو وتكتيكاته الدفاعية أصبحت أصلب');
          story = "كان جنرال العدو أذكى من أن تنطلي عليه حيلة بسيطة. استطاع تمييز الهجوم الوهمي واحتفظ بقواته لحماية القاعدة، مما أفشل خطتنا بالكامل.";
          title = "فشل التمويه 😔";
        }

        showResultModal(title, story, pros, cons, () => { checkBanterAndEndTurn('diversion', success); });
        updateUI();
      });
    }

    function executeBlindStrike(target) {
      G.totalStrikes++;
      playActionAnimation('strike', '🎯 جاري تنفيذ الضربة الاستكشافية...', () => {
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

          pros.push(`ضربة عمياء استقرت بقلب قاعدة العدو مصادفة! (-${dmg} صحة)`);
          if (newlyDiscovered) cons.push('العدو استطاع تحديد موقعنا من خلال تتبع مسار الصواريخ المهاجمة!');
          story = "في مقامرة جريئة، أرسلنا قاذفاتنا لضرب الإحداثيات المشتبه بها. وكانت المفاجأة! النيران المتصاعدة أكدت أننا أصبنا الهدف في مقتل بضربة استباقية عمياء لا مثيل لها.";
          title = "مقامرة رابحة! 💥";
          awardTrophy('eagle_eye');
          if (G.totalStrikes === 1) awardTrophy('first_strike');
          if (G.enemyHp <= 0) { victory(); return; }
        } else {
          G.map[target] = -1;
          cons.push('الضربة استهدفت قطاعاً فارغاً وأهدرنا فرصة ذهبية');
          story = "سقطت القنابل على قطاع مقفر مسببة دماراً للطبيعة وتاركة جيشنا في إحباط بسبب ضياع الفرصة الثمينة.";
          title = "ضربة فاشلة!";
          if (Math.random() > 0.5) {
            G.enemyAggressionBoost += 0.05;
            cons.push('نشاطنا العسكري لفت انتباه العدو ورفع من جاهزيته');
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
      playActionAnimation('resource', '🔧 جاري إصلاح القاعدة...', () => {
        G.health = Math.min(G.maxHealth, G.health + 1);
        G.damageWithoutRepair = Math.max(0, G.damageWithoutRepair - 1);
        let pros = ['تم استعادة (+1) صحة للمطار والدفاعات'];
        let cons = ['استهلاك الدور في أعمال الصيانة بدلاً من التقدم العسكري'];
        let story = "عمل مهندسونا تحت الضغط لإصلاح المدرج وتدعيم الحصون المتضررة. صوت آلات اللحام والبناء أعاد الروح المعنوية للجنود، ليكون المطار جاهزاً لأي طارئ.";
        showResultModal("عملية إصلاح 🔧", story, pros, cons, () => { endPlayerTurn(); });
        updateUI();
      });
    }

    function executeFortify() {
      G._fortified = true;
      playActionAnimation('resource', '🏰 تحصين الدفاعات...', () => {
        let pros = ['تقليل ضرر أي هجوم قادم بنسبة هائلة لهذا الدور'];
        let cons = ['تكريس الوقت والجهد للتخندق عوضاً عن المبادرة بالهجوم'];
        let story = "دوت صفارات الإنذار لتعلن حالة الاستنفار القصوى. تم تفعيل مضادات الطائرات ونُشرت الدبابات حول المحيط. قاعدتنا الآن بمثابة حصن منيع يصعب اختراقه.";
        showResultModal("تحصين الدفاعات 🏰", story, pros, cons, () => { endPlayerTurn(); });
        updateUI();
      });
    }

    function executeBalanced() {
      playActionAnimation('balanced', '⚖️ تنفيذ الخطة المتوازنة...', () => {
        G.intel += 1;
        G.resources += 1;
        let pros = ['كسب (+1) نقاط معلومات', 'تأمين (+1) موارد إضافية'];
        let cons = ['مكاسب بسيطة مقارنة بالعمليات المخصصة لجانب واحد'];
        let story = "قررت القيادة اتباع نهج حذر ومتوازن، حيث تم إرسال فرق كشافة صغيرة مع تأمين خطوط الإمداد المتاحة. خطوة هادئة لترتيب الأوراق استعداداً للقرارات الكبيرة.";

        if (G.intel >= 10 && !G.isEnemyFound) {
          G.isEnemyFound = true;
          G.map[G.enemyPos] = 2;
          awardTrophy('eagle_eye');
          story += "\n\nالعملية المتوازنة وفرت الجزء الناقص من اللغز. تم رصد تحركات العدو وكشف مقره السري!";
          pros.push(`اكتشاف موقع قاعدة العدو في القطاع ${getCellName(G.enemyPos)}`);
        } else {
          const unknowns = [];
          for (let i = 0; i < 16; i++) if (G.map[i] === 0 && i !== G.enemyPos) unknowns.push(i);
          if (unknowns.length) {
            const reveal = unknowns[Math.floor(Math.random() * unknowns.length)];
            G.map[reveal] = 1;
            pros.push(`معلومات الكشافة أكدت خلو القطاع ${getCellName(reveal)} من الأعداء`);
          }
        }
        showResultModal("خطة متوازنة ⚖️", story, pros, cons, () => { endPlayerTurn(); });
        updateUI();
      });
    }

    function executeResourceRaid(consequenceType) {
      playActionAnimation('raid', '🛢️ تنفيذ الغارة...', () => {
        let pros = []; let cons = []; let story = ""; let title = "";
        let isSuccess = false;
        if (Math.random() < 0.85) {
          isSuccess = true;
          const gain = 3 + Math.floor(Math.random() * 3);
          G.resources += gain;
          pros.push(`غناءم ممتازة! الحصول على (+${gain}) موارد`);
          story = "انقضّت قواتنا الخاصة على قوافل إمداد العدو بسرعة مذهلة. تمكنا من السيطرة على الشاحنات المليئة بالذخيرة والوقود والعودة للقاعدة دون خسائر تذكر.";
          title = "غارة ناجحة! 🛢️";
          if (G.resources >= 15) awardTrophy('resourceful');

          if (consequenceType === 'weaken_enemy') {
            G.enemyAggressionBoost = Math.max(0, G.enemyAggressionBoost - 0.15);
            pros.push('نقص الإمدادات أضعف العدو وخفف من حدة هجماته');
            story += " هذا النقص في الإمدادات سيجعل العدو يعاني لتجهيز هجماته القادمة.";
          }
        } else {
          cons.push('عادت القوات بخفي حنين، لم يتم جني أي موارد');
          story = "القافلة التي استهدفناها كانت فارغة! مجرد فخ أو معلومات خاطئة. انسحبت قواتنا بصعوبة قبل أن تنقلب الأمور ضدهم.";
          title = "غارة فاشلة";
          if (consequenceType === 'raid_risk') {
            G.enemyAggressionBoost += 0.05;
            cons.push('العدو استنفر قواته لصد الغارة وأصبح أكثر تأهباً');
          }
        }
        showResultModal(title, story, pros, cons, () => { checkBanterAndEndTurn('raid', isSuccess); });
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

        if (!G.visualTurn) G.visualTurn = G.turn;
        G.visualTurn += (G.turn - G.visualTurn) * 0.05;

        let isDay = G.turn % 2 !== 0;
        let isSunset = G.turn % 4 === 3;
        let isRainy = (G.turn * 7) % 10 < 3;
        const W = 800, H = 400;

        function drawSky(width, height) {
          const skyData = getSkyColors(G.visualTurn - 1);
          const grd = ctx.createLinearGradient(0, 0, 0, height);
          grd.addColorStop(0, skyData.top);
          grd.addColorStop(1, skyData.bottom);
          ctx.fillStyle = grd; ctx.fillRect(0, 0, width, height);

          ctx.fillStyle = skyData.sunColor;
          ctx.beginPath();
          ctx.arc(width * 0.7, height * skyData.sunY, 40, 0, Math.PI * 2);
          if (skyData.isMoon) {
            ctx.fill();
            ctx.fillStyle = grd;
            ctx.beginPath(); ctx.arc(width * 0.7 - 10, height * skyData.sunY - 5, 35, 0, Math.PI * 2); ctx.fill();
          } else {
            ctx.shadowColor = skyData.sunColor;
            ctx.shadowBlur = 30;
            ctx.fill();
            ctx.shadowBlur = 0;
          }

          // Stars
          for (let i = 0; i < 40; i++) {
            const sx = (i * 97 + frame * 0.1) % width;
            const sy = (i * 53) % height;
            const starAlpha = Math.max(0, Math.sin(frame * 0.05 + i)) * (skyData.isMoon ? 1 : 0);
            if (starAlpha > 0) {
              ctx.fillStyle = `rgba(200, 220, 255, ${starAlpha})`;
              ctx.beginPath(); ctx.arc(sx, sy, 1.5, 0, Math.PI * 2); ctx.fill();
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
            ctx.strokeStyle = 'rgba(150, 180, 200, 0.4)'; ctx.lineWidth = 1.5; ctx.beginPath();
            for (let i = 0; i < 150; i++) {
              let rx = (i * 37 + frame * 12) % W; let ry = (i * 73 + frame * 24) % H;
              ctx.moveTo(rx, ry); ctx.lineTo(rx - 8, ry + 20);
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
          ctx.beginPath(); ctx.arc(400, 300, 80, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = '#0f0'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(400, 300, 80, 0, Math.PI * 2); ctx.stroke();
          ctx.beginPath(); ctx.arc(400, 300, 40, 0, Math.PI * 2); ctx.stroke();
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
          ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 80, -Math.PI / 2, -Math.PI / 6); ctx.fill();
          ctx.restore();

          // Blips on Radar
          if (frame % 60 > 10) {
            ctx.fillStyle = '#0f0';
            ctx.beginPath(); ctx.arc(430, 270, 4, 0, Math.PI * 2); ctx.fill();
            if (frame % 60 > 30) {
              ctx.beginPath(); ctx.arc(360, 330, 3, 0, Math.PI * 2); ctx.fill();
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
          ctx.fillRect(125, 285 + (frame % 20) * 1.5, 40, 2);
          ctx.fillRect(125, 295 + ((frame + 10) % 20) * 1.5, 30, 2);

          ctx.fillStyle = '#f0f';
          ctx.fillRect(605, 310 - (frame % 15) * 2, 35, 2);
          ctx.fillRect(605, 315 - ((frame + 5) % 15) * 2, 20, 2);

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

          drawHighResSoldier(ctx, 350, yPos, soldierScale, 'guard');
          drawHighResSoldier(ctx, 500, idleY + 5, soldierScale, 'idle');
          drawHighResSoldier(ctx, 650, yPos - 10, soldierScale, 'guard');
          drawHighResSoldier(ctx, 50, idleY + 10, soldierScale, 'idle');

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
            ctx.beginPath(); ctx.arc(cx + 10, 300, 10, 0, Math.PI * 2); ctx.arc(cx + 50, 300, 10, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(cx - 70, 300, 10, 0, Math.PI * 2); ctx.arc(cx - 40, 300, 10, 0, Math.PI * 2); ctx.fill();
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
            ctx.beginPath(); ctx.ellipse(650, 230, 30, 10, Math.PI / 4, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.moveTo(650, 230); ctx.lineTo(630, 210); ctx.strokeStyle = '#111'; ctx.lineWidth = 2; ctx.stroke();
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
            for (let t = 0; t < 5; t++) {
              ctx.fillStyle = `rgba(255, ${150 - t * 30}, 0, ${1 - t * 0.2})`;
              ctx.beginPath(); ctx.arc(bombX - t * 3, bombY - t * 6, 3, 0, Math.PI * 2); ctx.fill();
            }
            ctx.restore();

            ctx.fillStyle = '#222';
            ctx.beginPath(); ctx.ellipse(bombX, bombY, 12, 6, Math.PI / 3, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#555';
            ctx.beginPath(); ctx.ellipse(bombX + 4, bombY - 2, 3, 2, Math.PI / 3, 0, Math.PI * 2); ctx.fill();
          }

          if (frame >= 90) {
            const ef = frame - 90;
            const ex = type === 'raid' ? 800 - 90 * 1.5 + 30 : 610;
            const ey = 280;

            ctx.save();
            ctx.globalCompositeOperation = 'lighter';

            // Initial Flash
            if (ef < 10) {
              ctx.fillStyle = `rgba(255, 255, 255, ${1 - ef / 10})`;
              ctx.beginPath(); ctx.arc(ex, ey, 100 + ef * 10, 0, Math.PI * 2); ctx.fill();
            }

            // Fire Core and Sparks
            if (ef < 50) {
              const coreRadius = 40 + ef * 2.5;
              const coreAlpha = 1 - ef / 50;
              const grad = ctx.createRadialGradient(ex, ey, 0, ex, ey, coreRadius);
              grad.addColorStop(0, `rgba(255, 255, 100, ${coreAlpha})`);
              grad.addColorStop(0.2, `rgba(255, 150, 0, ${coreAlpha * 0.8})`);
              grad.addColorStop(1, 'rgba(255, 0, 0, 0)');
              ctx.fillStyle = grad;
              ctx.beginPath(); ctx.arc(ex, ey, coreRadius, 0, Math.PI * 2); ctx.fill();

              for (let i = 0; i < 30; i++) {
                const seed = (i * 137) % 100 / 100;
                const angle = seed * Math.PI + Math.PI; // top half hemisphere
                const speed = 2 + seed * 8;
                const sx = ex + Math.cos(angle) * speed * ef;
                const sy = ey + Math.sin(angle) * speed * ef + (ef * ef * 0.05); // pseudo-gravity
                const sparkAlpha = Math.max(0, coreAlpha - seed * 0.2);
                ctx.fillStyle = `rgba(255, 200, 50, ${sparkAlpha})`;
                ctx.beginPath(); ctx.arc(sx, sy, 2 + seed * 3, 0, Math.PI * 2); ctx.fill();
              }
            }

            ctx.globalCompositeOperation = 'source-over';

            // Expanding Smoke Cloud
            if (ef < 90) {
              const smokeRadius = 40 + ef * 3;
              const smokeAlpha = Math.max(0, (1 - Math.pow(ef / 90, 2)) * 0.9);
              const sgrad = ctx.createRadialGradient(ex, ey - ef * 0.6, 0, ex, ey - ef * 0.6, smokeRadius);
              sgrad.addColorStop(0, `rgba(40, 40, 40, ${smokeAlpha})`);
              sgrad.addColorStop(1, 'rgba(30, 30, 30, 0)');
              ctx.fillStyle = sgrad;
              ctx.beginPath(); ctx.arc(ex, ey - ef * 0.6, smokeRadius, 0, Math.PI * 2); ctx.fill();

              // Secondary smoke puffs
              for (let i = 0; i < 7; i++) {
                const seed = (i * 73) % 100 / 100;
                const px = ex + (seed - 0.5) * smokeRadius * 1.5;
                const py = ey - ef * (0.4 + seed * 0.5) - (seed * 25);
                const pradius = smokeRadius * (0.4 + seed * 0.6);
                const pgrad = ctx.createRadialGradient(px, py, 0, px, py, pradius);
                pgrad.addColorStop(0, `rgba(50, 50, 50, ${smokeAlpha})`);
                pgrad.addColorStop(1, 'rgba(50, 50, 50, 0)');
                ctx.fillStyle = pgrad;
                ctx.beginPath(); ctx.arc(px, py, pradius, 0, Math.PI * 2); ctx.fill();
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
      return `
        <div style="display: flex; flex-direction: column; gap: 10px; padding-top: 5px; direction: rtl;">
          <div style="display: flex; align-items: flex-start; gap: 10px; background: rgba(255,255,255,0.05); padding: 10px; border-radius: 10px; border-right: 3px solid ${color1}; text-align: right;">
             <img src="${img1}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px; border: 2px solid ${color1}; flex-shrink: 0; box-shadow: 0 4px 8px rgba(0,0,0,0.5);">
             <div>
               <b style="color:${color1}; font-size: 1.05em; display: block; margin-bottom: 3px;">${name1}</b>
               <span style="font-size: 0.9em; line-height: 1.4; color: #ddd;">"${msg1}"</span>
             </div>
          </div>
          <div style="display: flex; align-items: flex-start; flex-direction: row-reverse; gap: 10px; background: rgba(255,255,255,0.05); padding: 10px; border-radius: 10px; border-left: 3px solid ${color2}; text-align: left;">
             <img src="${img2}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px; border: 2px solid ${color2}; flex-shrink: 0; box-shadow: 0 4px 8px rgba(0,0,0,0.5);">
             <div style="width: 100%;">
               <b style="color:${color2}; font-size: 1.05em; display: block; margin-bottom: 3px;">${name2}</b>
               <span style="font-size: 0.9em; line-height: 1.4; color: #ddd; display: block;" dir="rtl">"${msg2}"</span>
             </div>
          </div>
        </div>
      `;
    }

    function checkBanterAndEndTurn(actionType, success) {
      if (!success) {
        if (actionType === 'strike') {
          const banterText = buildBanterHTML(GENERALS[2].img, 'جنرال التحصينات', '#d9534f', 'ألم أقل لك لا تستمع لجنرال الهجوم، كان الأجدر صرف الموارد على التطوير والأبحاث وليس إلى الإندفاع خلف حدسٍ وشكوكٍ لا تستند إلى دليل.', GENERALS[0].img, 'جنرال الهجوم', '#f0ad4e', 'الدفاع لن ينهي هذه الحرب يا سيدي، أعطني الإذن وسأحيل مطارهم إلى رماد!');
          setTimeout(() => {
            showNotification('مناوشات القيادة 🗣️', banterText, [{ text: 'متابعة', gold: true, action: () => { hideNotification(); endPlayerTurn(); } }], true);
          }, 100);
          return;
        }
        if (actionType === 'recon') {
          const banterText = buildBanterHTML(GENERALS[0].img, 'جنرال الهجوم', '#f0ad4e', 'لقد أضعنا مواردنا على التقاط صور للرمال! لو أعطيتني هذه الموارد لدمرتهم.', GENERALS[3].img, 'جنرال الاستطلاع', '#5bc0de', 'القتال الأعمى انتحار. دعني أكشف لك ما يختبئ في الظلام أولاً.');
          setTimeout(() => {
            showNotification('مناوشات القيادة 🗣️', banterText, [{ text: 'متابعة', gold: true, action: () => { hideNotification(); endPlayerTurn(); } }], true);
          }, 100);
          return;
        }
        if (actionType === 'raid') {
          const banterText = buildBanterHTML(GENERALS[2].img, 'جنرال التحصينات', '#d9534f', 'هل اقتنعت الآن يا سيف؟ القوات الخاصة لا تنفع إذا لم تجد ما تسرقه! كان الأجدر ترك الموارد لتعزيز دفاعاتنا.', GENERALS[5].img, 'الجنرال سيف', '#5bc0de', 'التكتيكات الجريئة تحمل المخاطر. الجلوس خلف الجدران لن يحسم المعركة، بل يؤجل الهزيمة فقط.');
          setTimeout(() => {
            showNotification('مناوشات القيادة 🗣️', banterText, [{ text: 'متابعة', gold: true, action: () => { hideNotification(); endPlayerTurn(); } }], true);
          }, 100);
          return;
        }
        if (actionType === 'diversion') {
          const banterText = buildBanterHTML(GENERALS[0].img, 'الجنرال صقر', '#f0ad4e', 'أي سذاجة هذه؟! نضيع الوقت والموارد في ألاعيب التمويه الفاشلة بناءً على خطط الجنرال نسر الجبانة! كان الأجدر بنا توجيه ضربة قاصمة ومباشرة لقلب العدو بدلاً من هذا العبث الصبياني!', GENERALS[3].img, 'الجنرال نسر', '#5bc0de', 'اختر ألفاظك بعناية يا صقر! استطلاعي وفر فرصة ذهبية، لكن تعطشك الأعمى للهجوم المباشر يجعلك عاجزاً عن فهم التكتيكات المعقدة.');
          setTimeout(() => {
            showNotification('احتدام النقاش 💬', banterText, [{ text: 'تجاوز', gold: true, action: () => { hideNotification(); endPlayerTurn(); } }], true);
          }, 100);
          return;
        }
      }
      endPlayerTurn();
    }

    function endPlayerTurn() {
      setWaitState(true, '⏳ العدو يخطط ويتحرك...');
      // Engineering unit realistic repair
      if (G.repairTimer > 0) {
        G.repairTimer--;
        if (G.repairTimer === 0) {
          G.health = Math.min(G.maxHealth, G.health + 1);
          G.damageWithoutRepair = Math.max(0, G.damageWithoutRepair - 1);
          addLog('🔧 الوحدة الهندسية أتمت إصلاح جزء من القاعدة (+1 صحة)', 'ally');
        }
      } else if (G.upgrades.eng && G.health < G.maxHealth) {
        G.repairTimer = 1;
        addLog('🏗️ الوحدة الهندسية بدأت بأعمال الإصلاح (يستغرق 1 دور)', 'ally');
      }

      // Check rest trophy
      if (G.warTurnsStreak >= 3 && !['strike', 'blind_strike', 'stealth_strike', 'full_assault', 'diversion'].includes(G.currentAdvice[G.selectedGeneral]?.action)) {
        G.tookRest = true;
        awardTrophy('warrior_rest');
        G.warTurnsStreak = 0;
      }

      G.resources += 1;
      G.visualTurn = G.turn;
      addLog('+1 موارد (إنتاج المطار)', '');

      setTimeout(() => enemyTurn(), 800);
    }

    function enemyTurn() {
      addLog('— دور العدو —', 'danger');

      if (G.enemySkipNextTurn) {
        G.enemySkipNextTurn = false;
        addLog('🎭 العدو في حالة ارتباك من التمويه ولن يهاجم هذا الدور!', '');
        updateUI();
        G.turn++;
        setTimeout(() => {
          G.selectedGeneral = -1;
          updateUI();
          startTurn();
        }, 800);
        return;
      }

      // Base attack chance + aggression boost from consequences
      let attackChance = 0.35 + G.turn * 0.02 + G.enemyAggressionBoost;

      // If enemy knows our location, MUCH higher attack chance
      if (G.enemyKnowsUs) {
        attackChance = 0.95; // Relentless attack!
        addLog('⚠️ العدو يستهدف مطارك بدقة!', 'danger');
      }

      attackChance = Math.min(attackChance, 0.95);

      const fortified = G._fortified || false;
      G._fortified = false;

      let newlyDiscoveredByEnemy = false;

      if (Math.random() < attackChance) {
        if (fortified) {
          addLog('🏰 التحصينات صدت هجوم العدو بنسبة 100%!', 'important');
          if (!G.enemyKnowsUs) {
            G.enemyKnowsUs = true;
            newlyDiscoveredByEnemy = true;
            triggerRedAlarm();
            addLog('🚨 العدو رصد موقع انطلاق دفاعاتنا! تم كشف القاعدة!', 'danger');
          }
        } else if (G.upgrades.aa && (G.aaCooldown || 0) <= 0) {
          G.animating = true;
          playAirportAnimation(() => {
            G.animating = false;
            G.resources++;
            G.intel += 2;
            addLog('🛢️ منظومة الدفاع الجوي أسقطت هجوم العدو بنسبة 100%! (+1 موارد، +2 معلومات)', 'ally');
            G.aaCooldown = 2;
            G.aaDebrisTurns = 1;

            if (!G.enemyKnowsUs) {
              G.enemyKnowsUs = true;
              newlyDiscoveredByEnemy = true;
              triggerRedAlarm();
              addLog('🚨 العدو رصد مسار صواريخنا الدفاعية! تم كشف القاعدة!', 'danger');
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
            let healthBefore = G.health;
            let maxHealthBefore = G.maxHealth;
            G.health--;
            G.damageWithoutRepair++;

            let lostResource = false;
            if (G.resources > 0) {
              G.resources--;
              lostResource = true;
              addLog('🔥 تضرر مستودع الإمدادات (-1 موارد)', 'danger');
            }

            const boughtUpgrades = Object.keys(G.upgrades).filter(k => G.upgrades[k]);
            let hitUpgrade = false;
            let destroyedUpgradeName = "";
            let destroyedUpgradeKey = "";
            if (boughtUpgrades.length > 0 && Math.random() < 0.5) {
              const toDestroy = boughtUpgrades[Math.floor(Math.random() * boughtUpgrades.length)];
              G.upgrades[toDestroy] = false;
              const names = { radar: 'رادار الكشف المبكر', walls: 'الجدران المحصنة', aa: 'منظومة الدفاع الجوي', stealth: 'السرب الشبحي', eng: 'الوحدة الهندسية', ammo: 'الذخائر الخارقة' };
              destroyedUpgradeName = names[toDestroy];
              destroyedUpgradeKey = toDestroy;
              addLog(`⚠️ تلقينا ضربة قوية تسببت بتحطم [${destroyedUpgradeName}]! (-1 صحة القاعدة)`, 'danger');
              hitUpgrade = true;
              if (toDestroy === 'walls') {
                G.maxHealth--;
                if (G.health > G.maxHealth) G.health = G.maxHealth;
              }
            }

            if (G.enemyKnowsUs && !newlyDiscoveredByEnemy) {
              if (!hitUpgrade) addLog('💥 ضربة دقيقة أصابت المطار مباشرة وتسببت بأضرار بليغة! (-1 صحة القاعدة)', 'danger');
              triggerRedAlarm();
            } else {
              if (!hitUpgrade) addLog('💥 قذيفة عشوائية للعدو سقطت وألحقت أضراراً مباشرة بالمطار! (-1 صحة القاعدة)', 'danger');
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
                "الجميع إلى الملاجئ! لقد ألحق القصف أضراراً جسيمة بمحيط القاعدة، النيران تلتهم المرافق الحيوية!",
                "لقد تم استهدافنا! دوي الانفجارات يهز الأرجاء وفرق الإنقاذ تكافح للسيطرة على الحرائق الهائلة!",
                "غارة جوية مفاجئة! الدخان يغطي السماء ورائحة الدمار تفوح في كل شبر من المطار!"
              ];
              const dramaMsg = attackMessages[Math.floor(Math.random() * attackMessages.length)];

              const upgradeDramaPhrases = {
                radar: "لقد تم إعماء أعيننا في السماء! شاشات الرادار تحولت إلى رماد ولم نعد قادرين على رصد تحركاتهم المبكرة.",
                walls: "الجدران التي كانت درعنا الحصين تهاوت كأحجار الدومينو! القاعدة الآن مكشوفة لهجماتهم القادمة.",
                aa: "صواريخنا الدفاعية احترقت في منصاتها! نحن الآن بلا غطاء جوي يصد غاراتهم الغادرة.",
                stealth: "طائراتنا الشبحية الفخرية تحولت إلى خردة مشتعلة في حظائرها! ميزتنا التكتيكية الكبرى تبخرت في الهواء.",
                eng: "معدات المهندسين تحطمت بالكامل، وباتوا عاجزين عن إجراء الإصلاحات السريعة! النزيف سيستمر دون علاج.",
                ammo: "مخازن الذخيرة الخاصة انفجرت في عرض مرعب! قوتنا الضاربة تراجعت بشكل كارثي."
              };

              let damageWithoutRepairBefore = Math.max(0, G.damageWithoutRepair - 1);
              let healthBeforeHtml = '';
              for (let i = 0; i < maxHealthBefore; i++) {
                if (i >= healthBefore) healthBeforeHtml += '⬛';
                else if (i === healthBefore - 1 && damageWithoutRepairBefore > 0) healthBeforeHtml += '🟥';
                else healthBeforeHtml += '🟩';
              }
              let healthAfterHtml = '';
              for (let i = 0; i < G.maxHealth; i++) {
                if (i >= G.health) healthAfterHtml += '⬛';
                else if (i === G.health - 1 && G.damageWithoutRepair > 0) healthAfterHtml += '🟥';
                else healthAfterHtml += '🟩';
              }

              let htmlReport = `
                <div style="text-align: center; line-height: 1.4; font-family: 'Thmanyah', sans-serif;" dir="rtl">
                  <div style="font-size: 0.9em; margin-bottom: 10px; color: #eee; font-style: italic;">"${dramaMsg}"</div>
                  <div style="background: rgba(255, 0, 0, 0.1); border: 1px dashed #ff4444; padding: 10px; border-radius: 5px; display: flex; flex-direction: column; gap: 8px;">
                    
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 5px 0;">
                      <span style="color: #ffaaaa; font-size: 1em; font-weight: bold;">صحة القاعدة</span>
                      <span style="font-size: 1em; letter-spacing: 1px; background: rgba(0,0,0,0.3); padding: 4px 8px; border-radius: 4px; display: flex; flex-direction: row; align-items: center; justify-content: center;">
                        <span>${healthBeforeHtml}</span>
                        <span style="font-size:1em; margin:0 8px;">⬅️</span>
                        <span>${healthAfterHtml}</span>
                      </span>
                    </div>
              `;

              if (lostResource) {
                htmlReport += `
                    <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,68,68,0.3); padding-top: 8px;">
                      <span style="color: #ffdddd; font-size: 1em; font-weight: bold;">مستودع الإمدادات</span>
                      <span style="font-size: 1.1em; direction: ltr; background: rgba(0,0,0,0.3); padding: 4px 8px; border-radius: 4px;">-1 🛢️</span>
                    </div>
                `;
              }
              if (hitUpgrade) {
                const iconMap = { radar: '📡', walls: '🛡️', aa: '🚀', stealth: '🛩️', eng: '🏗️', ammo: '🛢️' };
                const upgradeIcon = iconMap[destroyedUpgradeKey] || '🏢';
                htmlReport += `
                    <div style="border-top: 1px solid rgba(255,68,68,0.3); padding-top: 8px;">
                      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                        <span style="color: #ffdddd; font-size: 1em; font-weight: bold;">وحدة محطمة</span>
                        <span style="background: rgba(0,0,0,0.3); padding: 4px 8px; border-radius: 4px; display: flex; align-items: center; gap: 6px;">
                          <span style="font-size: 1.2em;">${upgradeIcon}</span>
                          <span style="font-weight: bold; font-size: 0.9em;">[${destroyedUpgradeName}]</span>
                        </span>
                      </div>
                      <div style="color:#ff8888; font-size: 0.85em; text-align: right;">"${upgradeDramaPhrases[destroyedUpgradeKey]}"</div>
                    </div>
                `;
              }

              htmlReport += `
                  </div>
                </div>
              `;

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

              showNotification('📋 تقرير تقييم الأضرار', htmlReport, [{ text: 'استيعاب الصدمة والمتابعة', action: proceedTurn }], true);
            }, 1200);
          }, 'enemy_attack');

          return; // Stop current function, continuation happens in callback
        }
      } else {
        addLog('العدو لم يهاجم هذا الدور', '');
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
      { general: GENERALS[0], actionLabel: 'توجيه الضربة', title: 'هجوم موجه مباشر', cost: 3, advice: 'قصف مباشر على قاعدة العدو. الوسيلة الأساسية لحسم المعركة لكنها ستكشف موقعنا للعدو!' },
      { general: { name: 'الجنرال ظل الليل', rank: 'عمليات خاصة', emoji: '🌙', img: 'assets/generals/night_shadow.png' }, actionLabel: 'قصف خفي', title: 'هجوم جوي خفي', cost: 4, advice: 'قصف موقع العدو باستخدام طائرات الشبح. موقعنا سيبقى آمناً تماماً وتكلفتها أعلى.' },
      { general: { name: 'الجنرال العاصفة ', rank: 'سلاح جو', emoji: '✈️', img: 'assets/generals/iron_storm.png' }, actionLabel: 'هجوم شامل', title: 'قصف مكثف', cost: 6, advice: 'إرسال الأسطول بالكامل وتدمير الهدف تماماً. أضرار جسيمة وتكشف موقعنا للعدو.' },
      { general: GENERALS[3], actionLabel: 'استطلاع', title: 'استطلاع جوي', cost: 1, advice: 'إرسال طائرة استطلاع لمسح منطقة محددة في الخريطة لتأكيد وجود العدو أو خلوها، وتزيد نقاط المعلومات.' },
      { general: GENERALS[1], actionLabel: 'جمع المعلومات', title: 'تحليل استخباراتي', cost: 2, advice: 'جمع معلومات دقيقة لاكتشاف قطاعات في الخريطة. (عند وصول المعلومات إلى 10 يكشف موقع قاعدة العدو تلقائياً).' },
      { general: GENERALS[2], actionLabel: 'تحصين', title: 'تعزيز الدفاعات', cost: 2, advice: 'تعزيز دفاعات المطار لصد أي هجوم مفاجئ من العدو، تقلل فرصة الإصابة لدور واحد بنسبة 100%.' },
      { general: GENERALS[2], actionLabel: 'صيانة', title: 'إصلاح القاعدة', cost: 2, advice: 'إجراء صيانة عاجلة للمدرج والطائرات لاستعادة نقاط الصحة وتجنب الهزيمة المؤكدة.' },
      { general: GENERALS[5], actionLabel: 'غارة', title: 'غارة لنهب الموارد', cost: 1, advice: 'غارة على خطوط إمداد العدو لسرقة الموارد. بها نسبة مخاطرة، وإذا نجحت تضعف هجماته القادمة.' },
      { general: GENERALS[5], actionLabel: 'تمويه', title: 'شن هجوم وهمي', cost: 3, advice: 'عملية تمويه لتشتيت انتباه العدو وتقليل عدوانيته وفي حال نجاحها تجعل العدو لا يهاجم لدور واحد.' },
      { general: GENERALS[4], actionLabel: 'توازن', title: 'تكتيك متوازن', cost: 2, advice: 'تأمين الموارد وكشف مناطق جديدة بشكل متوازن ومنهجي.' },
      { general: GENERALS[0], actionLabel: 'إطلاق النار', title: 'قصف عشوائي', cost: 2, advice: 'قصف منطقة مجهولة بشكل عشوائي بحثاً عن هدف. خيار يائس عند نفاد خيارات الاستطلاع.' },
      { general: GENERALS[4], actionLabel: 'راحة', title: 'إراحة الطاقم', cost: 0, advice: 'أعطِ الجنود قسطاً من الراحة لالتقاط الأنفاس، وإصلاح القاعدة جزئياً واستعادة بعض الموارد.' }
    ];

    function toggleCodexModal() {
      const m = document.getElementById('codex-modal');
      const grid = document.getElementById('codex-grid');

      if (!m.classList.contains('active')) {
        grid.innerHTML = '';

        // Sort cards by the General's order in the GENERALS array
        const sortedCards = [...CODEX_CARDS].sort((a, b) => {
          return GENERALS.indexOf(a.general) - GENERALS.indexOf(b.general);
        });

        sortedCards.forEach((card, i) => {
          const el = document.createElement('div');
          el.className = 'codex-card';

          el.innerHTML = `
            <div class="codex-avatar-wrapper">
              <img src="${card.general.img}" alt="Avatar" class="codex-avatar" style="cursor:pointer;" onclick="showImagePreview('${card.general.img}')">
              <span style="font-size: 0.9em; font-weight: bold; color: #fff; margin-top: 5px;">⭐ ${card.general.rank}</span>
              <span style="font-size: 0.85em; display: inline-block; padding: 4px 10px; background: rgba(0,0,0,0.5); border: 1px solid var(--gold); border-radius: 6px; color: var(--gold);">التكلفة: ${card.cost < 0 ? "+" + Math.abs(card.cost) : card.cost} 🛢️</span>
            </div>
            <div class="codex-info">
              <h4 class="codex-name">${card.general.name}</h4>
              <h5 class="codex-title">${card.title}</h5>
              <div class="codex-desc">
                ${card.advice}
              </div>
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
        { id: 'radar', icon: '📡', label: 'رادار كشف مبكر', desc: 'يمنح +1 نقاط معلومات إضافية مع كل عملية جمع استخباراتي', cost: 3 },
        { id: 'walls', icon: '🛡️', label: 'جدران محصنة', desc: 'يزيد صحة القاعدة بمقدار 1', cost: 3 },
        { id: 'aa', icon: '🚀', label: 'دفاع جوي', desc: 'يصد هجوم بنسبة 100% (يحتاج لدور كامل لإعادة التذخير)', cost: 3 },
        { id: 'stealth', icon: '🛩️', label: 'سرب شبحي', desc: 'نجاح الضربة التسللية مضمون', cost: 3 },
        { id: 'eng', icon: '🏗️', label: 'وحدة هندسية', desc: 'تقوم بإصلاح القاعدة تلقائياً (تستغرق دور واحد لكل نقطة صحة)', cost: 3 },
        { id: 'ammo', icon: '🛢️', label: 'ذخائر خارقة', desc: 'الضربة المباشرة تنقص 2 صحة', cost: 3 }
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
      <div class="cost" style="color:${isBought ? 'var(--gold)' : 'var(--orange-warn)'}">${isBought ? '✅ تم التطوير' : 'تكلفة: ' + opt.cost + ' موارد'}</div>
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
        showNotification('موارد غير كافية', `تحتاج ${cost} موارد لشراء هذا التطوير.\nلديك: ${G.resources} موارد`, [{ text: 'حسنًا', action: hideNotification }]);
        return;
      }
      G.resources -= cost;
      G.upgrades[id] = true;

      const names = { radar: 'رادار كشف مبكر', walls: 'جدران محصنة', aa: 'دفاع جوي', stealth: 'سرب شبحي', eng: 'وحدة هندسية', ammo: 'ذخائر خارقة' };
      addLog(`⬆️ تم إنجاز تطوير: ${names[id]}`, 'important');

      if (id === 'walls') {
        G.maxHealth++;
        G.health++;
      }

      updateUI();
      renderConsultation();
    }

    // ===== ALLY SUPPORT =====
    function offerAllySupport() {
      if (G.allyHelps >= 2) return;
      const offers = [
        { type: 'repair', text: 'حلفاؤك يعرضون إصلاح القاعدة (+1 صحة)', btn: 'قبول الإصلاح' },
        { type: 'intel', text: 'حلفاؤك يشاركون معلومات هامة (+3 نقاط معلومات)', btn: 'قبول المعلومات' },
        { type: 'resources', text: 'حلفاؤك يقدمون دعماً بالموارد (+4 موارد)', btn: 'قبول الموارد' },
        { type: 'shield', text: 'حلفاؤك يقدمون درعًا واقيًا (حماية من الضربة القادمة)', btn: 'قبول الدرع' }
      ];

      let offer = G.health < G.maxHealth ? offers[0] : offers[Math.floor(Math.random() * offers.length)];
      G.allyOffer = offer;

      const banner = document.getElementById('ally-banner');
      document.getElementById('ally-text').textContent = offer.text;
      const remainingHelps = 2 - (G.allyHelps || 0);
      document.getElementById('ally-warning-text').textContent = `(تبقى ${remainingHelps} ${remainingHelps === 1 ? 'محاولة مساعدة واحدة' : 'محاولات مساعدة'} قبل رصد العدو لترددات الاتصال)`;
      document.getElementById('btn-ally').textContent = offer.btn;
      banner.classList.add('active');
      addLog('🤝 وصل حلفاؤك لتقديم الدعم!', 'ally');
    }

    function acceptAlly() {
      if (!G.allyOffer) return;

      switch (G.allyOffer.type) {
        case 'repair':
          G.health = Math.min(G.maxHealth, G.health + 1);
          G.damageWithoutRepair = Math.max(0, G.damageWithoutRepair - 1);
          addLog('🤝 الحلفاء أصلحوا القاعدة!', 'ally');
          break;
        case 'intel':
          G.intel += 3;
          addLog('🤝 الحلفاء قدموا نقاط معلومات!', 'ally');
          if (G.intel >= 10 && !G.isEnemyFound) {
            G.isEnemyFound = true;
            G.map[G.enemyPos] = 2;
            addLog('🎯 تم كشف موقع العدو بفضل الحلفاء!', 'danger');
            awardTrophy('eagle_eye');
            if (typeof SFX !== 'undefined' && SFX.setBGMState) SFX.setBGMState('discovery');
          }
          break;
        case 'resources':
          G.resources += 4;
          addLog('🤝 الحلفاء قدموا إمدادات!', 'ally');
          if (G.resources >= 15) awardTrophy('resourceful');
          break;
        case 'shield':
          G._fortified = true;
          addLog('🤝 الحلفاء قدموا درعًا واقيًا!', 'ally');
          break;
      }

      G.allyHelps++;
      if (G.allyHelps >= 2) {
        awardTrophy('alliance');
        setTimeout(() => {
          showNotification('🚨 اختراق الاتصالات التكتيكية!', 'رصد العدو ترددات الاتصال المشفرة بين مطارنا وحلفائنا وتم اعتراض الإشارة بالكامل!\n\n<span style="color:#ff6666; font-weight:bold;">انقطعت خطوط التواصل التكتيكية ولن نتمكن من طلب أو استقبال أي مساعدة إضافية حتى نهاية المعركة.</span>', [
            { text: 'علم، سنعتمد على أنفسنا', gold: true, action: () => hideNotification() }
          ]);
        }, 500);
        addLog('📡🚨 تم اعتراض ترددات الاتصال بالحلفاء وانقطعت المساعدات نهائياً!', 'danger');
      }

      document.getElementById('ally-banner').classList.remove('active');
      G.allyOffer = null;
      updateUI();
    }

    function declineAlly() {
      document.getElementById('ally-banner').classList.remove('active');
      G.allyOffer = null;
      addLog('رفضت مساعدة الحلفاء', '');
    }

    // ===== NOTIFICATIONS =====
    
    

    
    

        function typewriteDOM(element, speed = 25) {
      // First, get all text nodes and replace their text with invisible spans
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
      const texts = [];
      let node;
      while (node = walker.nextNode()) {
        if (node.nodeValue.trim() !== '') {
          texts.push(node);
        }
      }

      const charSpans = [];
      texts.forEach(tNode => {
        const text = tNode.nodeValue;
        const fragment = document.createDocumentFragment();
        for (let i = 0; i < text.length; i++) {
          const span = document.createElement('span');
          span.textContent = text[i];
          span.style.opacity = '0';
          fragment.appendChild(span);
          charSpans.push(span);
        }
        tNode.parentNode.replaceChild(fragment, tNode);
      });

      // Type them out
      let charIdx = 0;
      function typeNext() {
        if (charIdx >= charSpans.length) return;
        charSpans[charIdx].style.opacity = '1';
        charIdx++;
        setTimeout(typeNext, speed);
      }
      typeNext();
    }

    function showNotification(title, body, buttons, typewrite = false) {
      document.getElementById('notif-title').textContent = title;
      const bodyEl = document.getElementById('notif-body');
      bodyEl.innerHTML = body.replace(/\n/g, '<br>');
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
      
      if (typewrite) {
        typewriteDOM(bodyEl, 15);
      }
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
      addLog(`🏆 إنجاز جديد: ${t.name}`, 'important');
    }

    function renderTrophies() {
      const grid = document.getElementById('trophy-grid');
      grid.innerHTML = '';
      Object.entries(TROPHIES).forEach(([id, t]) => {
        const card = document.createElement('div');
        card.className = 'trophy-card' + (G.trophies[id] ? ' earned' : '');
        card.innerHTML = `
      <div class="icon">${G.trophies[id] ? t.icon : '🔒'}</div>
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
        document.getElementById('gameover-title').textContent = '🏆 النصر! 🏆';
        document.getElementById('gameover-title').className = 'gameover-title victory';
        document.getElementById('gameover-stats').innerHTML = `
      <div class="gameover-stat"><div class="val">${G.turn}</div><div class="lbl">عدد الأدوار</div></div>
      <div class="gameover-stat"><div class="val">${G.health}/${G.maxHealth}</div><div class="lbl">صحة القاعدة</div></div>
      <div class="gameover-stat"><div class="val">${G.totalStrikes}</div><div class="lbl">إجمالي الضربات</div></div>
      <div class="gameover-stat"><div class="val">${G.allyHelps}</div><div class="lbl">مساعدات الحلفاء</div></div>
      <div class="gameover-stat"><div class="val">${Object.keys(G.trophies).length}/${Object.keys(TROPHIES).length}</div><div class="lbl">الإنجازات</div></div>
    `;
      }, 800);
    }

    function defeat() {
      setTimeout(() => {
        showScreen('screen-gameover');
        document.getElementById('gameover-title').textContent = '💀 الهزيمة 💀';
        document.getElementById('gameover-title').className = 'gameover-title defeat';
        document.getElementById('gameover-stats').innerHTML = `
      <div class="gameover-stat"><div class="val">${G.turn}</div><div class="lbl">عدد الأدوار</div></div>
      <div class="gameover-stat"><div class="val">${G.enemyHp}/3</div><div class="lbl">صحة العدو المتبقية</div></div>
      <div class="gameover-stat"><div class="val">${G.totalStrikes}</div><div class="lbl">إجمالي الضربات</div></div>
      <div class="gameover-stat"><div class="val">${Object.keys(G.trophies).length}/${Object.keys(TROPHIES).length}</div><div class="lbl">الإنجازات</div></div>
    `;
      }, 800);
    }

    // ===== HELPERS =====
    function isAdjacent(a, b) {
      if (a === b) return false;
      if (!G.hexCoords || !G.hexCoords[a] || !G.hexCoords[b]) return false;
      const ha = G.hexCoords[a], hb = G.hexCoords[b];
      const dq = ha.q - hb.q;
      const dr = ha.r - hb.r;
      const dist = (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2;
      return dist === 1;
    }

    function checkScoutTrophy() {
      let count = 0;
      for (let i = 0; i < 16; i++) if (G.map[i] !== 0) count++;
      if (count >= 10) awardTrophy('scout_master');
    }

    function triggerStoryBeat() {
      if (G.turn === 3 && G.storyPhase === 0) {
        G.storyPhase = 1;
        addLog('📖 التقارير تشير إلى تحركات مشبوهة للعدو...', 'important');
      }
      if (G.turn === 6 && G.storyPhase === 1) {
        G.storyPhase = 2;
        addLog('📖 المعركة تشتد. الوقت ينفد!', 'danger');
      }
      if (G.turn === 10 && G.storyPhase === 2) {
        G.storyPhase = 3;
        addLog('📖 هذه فرصتنا الأخيرة. يجب أن ننهي هذا الآن!', 'danger');
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

