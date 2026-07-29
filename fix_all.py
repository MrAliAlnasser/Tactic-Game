import os
import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Reroll Button
target_buttons = '''    <button class="btn btn-gold" id="btn-execute" onclick="executeChoice()" disabled style="font-size:14px;padding:12px 30px;opacity:0.5">تنفيذ الأمر</button>
    <button class="btn" id="btn-skip" onclick="skipTurn()" style="font-size:13px;padding:10px 20px;opacity:0.8;border-color:#4a5565;">⏭️ تخطّي الدور (+1 🛢️)</button>'''
replacement_buttons = '''    <button class="btn btn-gold" id="btn-execute" onclick="executeChoice()" disabled style="font-size:14px;padding:12px 30px;opacity:0.5">تنفيذ الأمر</button>
    <button class="btn" id="btn-skip" onclick="skipTurn()" style="font-size:13px;padding:10px 20px;opacity:0.8;border-color:#4a5565;">⏭️ تخطّي الدور (+1 🛢️)</button>
    <button class="btn" id="btn-reroll" onclick="rerollCards()" style="font-size:13px;padding:10px 20px;opacity:0.8;border-color:#4a5565; position:relative;" >👁️ تغيير الخطط (-3 📡)</button>'''

html = html.replace(target_buttons, replacement_buttons)

# 2. updateUI: Reroll disabled logic + Audio State Logic
update_ui_target = '''      const ud = document.getElementById('upgrade-display');'''
update_ui_replacement = '''      // Reroll button check
      const rerollBtn = document.getElementById('btn-reroll');
      if (rerollBtn) {
        if (G.intel < 3) {
          rerollBtn.setAttribute('disabled', 'true');
        } else {
          rerollBtn.removeAttribute('disabled');
        }
      }

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

      const ud = document.getElementById('upgrade-display');'''

html = html.replace(update_ui_target, update_ui_replacement)

# 3. SFX Audio Logic
sfx_target = '''      playRedAlarm() {
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
      },'''

sfx_replacement = '''      currentTrack: 'default',
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

        if (state === 'default') {
          this.bgm.src = 'March_Toward_the_Iron_Gates.mp3';
        } else if (state === 'discovery') {
          this.bgm.src = 'Chronicles_of_the_Ascendant.mp3';
        } else if (state === 'red-alarm') {
          this.bgm.src = 'Red-Alarm.mp3';
        }
        
        this.bgm.loop = true;
        this.bgm.volume = currentVol;
        if (wasPlaying) {
          this.bgm.play().catch(e => console.log('BGM play failed', e));
        }
      },'''
html = html.replace(sfx_target, sfx_replacement)

# Replace red alarm triggers
html = html.replace('''      if (typeof SFX !== 'undefined' && SFX.stopRedAlarm) {
        SFX.stopRedAlarm();
      }''', '')

html = html.replace('''        if (typeof SFX !== 'undefined' && SFX.playRedAlarm) {
          SFX.playRedAlarm();
        }''', '')


# 4. Codex Modal HTML
codex_target = '''          el.innerHTML = 
            <div class="card-header" style="background: var(--primary-bg); padding: 10px;">
              <img src="" alt="Avatar" style="width: 50px; height: 50px; border-radius: 6px; object-fit: cover; border: 1px solid #4a5565;">
              <div class="general-info" style="margin-right: 15px; text-align: right; display: flex; flex-direction: column; justify-content: center;">
                <div class="general-name" style="font-size: 15px;"></div>
                <div class="general-rank" style="font-size: 12px;"></div>
              </div>
            </div>
            <div class="card-body" style="padding: 15px; text-align: right; background: rgba(0,0,0,0.2);">
              <div class="card-title" style="color: var(--gold); margin-bottom: 10px; font-weight: bold; font-size: 14px;"></div>
              <div class="card-advice" style="color: #ccc; font-size: 13px; line-height: 1.5; margin-bottom: 10px;"></div>
              <div class="card-cost" style="color: var(--text-dim); font-size: 12px;">التكلفة:  🛢️</div>
            </div>
          ;'''

codex_replacement = '''          el.innerHTML = 
            <div style="display: flex; gap: 15px; padding: 15px; width: 100%; box-sizing: border-box; flex-direction: row-reverse; background: rgba(0,0,0,0.3); border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);">
              <div class="dogtag-left" style="padding-top: 5px; flex-shrink: 0; min-width: 100px;">
                <img src="" alt="Avatar" style="width: 80px; height: 80px; border-radius: 8px; object-fit: cover; border: 2px solid var(--primary-color); box-shadow: 0 4px 8px rgba(0,0,0,0.5);">
                <span style="font-size: 0.85em; font-weight: bold; display: block; margin-top: 5px; color: #fff;">⭐ </span>
                <span style="font-size: 0.85em; display: inline-block; padding: 3px 8px; background: rgba(0,0,0,0.5); border: 1px solid var(--gold); border-radius: 4px; margin-top: 5px; color: var(--gold);">📝 التكلفة: </span>
              </div>
              <div class="dogtag-right" style="flex-grow: 1; text-align: right;">
                <h4 style="margin: 0 0 5px 0; font-size: 1.2em; color: var(--primary-color);"></h4>
                <h5 style="margin: 0 0 10px 0; font-size: 1.1em; color: var(--gold);"></h5>
                <div style="font-size: 1.05em; line-height: 1.6; color: #ddd; background: rgba(0,0,0,0.2); padding: 10px; border-radius: 8px; border-right: 3px solid var(--primary-color);">
                  
                </div>
              </div>
            </div>
          ;'''

html = html.replace(codex_target, codex_replacement)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
