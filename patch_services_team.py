import re

with open('app/assets/js/services.js', 'r') as f:
    content = f.read()

# 1. Update the Team object keys and internal functions
new_team_header = """    Team: {
      EMPLOYEES_KEY: 'verde_os_team_employees',
      DEPARTMENTS_KEY: 'verde_os_team_departments',
      ROLES_KEY: 'verde_os_team_roles',
      
      _getStorage: function(key) {
        key = key || this.EMPLOYEES_KEY;
        var raw = localStorage.getItem(key);
        if (!raw) {
          if (key === this.EMPLOYEES_KEY) {
            var initialSeed = [
              { id: 'EMP-0001', firstName: 'Shahim', lastName: '', role: 'CEO', department: 'Executive', email: 'shahim@verdelabs.com', phone: '+1 555-0100', status: 'Active', avatarColor: 'var(--primary)', skills: 'Leadership, Strategy', notes: 'Founder.', joiningDate: '2020-01-01', managerId: '', createdAt: new Date().toISOString() },
              { id: 'EMP-0002', firstName: 'Midhul', lastName: '', role: 'CTO', department: 'Engineering', email: 'midhul@verdelabs.com', phone: '+1 555-0101', status: 'Active', avatarColor: 'var(--success)', skills: 'Architecture, Cloud', notes: 'Core.', joiningDate: '2021-03-15', managerId: 'EMP-0001', createdAt: new Date().toISOString() },
              { id: 'EMP-0003', firstName: 'Ameen', lastName: '', role: 'UI/UX Designer', department: 'Design', email: 'ameen@verdelabs.com', phone: '+1 555-0102', status: 'Active', avatarColor: 'var(--warning)', skills: 'Figma, UI Design', notes: 'Design lead.', joiningDate: '2022-06-10', managerId: 'EMP-0002', createdAt: new Date().toISOString() },
              { id: 'EMP-0004', firstName: 'Nihal', lastName: '', role: 'Marketing Executive', department: 'Marketing', email: 'nihal@verdelabs.com', phone: '+1 555-0103', status: 'On Leave', avatarColor: 'var(--text-3)', skills: 'Campaigns, SEO', notes: 'Out till next week.', joiningDate: '2023-01-05', managerId: 'EMP-0001', createdAt: new Date().toISOString() }
            ];
            localStorage.setItem(key, JSON.stringify(initialSeed));
            return initialSeed;
          } else if (key === this.DEPARTMENTS_KEY) {
             var depsSeed = [
               { id: 'DEP-0001', name: 'Executive', headId: 'EMP-0001', status: 'Active', createdAt: new Date().toISOString() },
               { id: 'DEP-0002', name: 'Engineering', headId: 'EMP-0002', status: 'Active', createdAt: new Date().toISOString() },
               { id: 'DEP-0003', name: 'Design', headId: 'EMP-0003', status: 'Active', createdAt: new Date().toISOString() },
               { id: 'DEP-0004', name: 'Marketing', headId: '', status: 'Active', createdAt: new Date().toISOString() },
               { id: 'DEP-0005', name: 'Sales', headId: '', status: 'Active', createdAt: new Date().toISOString() },
               { id: 'DEP-0006', name: 'HR', headId: '', status: 'Active', createdAt: new Date().toISOString() },
               { id: 'DEP-0007', name: 'Finance', headId: '', status: 'Active', createdAt: new Date().toISOString() },
               { id: 'DEP-0008', name: 'Operations', headId: '', status: 'Active', createdAt: new Date().toISOString() }
             ];
             localStorage.setItem(key, JSON.stringify(depsSeed));
             return depsSeed;
          } else if (key === this.ROLES_KEY) {
             var rolesSeed = [
               { id: 'ROL-0001', name: 'CEO', departmentId: 'DEP-0001', status: 'Active', createdAt: new Date().toISOString() },
               { id: 'ROL-0002', name: 'CTO', departmentId: 'DEP-0002', status: 'Active', createdAt: new Date().toISOString() },
               { id: 'ROL-0003', name: 'Project Manager', departmentId: 'DEP-0008', status: 'Active', createdAt: new Date().toISOString() },
               { id: 'ROL-0004', name: 'Frontend Developer', departmentId: 'DEP-0002', status: 'Active', createdAt: new Date().toISOString() },
               { id: 'ROL-0005', name: 'Backend Developer', departmentId: 'DEP-0002', status: 'Active', createdAt: new Date().toISOString() },
               { id: 'ROL-0006', name: 'UI/UX Designer', departmentId: 'DEP-0003', status: 'Active', createdAt: new Date().toISOString() },
               { id: 'ROL-0007', name: 'HR Executive', departmentId: 'DEP-0006', status: 'Active', createdAt: new Date().toISOString() },
               { id: 'ROL-0008', name: 'Sales Executive', departmentId: 'DEP-0005', status: 'Active', createdAt: new Date().toISOString() },
               { id: 'ROL-0009', name: 'Finance Manager', departmentId: 'DEP-0007', status: 'Active', createdAt: new Date().toISOString() },
               { id: 'ROL-0010', name: 'Marketing Executive', departmentId: 'DEP-0004', status: 'Active', createdAt: new Date().toISOString() }
             ];
             localStorage.setItem(key, JSON.stringify(rolesSeed));
             return rolesSeed;
          }
        }
        try { return JSON.parse(raw); } catch(e) { return []; }
      },
      
      _saveStorage: function(list, key) {
        key = key || this.EMPLOYEES_KEY;
        localStorage.setItem(key, JSON.stringify(list));
      },
      
      _generateId: function(list, prefix) {
        prefix = prefix || 'EMP-';
        let maxId = 0;
        list.forEach(item => {
          if (item.id && item.id.startsWith(prefix)) {
            let num = parseInt(item.id.replace(prefix, ''), 10);
            if (!isNaN(num) && num > maxId) maxId = num;
          }
        });
        const nextId = (maxId + 1).toString().padStart(4, '0');
        return prefix + nextId;
      },"""

