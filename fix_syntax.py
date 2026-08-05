import io
import re

path = r'c:\verde studios\verde labs erp\app\workspace\workspace.js'
with io.open(path, 'r', encoding='utf-8') as f:
    js = f.read()

# Replace any onclick="..." where the inside has single quotes, 
# but be careful not to break the JS string wrapper itself.
# In JS, the wrapper is single quotes, e.g. '<button onclick="foo(\'bar\')">'
# So inside the double quotes of onclick, we must have backslash-escaped single quotes.
# Example: onclick="window._ws.closeModal('ws-m-profile')" -> onclick="window._ws.closeModal(\\'ws-m-profile\\')"

def escape_quotes_in_onclick(match):
    # match.group(1) is the inner content of onclick="..."
    inner = match.group(1)
    # If it contains single quotes that aren't preceded by backslash, escape them
    inner = re.sub(r"(?<!\\)'", r"\\'", inner)
    return f'onclick="{inner}"'

js = re.sub(r'onclick="([^"]*?)"', escape_quotes_in_onclick, js)

with io.open(path, 'w', encoding='utf-8') as f:
    f.write(js)
print("Syntax errors in onclick attributes patched.")
