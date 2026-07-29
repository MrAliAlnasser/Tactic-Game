import os

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Add CSS for codex-card
css_target = "/* ===== DOG TAG CARD ===== */"
css_replacement = """/* ===== CODEX CARD ===== */
    .codex-card {
      background: linear-gradient(145deg, #1e2530, #151a22, #1a2028);
      border: 2px solid #3a4050;
      border-radius: 16px;
      padding: 15px 20px;
      display: flex;
      flex-direction: row;
      gap: 20px;
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.6);
      width: 100%;
      box-sizing: border-box;
      direction: rtl;
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
    }
    
    .codex-card::before {
      content: '';
      position: absolute;
      inset: -1px;
      border-radius: 16px;
      padding: 1px;
      background: linear-gradient(145deg, #5a6570, #2a3040, #4a5565, #2a3040);
      -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
      mask-composite: exclude;
      pointer-events: none;
      transition: all 0.3s;
    }
    
    .codex-card:hover {
      border-color: var(--gold);
      transform: translateY(-3px);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.7), 0 0 30px rgba(212, 160, 48, 0.1);
    }
    
    .codex-card:hover::before {
      background: linear-gradient(145deg, #8a7a40, #3a4050, #8a7a40, #3a4050);
    }

    .codex-avatar-wrapper {
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
    }

    .codex-avatar {
      width: 110px;
      height: 110px;
      border-radius: 12px;
      object-fit: cover;
      border: 3px solid var(--primary-color);
      box-shadow: 0 5px 15px rgba(0,0,0,0.6);
    }

    .codex-info {
      display: flex;
      flex-direction: column;
      justify-content: center;
      flex: 1;
      text-align: right;
    }

    .codex-name {
      margin: 0 0 5px 0;
      font-size: 1.3em;
      color: var(--primary-color);
      font-weight: bold;
    }

    .codex-title {
      margin: 0 0 12px 0;
      font-size: 1.1em;
      color: var(--gold);
    }

    .codex-desc {
      font-size: 1.05em;
      line-height: 1.6;
      color: #ddd;
      background: rgba(0,0,0,0.25);
      padding: 12px 15px;
      border-radius: 10px;
      border-right: 3px solid var(--primary-color);
    }

    @media (max-width: 600px) {
      .codex-card {
        flex-direction: column;
        align-items: center;
        text-align: center;
        padding: 15px;
        gap: 12px;
      }
      .codex-info {
        text-align: center;
      }
      .codex-desc {
        border-right: none;
        border-top: 3px solid var(--primary-color);
        padding: 12px;
        text-align: center;
      }
      .codex-avatar {
        width: 100px;
        height: 100px;
      }
    }

    /* ===== DOG TAG CARD ===== */"""

html = html.replace(css_target, css_replacement)

js_target = '''    function toggleCodexModal() {
      const m = document.getElementById('codex-modal');
      const grid = document.getElementById('codex-grid');

      if (!m.classList.contains('active')) {
        grid.innerHTML = '';
        CODEX_CARDS.forEach((card, i) => {
          const el = document.createElement('div');
          el.className = 'general-card';
          el.style.transform = 'none';
          el.style.position = 'relative';


          el.style.width = '100%';
          el.innerHTML = 
            <div style="display: flex; gap: 15px; padding: 15px; width: 100%; box-sizing: border-box; flex-direction: row-reverse; background: rgba(0,0,0,0.3); border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);">
              <div class="dogtag-left" style="padding-top: 5px; flex-shrink: 0; min-width: 100px;">
                <img src="" alt="Avatar" style="width: 80px; height: 80px; border-radius: 8px; object-fit: cover; border: 2px solid var(--primary-color); box-shadow: 0 4px 8px rgba(0,0,0,0.5);">
                <span style="font-size: 0.85em; font-weight: bold; display: block; margin-top: 5px; color: #fff;">⭐ </span>
                <span style="font-size: 0.85em; display: inline-block; padding: 3px 8px; background: rgba(0,0,0,0.5); border: 1px solid var(--gold); border-radius: 4px; margin-top: 5px; color: var(--gold);">📝 التكلفة:  🛢️</span>
              </div>
              <div class="dogtag-right" style="flex-grow: 1; text-align: right; display: flex; flex-direction: column; justify-content: center;">
                <h4 style="margin: 0 0 5px 0; font-size: 1.2em; color: var(--primary-color);"></h4>
                <h5 style="margin: 0 0 10px 0; font-size: 1.1em; color: var(--gold);"></h5>
                <div style="font-size: 1.05em; line-height: 1.6; color: #ddd; background: rgba(0,0,0,0.2); padding: 10px; border-radius: 8px; border-right: 3px solid var(--primary-color);">
                  
                </div>
              </div>
            </div>
          ;
          grid.appendChild(el);
        });
      }
      m.classList.toggle('active');
    }'''

js_replacement = '''    function toggleCodexModal() {
      const m = document.getElementById('codex-modal');
      const grid = document.getElementById('codex-grid');
      // Set to column layout to ensure one card per row
      grid.style.flexDirection = 'column';
      grid.style.flexWrap = 'nowrap';
      grid.style.alignItems = 'stretch';

      if (!m.classList.contains('active')) {
        grid.innerHTML = '';
        CODEX_CARDS.forEach((card, i) => {
          const el = document.createElement('div');
          el.className = 'codex-card';
          
          el.innerHTML = 
            <div class="codex-avatar-wrapper">
              <img src="" alt="Avatar" class="codex-avatar">
              <span style="font-size: 0.9em; font-weight: bold; color: #fff; margin-top: 5px;">⭐ </span>
              <span style="font-size: 0.85em; display: inline-block; padding: 4px 10px; background: rgba(0,0,0,0.5); border: 1px solid var(--gold); border-radius: 6px; color: var(--gold);">📝 التكلفة:  🛢️</span>
            </div>
            <div class="codex-info">
              <h4 class="codex-name"></h4>
              <h5 class="codex-title"></h5>
              <div class="codex-desc">
                
              </div>
            </div>
          ;
          grid.appendChild(el);
        });
      }
      m.classList.toggle('active');
    }'''

if js_target in html:
    html = html.replace(js_target, js_replacement)
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(html)
    print("Success")
else:
    print("Failed to find JS target.")
