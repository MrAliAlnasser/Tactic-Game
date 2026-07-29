
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
  
