import re
with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Replace the specific script block with the script src include
html = re.sub(
    r'<script>\s*var currentProjectId = null;.*?</script>\s*</body>',
    '<script src="script.js"></script>\n</body>',
    html,
    flags=re.DOTALL
)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
