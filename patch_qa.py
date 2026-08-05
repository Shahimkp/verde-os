import io
import re

path = r'c:\verde studios\verde labs erp\app\workspace\workspace.js'
with io.open(path, 'r', encoding='utf-8') as f:
    js = f.read()

qa_search = """      var items = [
        { label: 'Organization Profile', fn: openOrganizationProfile },
        { label: 'Invite Member', fn: openInviteMember },
        { label: 'Create Department', fn: openCreateDept },
        { label: 'Manage Permissions', fn: openRolesMatrix },
        { label: 'Organization Activity', fn: openActivityModal }
      ];"""

qa_replace = """      var items = [
        { label: 'Create Workspace', fn: window.openCreateWorkspace || function(){} },
        { label: 'Invite Member', fn: openInviteMember },
        { label: 'Upload File', fn: window.uploadFile || function(){} },
        { label: 'Workspace Settings', fn: window.openWorkspaceSettings || function(){} },
        { label: 'Organization Profile', fn: openOrganizationProfile },
        { label: 'Create Department', fn: openCreateDept },
        { label: 'Manage Permissions', fn: openRolesMatrix },
        { label: 'Organization Activity', fn: openActivityModal }
      ];"""

if 'Create Workspace' not in js[js.find('var items = ['):js.find('var items = [') + 600]:
    js = js.replace(qa_search, qa_replace)
    with io.open(path, 'w', encoding='utf-8') as f:
        f.write(js)
    print('Quick Actions dropdown updated successfully.')
else:
    print('Already updated.')
