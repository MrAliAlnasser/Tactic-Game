import re

with open("index.html", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Fix the CSS for battleCanvas on mobile
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

# Also ensure battle-overlay center aligns it and doesn't stretch it
old_overlay_css = """    .battle-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(12, 14, 18, 0.96);
      z-index: 100;
      display: none;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }"""
new_overlay_css = """    .battle-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(12, 14, 18, 0.96);
      z-index: 100;
      display: none;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    
    #battleCanvas {
      width: 100%;
      max-width: 800px;
      height: auto;
      aspect-ratio: 2 / 1;
      object-fit: contain;
      border: 2px solid var(--border-color);
      border-radius: 8px;
      background: var(--bg-darkest);
    }"""
content = content.replace(old_overlay_css, new_overlay_css)

# Remove the old #battleCanvas CSS completely
content = re.sub(r'    #battleCanvas \{[\s\S]*?\}', '', content, count=1)


# 2. Top bar changes: Add Log button and Settings button to the top
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

# 3. Remove bottom-panel HTML
old_bottom_panel = """        <div class="bottom-panel">
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <button class="icon-btn" onclick="toggleSettingsModal()">⚙️</button>
            <div style="font-size: 11px; opacity: 0.6; padding-top: 5px;">Tactic v1.0</div>
          </div>
          <div class="event-log" id="event-log" style="margin-top: auto; flex: 1;"></div>
        </div>"""

content = content.replace(old_bottom_panel, "")


# 4. Add Log Modal HTML right after map-modal
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


# 5. Add toggleLogModal JS function
old_js_map = """    function toggleMapModal() {"""
new_js_log = """    function toggleLogModal() {
      const m = document.getElementById('log-modal');
      m.classList.toggle('active');
      if (typeof SFX !== 'undefined') SFX.play('click');
    }

    function toggleMapModal() {"""
content = content.replace(old_js_map, new_js_log)

# 6. Delete .bottom-panel CSS
content = re.sub(r'    \.bottom-panel \{[\s\S]*?flex-shrink: 0;\n    \}', '', content)


with open("index.html", "w", encoding="utf-8") as f:
    f.write(content)
