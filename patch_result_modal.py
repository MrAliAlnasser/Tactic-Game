import re

with open("index.html", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update .notification CSS for mobile to handle overflow and reduce padding further
css_old = """    @media (max-width: 600px) {
      .result-columns {
        flex-direction: column;
      }
      .notification {
        padding: 15px;
        width: 90%;
        box-sizing: border-box;
      }
      .notification .notif-body {
        margin-bottom: 10px;
      }
    }"""

css_new = """    @media (max-width: 600px) {
      .result-columns {
        flex-direction: column;
        gap: 5px; /* Tighter gap on mobile */
      }
      .notification {
        padding: 12px;
        width: 95%;
        box-sizing: border-box;
        max-height: 85vh; /* Prevent taking full vertical space */
        overflow-y: auto; /* Allow scrolling if content is too large */
      }
      .notification .notif-title {
        font-size: 16px;
        margin-bottom: 8px;
      }
      .notification .notif-body {
        margin-bottom: 8px;
        line-height: 1.4;
      }
    }"""
content = content.replace(css_old, css_new)

# 2. Update showResultModal to have smaller text/padding
old_modal = """      const html = `
        <div style="font-style: italic; color: #a0b0c0; margin-bottom: 15px; font-size: 1.05em; line-height: 1.5; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px;">"${story}"</div>
        <div class="result-columns">
            <div style="flex: 1; background: rgba(50, 150, 50, 0.1); padding: 10px; border-right: 3px solid #3c3; border-radius: 4px;">
                <h4 style="color: #3c3; margin-top: 0; margin-bottom: 5px;">الإيجابيات</h4>
                <ul style="margin: 0; padding-right: 15px; color: #dfd;">
                    ${pros.map(p => `<li>${p}</li>`).join('')}
                </ul>
            </div>
            <div style="flex: 1; background: rgba(200, 50, 50, 0.1); padding: 10px; border-right: 3px solid #f44; border-radius: 4px;">
                <h4 style="color: #f44; margin-top: 0; margin-bottom: 5px;">السلبيات</h4>
                <ul style="margin: 0; padding-right: 15px; color: #fdd;">
                    ${cons.map(c => `<li>${c}</li>`).join('')}
                </ul>
            </div>
        </div>
      `;"""

new_modal = """      const html = `
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
      `;"""
content = content.replace(old_modal, new_modal)

with open("index.html", "w", encoding="utf-8") as f:
    f.write(content)
