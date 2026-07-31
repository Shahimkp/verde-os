import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Update .crm-kanban-col
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
      height: 700px;
      max-height: calc(100vh - 220px);
    }

    .crm-kanban-cards-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 16px;
      overflow-y: auto;
      min-height: 0;
      padding-right: 4px;
      padding-bottom: 8px;
    }

    /* Custom thin scrollbar for pipeline columns */
    .crm-kanban-cards-container::-webkit-scrollbar {
      width: 6px;
    }
    .crm-kanban-cards-container::-webkit-scrollbar-track {
      background: #F1F5F9;
      border-radius: 8px;
    }
    .crm-kanban-cards-container::-webkit-scrollbar-thumb {
      background: var(--primary);
      border-radius: 8px;
    }
    .crm-kanban-cards-container::-webkit-scrollbar-thumb:hover {
      background: var(--primary-hover, #000080);
    }''',
    html
)

# 2. Strip inline styles from <div class="crm-kanban-cards-container"
html = re.sub(
    r'(<div class="crm-kanban-cards-container"[^>]*)style="[^"]*"',
    r'\1',
    html
)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
