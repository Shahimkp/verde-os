/* ==========================================================================
   VERDE OS — WORKSPACE MODULE API SIMULATION (PHASE 2)
   Simulates network latency and backend structures for Organization Management
   ========================================================================== */

(function () {
  'use strict';

  var LS_PREFIX = 'verde_api_';

  function delay(ms) { return new Promise(function(resolve) { setTimeout(resolve, ms); }); }
  function load(k) { try { var d = localStorage.getItem(LS_PREFIX + k); return d ? JSON.parse(d) : null; } catch(e) { return null; } }
  function save(k, v) { localStorage.setItem(LS_PREFIX + k, JSON.stringify(v)); }

  var INIT_DATA = {
    organization: {
      id: "ORG-001",
      name: "VERDE LABS",
      industry: "Software & AI Solutions",
      website: "www.verdelabs.co",
      email: "hello@verdelabs.co",
      phone: "+1 (555) 019-2026",
      address: "San Francisco, CA",
      registration: "INC-1984729",
      taxId: "US-99-9999999",
      logo: "",
      branding: {
        primaryColor: "#000000",
        logoRounded: true
      }
    },
    departments: [
      { id: "dept-1", name: "Development", members: ["mem-1", "mem-2", "mem-3", "mem-4"], status: "Active", headId: "mem-1", desc: "Core engineering", activity: 145 },
      { id: "dept-2", name: "Design", members: [], status: "Active", headId: "", desc: "UI/UX", activity: 80 }
    ],
    roles: [
      { id: "role-1", name: "Owner", isDefault: true },
      { id: "role-2", name: "Admin", isDefault: true },
      { id: "role-3", name: "Manager", isDefault: true },
      { id: "role-4", name: "Team Lead", isDefault: true },
      { id: "role-5", name: "Employee", isDefault: true },
      { id: "role-6", name: "Guest", isDefault: true }
    ],
    permissions: {
      "role-1": { CRM: ["View", "Create", "Edit", "Delete", "Manage", "Export"], Workspace: ["View", "Create", "Edit", "Delete", "Manage", "Export"] },
      "role-5": { CRM: ["View"], Workspace: [] }
    },
    members: [
      { id: "mem-1", name: "Shahim", email: "shahim@verdelabs.co", roleId: "role-1", deptId: "dept-1", status: "Active", joined: "2023-01-15", lastActive: "Just now", avatar: "" },
      { id: "mem-2", name: "Midhul", email: "midhul@verdelabs.co", roleId: "role-2", deptId: "dept-1", status: "Active", joined: "2023-03-22", lastActive: "2 hours ago", avatar: "" },
      { id: "mem-3", name: "Ameen", email: "ameen@verdelabs.co", roleId: "role-3", deptId: "dept-1", status: "Pending", joined: "-", lastActive: "Never", avatar: "" },
      { id: "mem-4", name: "Nihal", email: "nihal@verdelabs.co", roleId: "role-4", deptId: "dept-1", status: "Suspended", joined: "2024-05-10", lastActive: "1 week ago", avatar: "" }
    ],
    activity: [
      { id: "act-1", type: "Workspace Updated", desc: "Updated Organization Profile", user: "Shahim", timestamp: "2026-08-04T10:30:00Z" }
    ],
    integrations: [
      { id: "int-1", name: "Google Workspace", status: "Connected", apiKey: "gw-****" },
      { id: "int-6", name: "Microsoft 365", status: "Not Connected", apiKey: "" }
    ]
  };

  // Seed DB
  var tables = ['organization', 'departments', 'roles', 'permissions', 'members', 'activity', 'integrations'];
  tables.forEach(function(t) { if(!load(t)) save(t, INIT_DATA[t]); });

  function logActivity(type, desc, user) {
    var acts = load('activity') || [];
    acts.unshift({
      id: 'act-' + Date.now(),
      type: type,
      desc: desc,
      user: user || 'Shahim',
      timestamp: new Date().toISOString()
    });
    save('activity', acts);
  }

  // Define API Endpoints
  window.WorkspaceAPI = {
    // Organization
    getOrganization: function() { return delay(150).then(function() { return load('organization'); }); },
    updateOrganization: function(data) {
      return delay(300).then(function() {
        save('organization', data);
        logActivity('Workspace Updated', 'Organization profile was updated');
        return data;
      });
    },

    // Members
    getMembers: function() { return delay(150).then(function() { return load('members') || []; }); },
    saveMember: function(member) {
      return delay(300).then(function() {
        var ms = load('members') || [];
        var idx = ms.findIndex(function(m) { return m.id === member.id; });
        if(idx > -1) { ms[idx] = member; logActivity('Member Updated', 'Updated details for ' + member.email); }
        else {
          member.id = 'mem-' + Date.now();
          member.joined = '-';
          member.lastActive = 'Never';
          member.status = 'Pending';
          ms.push(member);
          logActivity('Members Added', 'Invited ' + member.email);
        }
        save('members', ms);
        return member;
      });
    },
    suspendMember: function(id) {
      return delay(300).then(function() {
        var ms = load('members') || [];
        var m = ms.find(function(x) { return x.id === id; });
        if(m) { m.status = 'Suspended'; save('members', ms); logActivity('Role Changed', 'Suspended ' + m.email); }
      });
    },
    restoreMember: function(id) {
      return delay(300).then(function() {
        var ms = load('members') || [];
        var m = ms.find(function(x) { return x.id === id; });
        if(m) { m.status = 'Active'; save('members', ms); logActivity('Role Changed', 'Restored ' + m.email); }
      });
    },
    deleteMember: function(id) {
      return delay(300).then(function() {
        var ms = load('members') || [];
        var m = ms.find(function(x) { return x.id === id; });
        if(m) {
          save('members', ms.filter(function(x) { return x.id !== id; }));
          logActivity('Members Removed', 'Removed ' + m.email);
        }
      });
    },

    // Departments
    getDepartments: function() { return delay(150).then(function() { return load('departments') || []; }); },
    saveDepartment: function(dept) {
      return delay(300).then(function() {
        var ds = load('departments') || [];
        var idx = ds.findIndex(function(d) { return d.id === dept.id; });
        if(idx > -1) { ds[idx] = dept; logActivity('Department Updated', 'Updated ' + dept.name); }
        else {
          dept.id = 'dept-' + Date.now();
          ds.push(dept);
          logActivity('Department Created', 'Created ' + dept.name);
        }
        save('departments', ds);
        return dept;
      });
    },
    deleteDepartment: function(id) {
      return delay(300).then(function() {
        var ds = load('departments') || [];
        var d = ds.find(function(x) { return x.id === id; });
        if(d) {
          save('departments', ds.filter(function(x) { return x.id !== id; }));
          logActivity('Department Deleted', 'Deleted ' + d.name);
        }
      });
    },

    // Roles & Permissions
    getRoles: function() { return delay(150).then(function() { return load('roles') || []; }); },
    getPermissions: function() { return delay(150).then(function() { return load('permissions') || {}; }); },
    saveRole: function(role, perms) {
      return delay(300).then(function() {
        var rs = load('roles') || [];
        var ps = load('permissions') || {};
        if(!role.id) { role.id = 'role-' + Date.now(); rs.push(role); logActivity('Role Created', 'Created role ' + role.name); }
        else {
          var idx = rs.findIndex(function(r) { return r.id === role.id; });
          if(idx > -1) rs[idx] = role;
          logActivity('Role Changed', 'Updated role ' + role.name);
        }
        ps[role.id] = perms || {};
        save('roles', rs);
        save('permissions', ps);
      });
    },

    // Activity
    getActivity: function() { return delay(150).then(function() { return load('activity') || []; }); },

    // Integrations
    getIntegrations: function() { return delay(150).then(function() { return load('integrations') || []; }); },
    saveIntegrations: function(data) {
      return delay(300).then(function() {
        save('integrations', data);
        logActivity('Integration Connected', 'Updated integrations');
      });
    }
  };

})();
