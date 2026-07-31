import re

def update_css():
    with open('index.html', 'r', encoding='utf-8') as f:
        html = f.read()

    # 1. crm-kpi-card
    html = re.sub(
        r'\.crm-kpi-card\s*\{[^}]*\}',
        '''.crm-kpi-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      box-shadow: var(--shadow-sm);
      transition: box-shadow 250ms ease, transform 250ms ease, border-color 250ms ease;
    }''',
        html
    )

    # 2. crm-kpi-card:hover
    html = re.sub(
        r'\.crm-kpi-card:hover\s*\{[^}]*\}',
        '''.crm-kpi-card:hover {
      box-shadow: var(--shadow-md);
      transform: translateY(-1px);
    }''',
        html
    )

    # 3. crm-kanban-col
    html = re.sub(
        r'\.crm-kanban-col\s*\{[^}]*\}',
        '''.crm-kanban-col {
      flex: 0 0 320px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      box-shadow: var(--shadow-sm);
    }''',
        html
    )

    # 4. crm-kanban-card
    html = re.sub(
        r'\.crm-kanban-card\s*\{[^}]*\}',
        '''.crm-kanban-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 20px;
      box-shadow: var(--shadow-sm);
      cursor: grab;
      transition: transform 250ms ease, box-shadow 250ms ease, border-color 250ms ease;
    }''',
        html
    )

    # 5. crm-kanban-card:hover
    html = re.sub(
        r'\.crm-kanban-card:hover\s*\{[^}]*\}',
        '''.crm-kanban-card:hover {
      box-shadow: var(--shadow-md);
      transform: translateY(-1px);
    }''',
        html
    )

    # 6. crm-table-container
    html = re.sub(
        r'\.crm-table-container\s*\{[^}]*\}',
        '''.crm-table-container {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 16px;
      box-shadow: var(--shadow-sm);
      overflow: hidden;
    }''',
        html
    )

    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(html)

if __name__ == '__main__':
    update_css()
