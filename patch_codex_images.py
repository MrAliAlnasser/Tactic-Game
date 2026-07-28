import re

with open("index.html", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Replace CODEX_CARDS array
old_cards = """    const CODEX_CARDS = [
      { general: { name: 'الجنرال الصارم', rank: 'جنرال الهجوم', emoji: '⚔️' }, title: 'هجوم موجه مباشر', cost: 3, advice: 'قصف مباشر على قاعدة العدو. سيكشف موقعنا للعدو!', actionLabel: 'تأكيد الهجوم' },
      { general: { name: 'الجنرال ذو الظل', rank: 'جنرال تخفي', emoji: '🥷' }, title: 'هجوم جوي خفي', cost: 5, advice: 'قصف موقع العدو باستخدام طائرات الشبح. موقعنا سيبقى آمناً.', actionLabel: 'تنفيذ القصف الخفي' },
      { general: { name: 'الجنرال العاصفة الحديدية', rank: 'مشير جوي', emoji: '🌪️' }, title: 'هجوم شامل وقصف مكثف', cost: 6, advice: 'إرسال الأسطول بالكامل وتدمير الهدف تماماً. أضرار جسيمة!', actionLabel: 'إطلاق العاصفة' },
      { general: { name: 'جنرال استطلاع', rank: 'استطلاع', emoji: '🔭' }, title: 'استطلاع جوي', cost: 1, advice: 'إرسال طائرة استطلاع لمسح منطقة محددة في الخريطة.', actionLabel: 'بدء الاستطلاع' },
      { general: { name: 'جنرال معلومات', rank: 'استخبارات', emoji: '📡' }, title: 'جمع الاستخبارات', cost: 2, advice: 'جمع معلومات دقيقة لاكتشاف موقعين في الخريطة.', actionLabel: 'تأكيد الاختراق' },
      { general: { name: 'جنرال الدفاع', rank: 'دفاع', emoji: '🛡️' }, title: 'تعزيز الدفاعات', cost: 2, advice: 'تعزيز دفاعات المطار لصد أي هجوم مفاجئ من العدو.', actionLabel: 'تأكيد التعزيز' },
      { general: { name: 'جنرال مهندس', rank: 'هندسة', emoji: '🔧' }, title: 'ترميم المطار', cost: 2, advice: 'إجراء صيانة عاجلة للمدرج والطائرات لاستعادة نقاط الصحة.', actionLabel: 'بدء الإصلاحات' },
      { general: { name: 'الجنرال الماكر', rank: 'تكتيكات', emoji: '🦊' }, title: 'غارة لنهب الموارد', cost: 2, advice: 'غارة على خطوط إمداد العدو لسرقة الموارد. بها نسبة مخاطرة.', actionLabel: 'شن الغارة' },
      { general: { name: 'جنرال عمليات', rank: 'تكتيكات', emoji: '♟️' }, title: 'شن هجوم وهمي', cost: 1, advice: 'عملية تمويه لتشتيت انتباه العدو وتقليل عدوانيته.', actionLabel: 'تأكيد التمويه' },
      { general: { name: 'جنرال متوازن', rank: 'متوازن', emoji: '⚖️' }, title: 'خطة متوازنة', cost: 2, advice: 'تأمين الموارد وكشف مناطق جديدة بشكل متوازن ومنهجي.', actionLabel: 'بدء التأمين' },
      { general: { name: 'جنرال هجوم', rank: 'هجوم', emoji: '⚔️' }, title: 'قصف عشوائي', cost: 2, advice: 'قصف منطقة مجهولة بشكل عشوائي بحثاً عن هدف.', actionLabel: 'إطلاق النار' },
      { general: { name: 'جميع الجنرالات', rank: 'متنوع', emoji: '💤' }, title: 'إراحة الطاقم', cost: 0, advice: 'أعطِ الجنود قسطاً من الراحة لجمع بعض الموارد ببطء.', actionLabel: 'تأكيد الراحة' }
    ];"""

new_cards = """    const CODEX_CARDS = [
      { general: { name: 'الجنرال الصارم', rank: 'جنرال الهجوم', emoji: '⚔️', img: 'assets/generals/iron_falcon.png' }, title: 'هجوم موجه مباشر', cost: 3, advice: 'قصف مباشر على قاعدة العدو. سيكشف موقعنا للعدو!', actionLabel: 'تأكيد الهجوم' },
      { general: { name: 'الجنرال ذو الظل', rank: 'جنرال تخفي', emoji: '🥷', img: 'assets/generals/night_shadow.png' }, title: 'هجوم جوي خفي', cost: 5, advice: 'قصف موقع العدو باستخدام طائرات الشبح. موقعنا سيبقى آمناً.', actionLabel: 'تنفيذ القصف الخفي' },
      { general: { name: 'الجنرال العاصفة الحديدية', rank: 'مشير جوي', emoji: '🌪️', img: 'assets/generals/iron_storm.png' }, title: 'هجوم شامل وقصف مكثف', cost: 6, advice: 'إرسال الأسطول بالكامل وتدمير الهدف تماماً. أضرار جسيمة!', actionLabel: 'إطلاق العاصفة' },
      { general: { name: 'جنرال استطلاع', rank: 'استطلاع', emoji: '🔭', img: 'assets/generals/eagle_eye.png' }, title: 'استطلاع جوي', cost: 1, advice: 'إرسال طائرة استطلاع لمسح منطقة محددة في الخريطة.', actionLabel: 'بدء الاستطلاع' },
      { general: { name: 'جنرال معلومات', rank: 'استخبارات', emoji: '📡', img: 'assets/generals/desert_fox.png' }, title: 'جمع الاستخبارات', cost: 2, advice: 'جمع معلومات دقيقة لاكتشاف موقعين في الخريطة.', actionLabel: 'تأكيد الاختراق' },
      { general: { name: 'جنرال الدفاع', rank: 'دفاع', emoji: '🛡️', img: 'assets/generals/shield_nation.png' }, title: 'تعزيز الدفاعات', cost: 2, advice: 'تعزيز دفاعات المطار لصد أي هجوم مفاجئ من العدو.', actionLabel: 'تأكيد التعزيز' },
      { general: { name: 'جنرال مهندس', rank: 'هندسة', emoji: '🔧', img: 'assets/generals/shield_nation.png' }, title: 'ترميم المطار', cost: 2, advice: 'إجراء صيانة عاجلة للمدرج والطائرات لاستعادة نقاط الصحة.', actionLabel: 'بدء الإصلاحات' },
      { general: { name: 'الجنرال الماكر', rank: 'تكتيكات', emoji: '🦊', img: 'assets/generals/desert_fox.png' }, title: 'غارة لنهب الموارد', cost: 2, advice: 'غارة على خطوط إمداد العدو لسرقة الموارد. بها نسبة مخاطرة.', actionLabel: 'شن الغارة' },
      { general: { name: 'جنرال عمليات', rank: 'تكتيكات', emoji: '♟️', img: 'assets/generals/sword_justice.png' }, title: 'شن هجوم وهمي', cost: 1, advice: 'عملية تمويه لتشتيت انتباه العدو وتقليل عدوانيته.', actionLabel: 'تأكيد التمويه' },
      { general: { name: 'جنرال متوازن', rank: 'متوازن', emoji: '⚖️', img: 'assets/generals/lionheart.png' }, title: 'خطة متوازنة', cost: 2, advice: 'تأمين الموارد وكشف مناطق جديدة بشكل متوازن ومنهجي.', actionLabel: 'بدء التأمين' },
      { general: { name: 'جنرال هجوم', rank: 'هجوم', emoji: '⚔️', img: 'assets/generals/iron_falcon.png' }, title: 'قصف عشوائي', cost: 2, advice: 'قصف منطقة مجهولة بشكل عشوائي بحثاً عن هدف.', actionLabel: 'إطلاق النار' },
      { general: { name: 'جميع الجنرالات', rank: 'متنوع', emoji: '💤', img: 'assets/generals/lionheart.png' }, title: 'إراحة الطاقم', cost: 0, advice: 'أعطِ الجنود قسطاً من الراحة لجمع بعض الموارد ببطء.', actionLabel: 'تأكيد الراحة' }
    ];"""

content = content.replace(old_cards, new_cards)

# 2. Update innerHTML in toggleCodexModal
old_inner_html = """          el.innerHTML = `
            <div class="card-header" style="background: var(--primary-bg);">
              <div class="general-emoji">${card.general.emoji}</div>
              <div class="general-info">
                <div class="general-name">${card.general.name}</div>
                <div class="general-rank">${card.general.rank}</div>
              </div>
            </div>
            <div class="card-body">
              <div class="action-title">${card.title}</div>
              <div class="action-desc">${card.advice}</div>
              <div class="cost-badge" style="position: static; margin-top: 15px; display: inline-block;">🪙 ${card.cost} موارد</div>
            </div>
          `;"""

new_inner_html = """          el.innerHTML = `
            <div class="card-header" style="background: var(--primary-bg); padding: 10px;">
              <img src="${card.general.img}" alt="Avatar" style="width: 50px; height: 50px; border-radius: 6px; object-fit: cover; border: 1px solid #4a5565;">
              <div class="general-info" style="margin-right: 15px; text-align: right; display: flex; flex-direction: column; justify-content: center;">
                <div class="general-name" style="font-size: 15px;">${card.general.name}</div>
                <div class="general-rank" style="font-size: 12px;">${card.general.rank}</div>
              </div>
            </div>
            <div class="card-body">
              <div class="action-title">${card.title}</div>
              <div class="action-desc">${card.advice}</div>
              <div class="cost-badge" style="position: static; margin-top: 15px; display: inline-block;">🛢️ ${card.cost} موارد</div>
            </div>
          `;"""

content = content.replace(old_inner_html, new_inner_html)

with open("index.html", "w", encoding="utf-8") as f:
    f.write(content)
