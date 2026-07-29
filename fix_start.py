import sys

with open('index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
skip = False
for i, line in enumerate(lines):
    # i is 0-indexed, so line 2371 is i=2370, line 2390 is i=2389
    if 2370 <= i <= 2389:
        if i == 2370:
            new_lines.append('      el.innerHTML = STORY[0];\n')
        continue
    new_lines.append(line)

with open('index.html', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
