import sys

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

story_text = '''    // ===== STORY =====
    const STORY = [
      'القيادة العليا تعتمد عليك.<br>العدو يبني قواعد سرية في هذه المنطقة.<br>لديك ' + G.health + ' نقاط صحة، و ' + G.resources + ' موارد.<br><br><span>مهمتك: اكتشف موقع العدو ودمر قاعدته قبل أن يدمر قاعدتك.</span>',
    ];

    // ===== INIT ====='''
    
content = content.replace('    // ===== INIT =====', story_text)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)
