import os

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

codex_target = '''          el.innerHTML = 
            <div class="card-header" style="background: var(--primary-bg); padding: 10px;">
              <img src="" alt="Avatar" style="width: 50px; height: 50px; border-radius: 6px; object-fit: cover; border: 1px solid #4a5565;">
              <div class="general-info" style="margin-right: 15px; text-align: right; display: flex; flex-direction: column; justify-content: center;">
                <div class="general-name" style="font-size: 15px;"></div>
                <div class="general-rank" style="font-size: 12px;"></div>
              </div>
            </div>
            <div class="card-body">
              <div class="action-title"></div>
              <div class="action-desc"></div>
              <div class="cost-badge" style="position: static; margin-top: 15px; display: inline-block;">🛢️  موارد</div>
            </div>
          ;'''

codex_replacement = '''          el.style.width = '100%';
          el.innerHTML = 
            <div style="display: flex; gap: 15px; padding: 15px; width: 100%; box-sizing: border-box; flex-direction: row-reverse; background: rgba(0,0,0,0.3); border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);">
              <div class="dogtag-left" style="padding-top: 5px; flex-shrink: 0; min-width: 100px;">
                <img src="" alt="Avatar" style="width: 80px; height: 80px; border-radius: 8px; object-fit: cover; border: 2px solid var(--primary-color); box-shadow: 0 4px 8px rgba(0,0,0,0.5);">
                <span style="font-size: 0.85em; font-weight: bold; display: block; margin-top: 5px; color: #fff;">⭐ </span>
                <span style="font-size: 0.85em; display: inline-block; padding: 3px 8px; background: rgba(0,0,0,0.5); border: 1px solid var(--gold); border-radius: 4px; margin-top: 5px; color: var(--gold);">📝 التكلفة: </span>
              </div>
              <div class="dogtag-right" style="flex-grow: 1; text-align: right; display: flex; flex-direction: column; justify-content: center;">
                <h4 style="margin: 0 0 5px 0; font-size: 1.2em; color: var(--primary-color);"></h4>
                <h5 style="margin: 0 0 10px 0; font-size: 1.1em; color: var(--gold);"></h5>
                <div style="font-size: 1.05em; line-height: 1.6; color: #ddd; background: rgba(0,0,0,0.2); padding: 10px; border-radius: 8px; border-right: 3px solid var(--primary-color);">
                  
                </div>
              </div>
            </div>
          ;'''

if codex_target in html:
    html = html.replace(codex_target, codex_replacement)
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(html)
    print("Codex replacement successful.")
else:
    print("Codex target not found!")
