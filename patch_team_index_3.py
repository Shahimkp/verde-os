import re

with open('app/team/index.html', 'r') as f:
    content = f.read()

# 1. Add Tabs and Wrap Directory
tabs_html = """
          <!-- Tabs Navigation -->
          <div style="border-bottom:1px solid var(--border); margin-bottom:32px; display:flex; gap:32px;">
            <div class="team-tab active" data-tab="directory" style="padding-bottom:12px; cursor:pointer; font-size:14px; font-weight:700; color:var(--primary); border-bottom:2px solid var(--primary);">Directory</div>
            <div class="team-tab" data-tab="departments" style="padding-bottom:12px; cursor:pointer; font-size:14px; font-weight:600; color:var(--text-3); border-bottom:2px solid transparent;">Departments</div>
            <div class="team-tab" data-tab="organization" style="padding-bottom:12px; cursor:pointer; font-size:14px; font-weight:600; color:var(--text-3); border-bottom:2px solid transparent;">Organization</div>
          </div>

          <!-- TAB: DIRECTORY -->
          <div id="tab-directory" class="team-tab-content">
            <!-- Advanced Filters Panel -->"""

content = re.sub(r'<!-- Advanced Filters Panel -->', tabs_html, content, count=1)

# End the directory tab and add the other two tabs
closing_directory_and_other_tabs = """                </tbody>
              </table>
            </div>
          </section>
          </div> <!-- End Tab: Directory -->

          <!-- TAB: DEPARTMENTS -->
          <div id="tab-departments" class="team-tab-content" style="display:none;">
            <div class="team-section-header" style="margin-bottom:24px;">
              <h2 class="team-section-title">Departments</h2>
              <button class="btn btn-primary" id="btn-create-department">+ Add Department</button>
            </div>
            <div class="team-dir-grid" id="departments-grid-container">
              <!-- Rendered dynamically -->
            </div>
          </div>

          <!-- TAB: ORGANIZATION -->
          <div id="tab-organization" class="team-tab-content" style="display:none;">
            <div class="team-section-header" style="margin-bottom:24px;">
              <h2 class="team-section-title">Organization Structure</h2>
            </div>
            <div style="background:var(--surface); border:1px solid var(--border); border-radius:16px; padding:32px; box-shadow:var(--shadow-sm); overflow-x:auto;">
              <div id="org-tree-container" class="org-tree">
                <!-- Rendered dynamically -->
              </div>
            </div>
          </div>
"""

content = re.sub(
    r'                </tbody>\s*</table>\s*</div>\s*</section>',
    closing_directory_and_other_tabs,
    content
)

# 2. Update Employee Modal
employee_modal_replacements = """
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:24px;">
          <div class="form-group">
            <label class="form-label" style="font-weight:700; font-size:12px; color:var(--text-3); text-transform:uppercase;">Department</label>
            <select class="form-select" id="selEmpDept" style="width:100%; border:1px solid var(--border); border-radius:8px; padding:12px 16px; outline:none; background:var(--bg) url('data:image/svg+xml;utf8,<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"></path></svg>') no-repeat right 16px center; background-size:14px; appearance:none;">
              <!-- Populated dynamically -->
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" style="font-weight:700; font-size:12px; color:var(--text-3); text-transform:uppercase;">Role</label>
            <select class="form-select" id="inpEmpRole" style="width:100%; border:1px solid var(--border); border-radius:8px; padding:12px 16px; outline:none; background:var(--bg) url('data:image/svg+xml;utf8,<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"></path></svg>') no-repeat right 16px center; background-size:14px; appearance:none;">
              <!-- Populated dynamically -->
            </select>
          </div>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:24px;">
          <div class="form-group">
            <label class="form-label" style="font-weight:700; font-size:12px; color:var(--text-3); text-transform:uppercase;">Reports To (Manager)</label>
            <select class="form-select" id="selEmpManager" style="width:100%; border:1px solid var(--border); border-radius:8px; padding:12px 16px; outline:none; background:var(--bg) url('data:image/svg+xml;utf8,<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"></path></svg>') no-repeat right 16px center; background-size:14px; appearance:none;">
              <option value="">None</option>
              <!-- Populated dynamically -->
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" style="font-weight:700; font-size:12px; color:var(--text-3); text-transform:uppercase;">Joining Date</label>
            <input type="date" class="form-input" id="inpEmpJoiningDate" style="width:100%; border:1px solid var(--border); border-radius:8px; padding:12px 16px; outline:none; transition:border-color 0.2s;" />
          </div>
        </div>
"""

