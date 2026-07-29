import sys

def modify_file():
    with open('index.html', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 1. Emoji reroll
    content = content.replace('🔄 تغيير الخطط (-3 📡)', '🔄 تغيير الخطط (-3 👁️)')
    
    # 2. General name
    content = content.replace('الجنرال سيف العدالة', 'الجنرال سيف')
    
    # 3. Notification styling
    content = content.replace('max-width: 520px;', 'max-width: 450px;')
    content = content.replace('padding: 30px;', 'padding: 20px;')
    
    # 4. Banter UI styling
    content = content.replace('gap: 15px; padding-top: 10px;', 'gap: 10px; padding-top: 5px;')
    content = content.replace('gap: 12px; background: rgba(255,255,255,0.05); padding: 12px;', 'gap: 10px; background: rgba(255,255,255,0.05); padding: 10px;')
    content = content.replace('width: 60px; height: 60px;', 'width: 50px; height: 50px;')
    content = content.replace('margin-bottom: 5px;', 'margin-bottom: 3px;')
    content = content.replace('font-size: 0.95em;', 'font-size: 0.9em;')
    content = content.replace('line-height: 1.5;', 'line-height: 1.4;')
    
    # 5. Reroll animation
    old_reroll = '''    function rerollCards() {
      if (G.intel < 3) return;
      G.intel -= 3;
      eventLog('تم طلب خطط جديدة من القيادة (-3 معلومات)');
      if (typeof SFX !== 'undefined' && SFX.playClick) SFX.playClick();
      G.selectedGeneral = -1;
      generateAdvice();
      renderGenerals();
      updateUI();
    }'''
    
    new_reroll = '''    function rerollCards() {
      if (G.intel < 3) return;
      G.intel -= 3;
      eventLog('تم طلب خطط جديدة من القيادة (-3 معلومات)');
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
    }'''
    content = content.replace(old_reroll, new_reroll)
    
    # 6. Update UI
    old_ui = '''      // Enemy status
      const esc = document.getElementById('enemy-status-container');
      if (G.enemyKnowsUs) {
        esc.innerHTML = '<div class="enemy-status-bar">⚠️ العدو يعلم موقع مطارك! هجماته أقوى وأدق</div>';
      } else {
        esc.innerHTML = '';
      }
    }'''
    
    new_ui = '''      // Enemy status
      const esc = document.getElementById('enemy-status-container');
      if (G.enemyKnowsUs) {
        esc.innerHTML = '<div class="enemy-status-bar">⚠️ العدو يعلم موقع مطارك! هجماته أقوى وأدق</div>';
      } else {
        esc.innerHTML = '';
      }

      const btnReroll = document.getElementById('btn-reroll');
      if (btnReroll) {
        if (G.intel < 3) {
          btnReroll.disabled = true;
          btnReroll.style.opacity = '0.5';
        } else {
          btnReroll.disabled = false;
          btnReroll.style.opacity = '1';
        }
      }
    }'''
    content = content.replace(old_ui, new_ui)
    
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(content)

modify_file()
