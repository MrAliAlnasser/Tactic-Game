import re

def safe_replace(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. Top Bar Changes
    old_top_bar = """        <div class="top-bar">
          <button class="btn" style="padding: 4px 10px; font-size: 18px;" onclick="toggleMapModal()">🗺️</button>
          <button class="btn" style="padding: 4px 10px; font-size: 18px;" onclick="toggleCodexModal()">🃏</button>
          <button class="btn" style="padding: 4px 10px; font-size: 18px;" onclick="toggleRnDModal()">🔬</button>
          <div class="top-stats">"""

    new_top_bar = """        <div class="top-bar">
          <button class="btn" style="padding: 4px 10px; font-size: 18px;" onclick="toggleLogModal()" title="سجل الأحداث">📜</button>
          <button class="btn" style="padding: 4px 10px; font-size: 18px;" onclick="toggleCodexModal()" title="فهرس الاستشارات">🃏</button>
          <button class="btn" style="padding: 4px 10px; font-size: 18px;" onclick="toggleMapModal()" title="الخريطة">🗺️</button>
          <button class="btn" style="padding: 4px 10px; font-size: 18px;" onclick="toggleRnDModal()" title="الأبحاث">🔬</button>
          <button class="btn" style="padding: 4px 10px; font-size: 18px; margin-right: 5px;" onclick="toggleSettingsModal()" title="الإعدادات">⚙️</button>
          <div class="top-stats">"""
    content = content.replace(old_top_bar, new_top_bar)

    # 2. Add Log Modal HTML right before Map Modal
    old_map_modal = """        <!-- MAP MODAL -->"""
    new_log_modal = """        <!-- LOG MODAL -->
        <div class="glass-modal" id="log-modal" onclick="closeModalOnOutside(event)">
          <div class="glass-modal-content map-panel" style="width: 90vw; max-width: 600px; max-height: 80vh; display: flex; flex-direction: column;">
            <button class="close-btn" onclick="toggleLogModal()">✖</button>
            <div class="map-title" style="margin-bottom: 20px;">📜 سجل الأحداث والعمليات</div>
            <div class="event-log" id="event-log" style="flex: 1; min-height: 300px; overflow-y: auto; text-align: right; border: 1px solid rgba(255,255,255,0.1); padding: 10px; border-radius: 8px;"></div>
          </div>
        </div>

        <!-- MAP MODAL -->"""
    content = content.replace(old_map_modal, new_log_modal)

    # 3. Remove bottom-panel HTML
    old_bottom_panel = """        <div class="bottom-panel">
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <button class="icon-btn" onclick="toggleSettingsModal()">⚙️</button>
            <div style="font-size: 11px; opacity: 0.6; padding-top: 5px;">Tactic v1.0</div>
          </div>
          <div class="event-log" id="event-log-old" style="margin-top: auto; flex: 1;"></div>
        </div>"""
    
    # Wait, the event-log ID must be updated in bottom-panel to not duplicate it when replacing,
    # but I can just delete the bottom panel by replacing it with nothing. Let's find exactly what's there:
    old_bp = """        <div class="bottom-panel">
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <button class="icon-btn" onclick="toggleSettingsModal()">⚙️</button>
            <div style="font-size: 11px; opacity: 0.6; padding-top: 5px;">Tactic v1.0</div>
          </div>
          <div class="event-log" id="event-log" style="margin-top: auto; flex: 1;"></div>
        </div>"""
    content = content.replace(old_bp, "")

    # 4. Fix Battle Canvas aspect ratio on mobile
    old_css_canvas = """      #airportCanvas,
      #battleCanvas {
        max-width: 100% !important;
        height: 100% !important;
      }"""
    new_css_canvas = """      #airportCanvas {
        max-width: 100% !important;
        height: 100% !important;
      }
      #battleCanvas {
        max-width: 100% !important;
        height: auto !important;
        aspect-ratio: 2 / 1;
        object-fit: contain;
      }"""
    content = content.replace(old_css_canvas, new_css_canvas)

    # 5. Fix battleCanvas CSS rules (just basic width/height)
    old_battle_canvas_css = """    #battleCanvas {
      width: 800px;
      height: 400px;
      border: 2px solid var(--border-color);
      border-radius: 8px;
      background: var(--bg-darkest);
    }"""
    new_battle_canvas_css = """    #battleCanvas {
      width: 100%;
      max-width: 800px;
      height: auto;
      aspect-ratio: 2 / 1;
      object-fit: contain;
      border: 2px solid var(--border-color);
      border-radius: 8px;
      background: var(--bg-darkest);
    }"""
    content = content.replace(old_battle_canvas_css, new_battle_canvas_css)

    # 6. Add JS toggle
    old_js = """    function toggleMapModal() {"""
    new_js = """    function toggleLogModal() {
      const m = document.getElementById('log-modal');
      m.classList.toggle('active');
      if (typeof SFX !== 'undefined') SFX.play('click');
    }

    function toggleMapModal() {"""
    content = content.replace(old_js, new_js)

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)

safe_replace("index.html")