content = re.sub(
    r'<div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:24px;">\s*<div class="form-group">\s*<label class="form-label" style="font-weight:700; font-size:12px; color:var\(--text-3\); text-transform:uppercase;">Department</label>.*?<div class="form-group">\s*<label class="form-label" style="font-weight:700; font-size:12px; color:var\(--text-3\); text-transform:uppercase;">Role</label>.*?</div>\s*</div>',
    employee_modal_replacements,
    content,
    flags=re.DOTALL
)

# 3. Add Department Modal right before Employee Modal
department_modal = """
  <!-- Create/Edit Department Modal -->
  <div class="modal-backdrop" id="create-dep-modal" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:2000; align-items:center; justify-content:center; backdrop-filter:blur(4px);">
    <div class="modal-container" style="background:var(--surface); width:500px; max-width:95vw; border-radius:16px; box-shadow:var(--shadow-xl); animation:fadeUp 0.3s ease; display:flex; flex-direction:column; overflow:hidden;">
      <div style="padding:24px 32px; border-bottom:1px solid var(--border); background:var(--surface); display:flex; justify-content:space-between; align-items:center;">
        <h3 style="font-size:20px; font-weight:800; color:var(--text-1); margin:0;" id="dep-modal-title">Add Department</h3>
        <button class="btn btn-ghost" onclick="document.getElementById('create-dep-modal').style.display='none'" style="padding:6px; border-radius:50%; background:var(--bg); border:1px solid var(--border);">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
      <div style="padding:32px;">
        <div class="form-group" style="margin-bottom:24px;">
          <label class="form-label" style="font-weight:700; font-size:12px; color:var(--text-3); text-transform:uppercase;">Department Name</label>
          <input type="text" class="form-input" id="inpDepName" placeholder="e.g. Engineering" style="width:100%; border:1px solid var(--border); border-radius:8px; padding:12px 16px; outline:none;" />
        </div>
        <div class="form-group" style="margin-bottom:24px;">
          <label class="form-label" style="font-weight:700; font-size:12px; color:var(--text-3); text-transform:uppercase;">Department Head</label>
          <select class="form-select" id="selDepHead" style="width:100%; border:1px solid var(--border); border-radius:8px; padding:12px 16px; outline:none; background:var(--bg) url('data:image/svg+xml;utf8,<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"></path></svg>') no-repeat right 16px center; background-size:14px; appearance:none;">
            <option value="">None</option>
          </select>
        </div>
      </div>
      <div style="padding:24px 32px; border-top:1px solid var(--border); background:var(--surface); display:flex; justify-content:flex-end; gap:12px;">
        <button class="btn btn-ghost" onclick="document.getElementById('create-dep-modal').style.display='none'" style="border:1px solid var(--border);">Cancel</button>
        <button class="btn btn-primary" id="btn-save-dep">Save Department</button>
      </div>
    </div>
  </div>

  <!-- Create/Edit Employee Modal -->"""

content = re.sub(r'<!-- Create/Edit Employee Modal -->', department_modal, content)


# Add some extra CSS for Org Tree
css_to_add = """
    /* Org Tree */
    .org-tree {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .org-node {
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 16px;
      background: var(--bg);
      display: flex;
      align-items: center;
      gap: 16px;
      cursor: pointer;
      user-select: none;
      transition: background 0.2s, border-color 0.2s;
    }
    .org-node:hover {
      background: var(--bg-2);
      border-color: var(--border-subtle);
    }
    .org-node-children {
      padding-left: 48px;
      margin-top: 8px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      position: relative;
    }
    .org-node-children::before {
      content: '';
      position: absolute;
      left: 24px;
      top: 0;
      bottom: 24px;
      width: 2px;
      background: var(--border);
    }
    .org-child-wrapper {
      position: relative;
    }
    .org-child-wrapper::before {
      content: '';
      position: absolute;
      left: -24px;
      top: 24px;
      width: 24px;
      height: 2px;
      background: var(--border);
    }
  </style>"""

content = content.replace('  </style>', css_to_add)

with open('app/team/index.html', 'w') as f:
    f.write(content)
