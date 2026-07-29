import os
import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Fix the ;; in buildBanterHTML
html = html.replace(";;", ";")

target_check = '''    function checkBanterAndEndTurn(actionType, success) {
      if (!success) {
        if (actionType === 'strike') {
          const banterText = <b style="color:#d9534f">الجنرال المهندس:</b> "ألم أقل لك لا تستمع لجنرال الهجوم، الطائرات تحتاج للصيانة والوقود وليس للحماس الفارغ."<br><br><b style="color:#f0ad4e">جنرال الهجوم:</b> "الدفاع لن ينهي هذه الحرب يا سيدي، أعطني الإذن وسأحيل مطارهم إلى رماد!";
          setTimeout(() => {
            showNotification('مناوشات القيادة 🗣️', banterText, [{ text: 'متابعة', gold: true, action: () => { hideNotification(); endPlayerTurn(); } }]);
          }, 100);
          return;
        }
        if (actionType === 'recon') {
          const banterText = <b style="color:#f0ad4e">جنرال الهجوم:</b> "لقد أضعنا مواردنا على التقاط صور للرمال! لو أعطيتني هذه الموارد لدمرتهم."<br><br><b style="color:#5bc0de">جنرال الاستطلاع:</b> "القتال الأعمى انتحار. دعني أكشف لك ما يختبئ في الظلام أولاً.";
          setTimeout(() => {
            showNotification('مناوشات القيادة 🗣️', banterText, [{ text: 'متابعة', gold: true, action: () => { hideNotification(); endPlayerTurn(); } }]);
          }, 100);
          return;
        }
        if (actionType === 'raid') {
          const banterText = <b style="color:#d9534f">الجنرال المهندس:</b> "هل اقتنعت الآن يا سيف العدالة؟ القوات الخاصة لا تنفع إذا لم تجد ما تسرقه! كان الأجدر ترك الموارد لتعزيز دفاعاتنا."<br><br><b style="color:#5bc0de">الجنرال سيف:</b> "التكتيكات الجريئة تحمل المخاطر. الجلوس خلف الجدران لن يحسم المعركة، بل يؤجل الهزيمة فقط.";
          setTimeout(() => {
            showNotification('مناوشات القيادة 🗣️', banterText, [{ text: 'متابعة', gold: true, action: () => { hideNotification(); endPlayerTurn(); } }]);
          }, 100);
          return;
        }
      }
      endPlayerTurn();
    }'''

replacement_check = '''    function checkBanterAndEndTurn(actionType, success) {
      if (!success) {
        if (actionType === 'strike') {
          const banterText = buildBanterHTML(GENERALS[2].img, 'الجنرال المهندس', '#d9534f', 'ألم أقل لك لا تستمع لجنرال الهجوم، الطائرات تحتاج للصيانة والوقود وليس للحماس الفارغ.', GENERALS[0].img, 'جنرال الهجوم', '#f0ad4e', 'الدفاع لن ينهي هذه الحرب يا سيدي، أعطني الإذن وسأحيل مطارهم إلى رماد!');
          setTimeout(() => {
            showNotification('مناوشات القيادة 🗣️', banterText, [{ text: 'متابعة', gold: true, action: () => { hideNotification(); endPlayerTurn(); } }]);
          }, 100);
          return;
        }
        if (actionType === 'recon') {
          const banterText = buildBanterHTML(GENERALS[0].img, 'جنرال الهجوم', '#f0ad4e', 'لقد أضعنا مواردنا على التقاط صور للرمال! لو أعطيتني هذه الموارد لدمرتهم.', GENERALS[3].img, 'جنرال الاستطلاع', '#5bc0de', 'القتال الأعمى انتحار. دعني أكشف لك ما يختبئ في الظلام أولاً.');
          setTimeout(() => {
            showNotification('مناوشات القيادة 🗣️', banterText, [{ text: 'متابعة', gold: true, action: () => { hideNotification(); endPlayerTurn(); } }]);
          }, 100);
          return;
        }
        if (actionType === 'raid') {
          const banterText = buildBanterHTML(GENERALS[2].img, 'الجنرال المهندس', '#d9534f', 'هل اقتنعت الآن يا سيف العدالة؟ القوات الخاصة لا تنفع إذا لم تجد ما تسرقه! كان الأجدر ترك الموارد لتعزيز دفاعاتنا.', GENERALS[4].img, 'الجنرال سيف', '#5bc0de', 'التكتيكات الجريئة تحمل المخاطر. الجلوس خلف الجدران لن يحسم المعركة، بل يؤجل الهزيمة فقط.');
          setTimeout(() => {
            showNotification('مناوشات القيادة 🗣️', banterText, [{ text: 'متابعة', gold: true, action: () => { hideNotification(); endPlayerTurn(); } }]);
          }, 100);
          return;
        }
      }
      endPlayerTurn();
    }'''

if target_check in html:
    html = html.replace(target_check, replacement_check)
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(html)
    print("Banter replaced successfully.")
else:
    print("Banter target not found.")