# Replace the beginning of Team object
content = re.sub(
    r'    Team: \{.*?_generateId: function\(list\) \{.*?return \'EMP-\' \+ nextId;\n      \},',
    new_team_header,
    content,
    flags=re.DOTALL
)

# 2. Add the new Department and Role methods to Team object, and update getEmployees
new_team_methods = """      
      // -- DEPARTMENTS --
      getDepartments: function() {
        return mockAsyncResponse(this._getStorage(this.DEPARTMENTS_KEY));
      },
      addDepartment: function(data) {
        const list = this._getStorage(this.DEPARTMENTS_KEY);
        const newDep = Object.assign({}, data, {
          id: this._generateId(list, 'DEP-'),
          createdAt: new Date().toISOString()
        });
        list.unshift(newDep);
        this._saveStorage(list, this.DEPARTMENTS_KEY);
        return mockAsyncResponse(newDep);
      },
      updateDepartment: function(id, data) {
        const list = this._getStorage(this.DEPARTMENTS_KEY);
        let found = null;
        for (let i = 0; i < list.length; i++) {
          if (list[i].id === id) {
            list[i] = Object.assign({}, list[i], data);
            list[i].updatedAt = new Date().toISOString();
            found = list[i];
            break;
          }
        }
        if (!found) return Promise.reject(new Error('Department not found'));
        this._saveStorage(list, this.DEPARTMENTS_KEY);
        return mockAsyncResponse(found);
      },
      archiveDepartment: function(id) {
        return this.updateDepartment(id, { status: 'Archived' });
      },

      // -- ROLES --
      getRoles: function() {
        return mockAsyncResponse(this._getStorage(this.ROLES_KEY));
      },
      addRole: function(data) {
        const list = this._getStorage(this.ROLES_KEY);
        const newRole = Object.assign({}, data, {
          id: this._generateId(list, 'ROL-'),
          createdAt: new Date().toISOString()
        });
        list.unshift(newRole);
        this._saveStorage(list, this.ROLES_KEY);
        return mockAsyncResponse(newRole);
      },

      // -- EMPLOYEES --
      getEmployees: function() {
        return mockAsyncResponse(this._getStorage(this.EMPLOYEES_KEY));
      },
      
      getEmployeeById: function(id) {
        const emp = this._getStorage(this.EMPLOYEES_KEY).find(e => e.id === id);
        if (!emp) return Promise.reject(new Error('Employee not found'));
        return mockAsyncResponse(emp);
      },
      
      addEmployee: function(data) {
        const list = this._getStorage(this.EMPLOYEES_KEY);
        const newEmp = Object.assign({}, data, {
          id: this._generateId(list, 'EMP-'),
          createdAt: new Date().toISOString()
        });
        list.unshift(newEmp);
        this._saveStorage(list, this.EMPLOYEES_KEY);
        return mockAsyncResponse(newEmp);
      },
      
      updateEmployee: function(id, data) {
        const list = this._getStorage(this.EMPLOYEES_KEY);
        let found = null;
        for (let i = 0; i < list.length; i++) {
          if (list[i].id === id) {
            list[i] = Object.assign({}, list[i], data);
            list[i].updatedAt = new Date().toISOString();
            found = list[i];
            break;
          }
        }
        if (!found) return Promise.reject(new Error('Employee not found'));
        this._saveStorage(list, this.EMPLOYEES_KEY);
        return mockAsyncResponse(found);
      },
      
      archiveEmployee: function(id) {
        return this.updateEmployee(id, { status: 'Archived' });
      },
      
      restoreEmployee: function(id) {
        return this.updateEmployee(id, { status: 'Active' });
      },
      
      deleteEmployee: function(id) {
        let list = this._getStorage(this.EMPLOYEES_KEY);
        const initialLen = list.length;
        list = list.filter(e => e.id !== id);
        if (list.length === initialLen) return Promise.reject(new Error('Employee not found'));
        this._saveStorage(list, this.EMPLOYEES_KEY);
        return mockAsyncResponse({ success: true });
      },
      
      getOrganizationTree: function() {
        return new Promise((resolve) => {
          const emps = this._getStorage(this.EMPLOYEES_KEY).filter(e => e.status !== 'Archived');
          // Build a map
          const map = {};
          emps.forEach(e => {
             map[e.id] = Object.assign({}, e, { children: [] });
          });
          
          const roots = [];
          emps.forEach(e => {
            if (e.managerId && map[e.managerId]) {
               map[e.managerId].children.push(map[e.id]);
            } else {
               roots.push(map[e.id]);
            }
          });
          
          resolve(roots);
        });
      }"""

content = re.sub(
    r'      getEmployees: function\(\) \{.*?deleteEmployee: function\(id\) \{.*?return mockAsyncResponse\(\{ success: true \}\);\n      \}',
    new_team_methods,
    content,
    flags=re.DOTALL
)

with open('app/assets/js/services.js', 'w') as f:
    f.write(content)
