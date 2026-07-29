import os

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

target = '''    function executeResourceRaid(consequenceType) {
      playActionAnimation('raid', '🚁 تنفيذ غارة...', () => {
        let pros = []; let cons = []; let story = ""; let title = "";
        if (Math.random() < 0.85) {'''

replacement = '''    function executeResourceRaid(consequenceType) {
      playActionAnimation('raid', '🚁 تنفيذ غارة...', () => {
        let pros = []; let cons = []; let story = ""; let title = "";
        let isSuccess = false;
        if (Math.random() < 0.85) {
          isSuccess = true;'''

target2 = '''            cons.push('القوة الغازية تركت أثراً فرفع العدو من جاهزيته');
          }
        }
        showResultModal(title, story, pros, cons, () => { endPlayerTurn(); });
        updateUI();
      });
    }'''

replacement2 = '''            cons.push('القوة الغازية تركت أثراً فرفع العدو من جاهزيته');
          }
        }
        showResultModal(title, story, pros, cons, () => { checkBanterAndEndTurn('raid', isSuccess); });
        updateUI();
      });
    }'''

if target in html and target2 in html:
    html = html.replace(target, replacement)
    html = html.replace(target2, replacement2)
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(html)
    print("Success")
else:
    print("Failed to find targets.")
