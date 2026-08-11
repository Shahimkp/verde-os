/* ==========================================================================
   VERDE OS — UNIFIED REST API SERVICE LAYER (SPRING BOOT TARGET)
   Async Promise Services mapped to REST API Endpoints
   ========================================================================== */

(function () {
  'use strict';

  function mockAsyncResponse(data, delayMs) {
    delayMs = delayMs || 150;
    return new Promise(function (resolve) {
      setTimeout(function () {
        resolve(data);
      }, delayMs);
    });
  }

  window.VerdeServices = {

    // 0. NOTIFICATIONS SERVICE (LOCAL STORAGE BACKED)
    Notifications: {
      STORAGE_KEY: 'verde_os_notifications',

      _getStorage: function () {
        var raw = localStorage.getItem(this.STORAGE_KEY);
        if (!raw) {
          var initialSeed = [];
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(initialSeed));
          return initialSeed;
        }
        try { return JSON.parse(raw); } catch (e) { return []; }
      },

      _saveStorage: function (list) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(list));
        if (window.updateNotificationUI) window.updateNotificationUI();
      },

      getNotifications: function () {
        return mockAsyncResponse(this._getStorage());
      },

      addNotification: function (title, desc) {
        var list = this._getStorage();
        var newNotif = {
          id: 'NOTIF-' + Date.now(),
          title: title,
          desc: desc,
          read: false,
          createdAt: new Date().toISOString()
        };
        list.unshift(newNotif);
        this._saveStorage(list);
        return mockAsyncResponse(newNotif);
      },

      markAsRead: function (id) {
        var list = this._getStorage();
        if (id) {
          for (var i = 0; i < list.length; i++) {
            if (list[i].id === id) list[i].read = true;
          }
        } else {
          for (var i = 0; i < list.length; i++) list[i].read = true;
        }
        this._saveStorage(list);
        return mockAsyncResponse({ success: true });
      },

      clearAll: function () {
        this._saveStorage([]);
        return mockAsyncResponse({ success: true });
      }
    },

    // 1. AUTHENTICATION SERVICE (POST /api/v1/auth)
    Auth: {
      login: function (email, password) {
        var user = window.VerdeMockData ? window.VerdeMockData.user : { name: 'Shahim', email: email };
        return mockAsyncResponse({ token: 'mock-jwt-token-verde-labs', user: user });
      },
      logout: function () {
        return mockAsyncResponse({ success: true });
      },
      getCurrentUser: function () {
        return mockAsyncResponse(window.VerdeMockData ? window.VerdeMockData.user : null);
      }
    },

    // 2. CRM SERVICE (LOCAL STORAGE BACKED REST TARGET: /api/v1/crm)
    Crm: {
      LEADS_KEY: 'verde_os_crm_leads',
      CLIENTS_KEY: 'verde_os_crm_clients',

      _getLeadsStorage: function () {
        var raw = localStorage.getItem(this.LEADS_KEY);
        if (!raw) {
          var initialSeed = [
            { id: 'LD-001', name: 'Sarah Jenkins', company: 'Vertex Systems', email: 'sarah@vertex.com', phone: '+1 555-0101', source: 'Website', priority: 'High', status: 'New Lead', value: 850000, assignedTo: 'Shahim', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), notes: [], meetings: [], activities: [{ id: 'ACT-' + Date.now(), action: 'Lead Created', details: 'Lead originated from Website.', user: 'System', date: new Date().toISOString() }] },
            { id: 'LD-002', name: 'David Chen', company: 'Vertex Systems', email: 'david@vertex.com', phone: '+1 555-0102', source: 'Referral', priority: 'Medium', status: 'New Lead', value: 1200000, assignedTo: 'Nihal', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), notes: [], meetings: [], activities: [] },
            { id: 'LD-003', name: 'Marcus Thorne', company: 'GreenLeaf', email: 'marcus@greenleaf.com', phone: '+1 555-0201', source: 'Outbound', priority: 'High', status: 'Qualified', value: 2400000, assignedTo: 'Shahim', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), notes: [], meetings: [], activities: [] },
            { id: 'LD-004', name: 'Elena Rodriguez', company: 'Cabo Travels', email: 'elena@cabo.com', phone: '+1 555-0301', source: 'Event', priority: 'Medium', status: 'Proposal Sent', value: 1550000, assignedTo: 'Midhul', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), notes: [], meetings: [], activities: [] },
            { id: 'LD-005', name: 'Michael Chang', company: 'BlueWave Tech', email: 'michael@bluewave.com', phone: '+1 555-0401', source: 'Partner', priority: 'High', status: 'Negotiation', value: 3200000, assignedTo: 'Shahim', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), notes: [], meetings: [], activities: [] }
          ];
          localStorage.setItem(this.LEADS_KEY, JSON.stringify(initialSeed));
          return initialSeed;
        }
        try { return JSON.parse(raw); } catch (e) { return []; }
      },

      _getClientsStorage: function () {
        var raw = localStorage.getItem(this.CLIENTS_KEY);
        if (!raw) {
          var initialSeed = [
            { id: 'CLI-001', company: 'Cabo Travels', contactPerson: 'Elena Rodriguez', email: 'elena@cabo.com', phone: '+1 555-0301', industry: 'Travel & Hospitality', status: 'Active', revenue: 4500000, projects: ['PRJ-001'], notes: [], activities: [{ id: 'ACT-' + Date.now(), action: 'Client Created', details: 'Client onboarded.', user: 'System', date: new Date().toISOString() }] },
            { id: 'CLI-002', company: 'GreenLeaf', contactPerson: 'Marcus Thorne', email: 'marcus@greenleaf.com', phone: '+1 555-0201', industry: 'Agriculture', status: 'Active', revenue: 2800000, projects: ['PRJ-002'], notes: [], activities: [] },
            { id: 'CLI-003', company: 'BlueWave Tech', contactPerson: 'Michael Chang', email: 'michael@bluewave.com', phone: '+1 555-0401', industry: 'Software', status: 'Active', revenue: 6200000, projects: ['PRJ-003'], notes: [], activities: [] },
            { id: 'CLI-004', company: 'Vertex Systems', contactPerson: 'Sarah Jenkins', email: 'sarah@vertex.com', phone: '+1 555-0101', industry: 'Manufacturing', status: 'Active', revenue: 3400000, projects: ['PRJ-004'], notes: [], activities: [] }
          ];
          localStorage.setItem(this.CLIENTS_KEY, JSON.stringify(initialSeed));
          return initialSeed;
        }
        try { return JSON.parse(raw); } catch (e) { return []; }
      },

      _saveLeads: function(list) { localStorage.setItem(this.LEADS_KEY, JSON.stringify(list)); },
      _saveClients: function(list) { localStorage.setItem(this.CLIENTS_KEY, JSON.stringify(list)); },

      getLeads: function () {
        var list = this._getLeadsStorage().filter(function(l) { return !l.isDeleted; });
        return mockAsyncResponse(list);
      },
      
      getLeadById: function(id) {
        var list = this._getLeadsStorage();
        var match = list.filter(function (l) { return l.id === id && !l.isDeleted; })[0];
        return mockAsyncResponse(match || null);
      },

      createLead: function (data) {
        var list = this._getLeadsStorage();
        var now = new Date().toISOString();
        var newLead = {
          id: data.id || ('LD-' + Math.floor(1000 + Math.random() * 9000)),
          name: data.name || 'Unknown',
          company: data.company || 'Unknown',
          email: data.email || '',
          phone: data.phone || '',
          source: data.source || 'Direct',
          priority: data.priority || 'Medium',
          status: data.status || 'New Lead',
          value: parseFloat(data.value || 0),
          assignedTo: data.assignedTo || 'Unassigned',
          createdAt: now,
          updatedAt: now,
          notes: data.notes || [],
          meetings: data.meetings || [],
          activities: data.activities || [{ id: 'ACT-' + Date.now(), action: 'Lead Created', details: 'Added to CRM.', user: window.VerdeMockData ? window.VerdeMockData.user.name : 'System', date: now }]
        };
        list.unshift(newLead);
        this._saveLeads(list);
        if (window.VerdeToast) window.VerdeToast.success('Lead Created');
        return mockAsyncResponse(newLead);
      },

      updateLead: function (id, data) {
        var list = this._getLeadsStorage();
        for (var i = 0; i < list.length; i++) {
          if (list[i].id === id) {
            var statusChanged = data.status && data.status !== list[i].status;
            for (var k in data) {
              if (data.hasOwnProperty(k)) list[i][k] = data[k];
            }
            if (statusChanged) {
              list[i].activities = list[i].activities || [];
              list[i].activities.unshift({
                id: 'ACT-' + Date.now(),
                action: 'Stage Changed',
                details: 'Lead moved to ' + data.status,
                date: new Date().toISOString(),
                user: window.VerdeMockData ? window.VerdeMockData.user.name : 'System'
              });
            }
            list[i].updatedAt = new Date().toISOString();
            this._saveLeads(list);
            return mockAsyncResponse(list[i]);
          }
        }
        return mockAsyncResponse(null);
      },

      deleteLead: function(id) {
        var list = this._getLeadsStorage();
        for (var i = 0; i < list.length; i++) {
          if (list[i].id === id) {
            list[i].isDeleted = true;
            list[i].updatedAt = new Date().toISOString();
            this._saveLeads(list);
            return mockAsyncResponse({success: true});
          }
        }
        return mockAsyncResponse(null);
      },

      convertLead: function(id) {
        var self = this;
        return this.getLeadById(id).then(function(lead) {
          if (!lead) return null;
          
          var clientData = {
            company: lead.company,
            contactPerson: lead.name,
            email: lead.email,
            phone: lead.phone,
            industry: 'Other',
            status: 'Active',
            revenue: lead.value,
            leadId: lead.id,
            notes: JSON.parse(JSON.stringify(lead.notes || [])),
            meetings: JSON.parse(JSON.stringify(lead.meetings || [])),
            activities: JSON.parse(JSON.stringify(lead.activities || [])),
            proposals: JSON.parse(JSON.stringify(lead.proposals || []))
          };
          
          return self.createClient(clientData).then(function(client) {
            var newActivities = lead.activities || [];
            newActivities.push({
              id: 'ACT-' + Date.now(),
              action: 'Lead Converted',
              details: 'Converted to client ' + client.company,
              user: window.VerdeMockData ? window.VerdeMockData.user.name : 'System',
              date: new Date().toISOString()
            });

            return self.updateLead(id, {
              status: 'Won',
              clientId: client.id,
              activities: newActivities
            }).then(function() {
              if (window.VerdeToast) window.VerdeToast.success('Lead Converted to Client!');
              return { lead: lead, client: client };
            });
          });
        });
      },

      getClients: function () {
        var list = this._getClientsStorage().filter(function(c) { return !c.isDeleted; });
        return mockAsyncResponse(list);
      },

      getClientById: function(id) {
        var list = this._getClientsStorage();
        var match = list.filter(function (c) { return c.id === id && !c.isDeleted; })[0];
        return mockAsyncResponse(match || null);
      },

      createClient: function (data) {
        var list = this._getClientsStorage();
        var now = new Date().toISOString();
        var newClient = {
          id: data.id || ('CLI-' + Math.floor(1000 + Math.random() * 9000)),
          company: data.company || 'Unknown',
          contactPerson: data.contactPerson || 'Unknown',
          email: data.email || '',
          phone: data.phone || '',
          industry: data.industry || 'Other',
          status: data.status || 'Active',
          revenue: parseFloat(data.revenue || 0),
          projects: data.projects || [],
          leadId: data.leadId || null,
          createdAt: now,
          updatedAt: now,
          notes: data.notes || [],
          meetings: data.meetings || [],
          proposals: data.proposals || [],
          activities: data.activities || [{ id: 'ACT-' + Date.now(), action: 'Client Created', details: 'Added to CRM.', user: window.VerdeMockData ? window.VerdeMockData.user.name : 'System', date: now }]
        };
        list.unshift(newClient);
        this._saveClients(list);
        return mockAsyncResponse(newClient);
      },

      updateClient: function(id, data) {
        var list = this._getClientsStorage();
        for (var i = 0; i < list.length; i++) {
          if (list[i].id === id) {
            for (var k in data) {
              if (data.hasOwnProperty(k)) list[i][k] = data[k];
            }
            list[i].updatedAt = new Date().toISOString();
            this._saveClients(list);
            return mockAsyncResponse(list[i]);
          }
        }
        return mockAsyncResponse(null);
      },

      deleteClient: function(id) {
        var list = this._getClientsStorage();
        for (var i = 0; i < list.length; i++) {
          if (list[i].id === id) {
            list[i].isDeleted = true;
            list[i].updatedAt = new Date().toISOString();
            this._saveClients(list);
            return mockAsyncResponse({success: true});
          }
        }
        return mockAsyncResponse(null);
      }
    },

    // 3. PROJECTS SERVICE (LOCAL STORAGE BACKED REST TARGET: /api/v1/projects)
    Projects: {
      STORAGE_KEY: 'verde_os_projects',

      _getStorage: function () {
        var raw = localStorage.getItem(this.STORAGE_KEY);
        if (!raw) {
          var initialSeed = (window.VerdeMockData && window.VerdeMockData.projects) ? window.VerdeMockData.projects : [
            { id: 'PRJ-001', name: 'Cabo Travels Website', client: 'Cabo Travels', category: 'Website Development', progress: 65, status: 'Active', priority: 'High', dueDate: '2026-08-30', budget: 45000, team: ['SH', 'MI'], createdAt: '2026-07-01T10:00:00Z', updatedAt: '2026-07-28T14:30:00Z' },
            { id: 'PRJ-002', name: 'GreenLeaf Branding', client: 'GreenLeaf', category: 'Brand Development', progress: 30, status: 'Active', priority: 'Medium', dueDate: '2026-09-15', budget: 28000, team: ['NH'], createdAt: '2026-07-05T09:00:00Z', updatedAt: '2026-07-25T11:20:00Z' },
            { id: 'PRJ-003', name: 'BlueWave CRM Portal', client: 'BlueWave Tech', category: 'ERP Development', progress: 85, status: 'At Risk', priority: 'Critical', dueDate: '2026-08-05', budget: 62000, team: ['SH', 'NH', 'MI'], createdAt: '2026-06-15T12:00:00Z', updatedAt: '2026-07-29T16:45:00Z' },
            { id: 'PRJ-004', name: 'Vertex Systems API', client: 'Vertex Systems', category: 'Infrastructure API', progress: 100, status: 'Completed', priority: 'High', dueDate: '2026-07-25', budget: 34000, team: ['MI'], createdAt: '2026-05-10T08:00:00Z', updatedAt: '2026-07-25T17:00:00Z' }
          ];
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(initialSeed));
          return initialSeed;
        }
        try { return JSON.parse(raw); } catch (e) { return []; }
      },

      _saveStorage: function (list) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(list));
      },

      getProjects: function (options) {
        options = options || {};
        var list = this._getStorage();
        
        var filtered = list.filter(function (p) {
          if (p.isDeleted) return false;
          if (p.isArchived && !options.includeArchived) return false;
          return true;
        });

        // Newest first by createdAt or order
        var sorted = filtered.sort(function (a, b) {
          var tA = new Date(a.createdAt || 0).getTime();
          var tB = new Date(b.createdAt || 0).getTime();
          return tB - tA;
        });
        return mockAsyncResponse(sorted);
      },

      getProjectById: function (id) {
        var list = this._getStorage();
        var match = list.filter(function (p) { return p.id === id && !p.isDeleted; })[0];
        return mockAsyncResponse(match || null);
      },

      createProject: function (projectData) {
        var list = this._getStorage();
        var now = new Date().toISOString();

        var newProj = {
          id: projectData.id || ('PRJ-' + Math.floor(1000 + Math.random() * 9000)),
          name: projectData.name || 'Untitled Project',
          client: projectData.client || 'Internal',
          category: projectData.category || 'Web Development',
          priority: projectData.priority || 'Medium',
          status: projectData.isDraft ? 'Draft' : (projectData.status || 'Active'),
          startDate: projectData.startDate || now.split('T')[0],
          dueDate: projectData.dueDate || '',
          budget: parseFloat(projectData.budget || 0),
          team: projectData.team || ['SH', 'MI'],
          deliverables: projectData.deliverables || '',
          notes: projectData.notes || '',
          progress: projectData.isDraft ? 0 : (projectData.progress || 0),
          isDraft: !!projectData.isDraft,
          milestones: projectData.milestones || [],
          activities: projectData.activities || [{ id: 'ACT-' + Date.now(), action: 'Project Created', details: 'Project initialized in VERDE OS.', date: now, user: 'Shahim' }],
          files: projectData.files || [],
          internalNotes: projectData.internalNotes || [],
          detailedTeam: projectData.detailedTeam || (projectData.team || ['SH', 'MI']).map(function(m) { return { id: m, role: 'Member', workload: 'Normal' }; }),
          createdAt: now,
          updatedAt: now
        };

        list.unshift(newProj);
        this._saveStorage(list);

        if (window.VerdeState) {
          window.VerdeState.notify('projects', list);
        }

        return mockAsyncResponse(newProj);
      },

      saveDraft: function (projectData) {
        projectData.isDraft = true;
        return this.createProject(projectData);
      },

      updateProject: function (id, updateData) {
        var list = this._getStorage();
        for (var i = 0; i < list.length; i++) {
          if (list[i].id === id) {
            var statusChanged = updateData.status && updateData.status !== list[i].status;
            for (var k in updateData) {
              if (updateData.hasOwnProperty(k)) {
                list[i][k] = updateData[k];
              }
            }
            if (statusChanged) {
              list[i].activities = list[i].activities || [];
              list[i].activities.unshift({
                id: 'ACT-' + Date.now(),
                action: 'Status Changed',
                details: 'Project status changed to ' + updateData.status,
                date: new Date().toISOString(),
                user: 'Shahim'
              });
            }
            list[i].updatedAt = new Date().toISOString();
            this._saveStorage(list);
            return mockAsyncResponse(list[i]);
          }
        }
        return mockAsyncResponse(null);
      },

      addActivity: function (id, action, details) {
        var list = this._getStorage();
        for (var i = 0; i < list.length; i++) {
          if (list[i].id === id) {
            list[i].activities = list[i].activities || [];
            list[i].activities.unshift({
              id: 'ACT-' + Date.now(),
              action: action,
              details: details,
              date: new Date().toISOString(),
              user: 'Shahim'
            });
            list[i].updatedAt = new Date().toISOString();
            this._saveStorage(list);
            return mockAsyncResponse(list[i]);
          }
        }
        return mockAsyncResponse(null);
      },

      addMilestone: function(id, milestoneData) {
        var list = this._getStorage();
        for (var i = 0; i < list.length; i++) {
          if (list[i].id === id) {
            list[i].milestones = list[i].milestones || [];
            var newMs = {
              id: 'MS-' + Date.now(),
              title: milestoneData.title,
              description: milestoneData.description || '',
              assignee: milestoneData.assignee || 'Unassigned',
              dueDate: milestoneData.dueDate || '',
              status: milestoneData.status || 'Pending',
              completionPct: milestoneData.completionPct || 0
            };
            list[i].milestones.push(newMs);
            list[i].activities = list[i].activities || [];
            list[i].activities.unshift({ id: 'ACT-' + Date.now(), action: 'Milestone Added', details: 'Added milestone: ' + newMs.title, date: new Date().toISOString(), user: 'Shahim' });
            list[i].updatedAt = new Date().toISOString();
            this._saveStorage(list);
            return mockAsyncResponse(list[i]);
          }
        }
        return mockAsyncResponse(null);
      },
      
      updateMilestone: function(id, milestoneId, data) {
        var list = this._getStorage();
        for (var i = 0; i < list.length; i++) {
          if (list[i].id === id) {
            list[i].milestones = list[i].milestones || [];
            var statusChanged = false;
            for (var m = 0; m < list[i].milestones.length; m++) {
              if (list[i].milestones[m].id === milestoneId) {
                statusChanged = data.status && data.status !== list[i].milestones[m].status;
                for (var k in data) {
                  if (data.hasOwnProperty(k)) list[i].milestones[m][k] = data[k];
                }
                if (statusChanged && data.status === 'Completed') {
                  list[i].activities.unshift({ id: 'ACT-' + Date.now(), action: 'Milestone Completed', details: 'Completed milestone: ' + list[i].milestones[m].title, date: new Date().toISOString(), user: 'Shahim' });
                }
                break;
              }
            }
            list[i].updatedAt = new Date().toISOString();
            this._saveStorage(list);
            return mockAsyncResponse(list[i]);
          }
        }
        return mockAsyncResponse(null);
      },

      deleteMilestone: function(id, milestoneId) {
        var list = this._getStorage();
        for (var i = 0; i < list.length; i++) {
          if (list[i].id === id) {
            list[i].milestones = (list[i].milestones || []).filter(function(m) { return m.id !== milestoneId; });
            list[i].updatedAt = new Date().toISOString();
            this._saveStorage(list);
            return mockAsyncResponse(list[i]);
          }
        }
        return mockAsyncResponse(null);
      },

      addNote: function(id, text) {
        var list = this._getStorage();
        for (var i = 0; i < list.length; i++) {
          if (list[i].id === id) {
            list[i].internalNotes = list[i].internalNotes || [];
            list[i].internalNotes.push({ id: 'NOTE-' + Date.now(), text: text, date: new Date().toISOString(), author: 'Shahim' });
            list[i].activities = list[i].activities || [];
            list[i].activities.unshift({ id: 'ACT-' + Date.now(), action: 'Note Added', details: 'Added an internal note.', date: new Date().toISOString(), user: 'Shahim' });
            list[i].updatedAt = new Date().toISOString();
            this._saveStorage(list);
            return mockAsyncResponse(list[i]);
          }
        }
        return mockAsyncResponse(null);
      },

      deleteNote: function(id, noteId) {
        var list = this._getStorage();
        for (var i = 0; i < list.length; i++) {
          if (list[i].id === id) {
            list[i].internalNotes = (list[i].internalNotes || []).filter(function(n) { return n.id !== noteId; });
            list[i].updatedAt = new Date().toISOString();
            this._saveStorage(list);
            return mockAsyncResponse(list[i]);
          }
        }
        return mockAsyncResponse(null);
      },

      addFile: function(id, fileData) {
        var list = this._getStorage();
        for (var i = 0; i < list.length; i++) {
          if (list[i].id === id) {
            list[i].files = list[i].files || [];
            var newFile = {
              id: 'FILE-' + Date.now(),
              name: fileData.name,
              size: fileData.size,
              date: new Date().toISOString(),
              uploader: 'Shahim'
            };
            list[i].files.push(newFile);
            list[i].activities = list[i].activities || [];
            list[i].activities.unshift({ id: 'ACT-' + Date.now(), action: 'File Uploaded', details: 'Uploaded file: ' + newFile.name, date: new Date().toISOString(), user: 'Shahim' });
            list[i].updatedAt = new Date().toISOString();
            this._saveStorage(list);
            return mockAsyncResponse(list[i]);
          }
        }
        return mockAsyncResponse(null);
      },
      
      deleteFile: function(id, fileId) {
        var list = this._getStorage();
        for (var i = 0; i < list.length; i++) {
          if (list[i].id === id) {
            list[i].files = (list[i].files || []).filter(function(f) { return f.id !== fileId; });
            list[i].updatedAt = new Date().toISOString();
            this._saveStorage(list);
            return mockAsyncResponse(list[i]);
          }
        }
        return mockAsyncResponse(null);
      },

      deleteProject: function (id, permanent) {
        var list = this._getStorage();
        if (permanent) {
          list = list.filter(function (p) { return p.id !== id; });
        } else {
          for (var i = 0; i < list.length; i++) {
            if (list[i].id === id) {
              list[i].isDeleted = true;
              list[i].updatedAt = new Date().toISOString();
              break;
            }
          }
        }
        this._saveStorage(list);
        return mockAsyncResponse({ success: true });
      },

      archiveProject: function (id) {
        return this.updateProject(id, { isArchived: true, status: 'Archived' });
      },

      restoreProject: function (id) {
        return this.updateProject(id, { isArchived: false, status: 'Active' });
      }
    },

    // 4. TASKS SERVICE (LOCAL STORAGE BACKED REST TARGET: /api/v1/tasks)
    Tasks: {
      STORAGE_KEY: 'verde_os_tasks',

      _getStorage: function () {
        var raw = localStorage.getItem(this.STORAGE_KEY);
        if (!raw) {
          var now = new Date().toISOString();
          var initialSeed = [
            { id: 'TSK-1001', title: 'Design landing page', description: 'Create high-fidelity mockups for Cabo Travels.', projectId: 'PRJ-001', assigneeId: 'SH', status: 'In Progress', priority: 'High', dueDate: '2026-08-05', estimatedHours: 12, tags: ['Design', 'UI'], dependencies: [], recurrence: 'None', reminder: 'None', attachmentsCount: 2, commentsCount: 5, timeline: [{ id: 'ACT-1', action: 'Task Created', details: 'Initialized task.', date: now, user: 'Shahim' }], subtasks: [{id: 'ST-1', title: 'Initial setup', completed: true}, {id: 'ST-2', title: 'Review specs', completed: false}], comments: [{id: 'CMT-1', authorId: 'MI', text: 'Looking forward to this!', createdAt: new Date().toISOString()}], attachments: [{id: 'ATT-1', name: 'specs.pdf', size: '2.4 MB', createdAt: new Date().toISOString()}], createdAt: now, updatedAt: now },
            { id: 'TSK-1002', title: 'Implement login flow', description: 'Develop authentication using JWT.', projectId: 'PRJ-003', assigneeId: 'NH', status: 'To Do', priority: 'Critical', dueDate: '2026-08-10', estimatedHours: 8, tags: ['Backend', 'Auth'], dependencies: ['TSK-1001'], recurrence: 'None', reminder: 'None', attachmentsCount: 0, commentsCount: 1, timeline: [{ id: 'ACT-2', action: 'Task Created', details: 'Initialized task.', date: now, user: 'Shahim' }], subtasks: [{id: 'ST-1', title: 'Initial setup', completed: true}, {id: 'ST-2', title: 'Review specs', completed: false}], comments: [{id: 'CMT-1', authorId: 'MI', text: 'Looking forward to this!', createdAt: new Date().toISOString()}], attachments: [{id: 'ATT-1', name: 'specs.pdf', size: '2.4 MB', createdAt: new Date().toISOString()}], createdAt: now, updatedAt: now },
            { id: 'TSK-1003', title: 'Setup CI/CD pipeline', description: 'Configure GitHub Actions.', projectId: 'PRJ-004', assigneeId: 'MI', status: 'Completed', priority: 'Medium', dueDate: '2026-07-20', estimatedHours: 4, tags: ['DevOps'], dependencies: [], recurrence: 'Weekly', reminder: 'None', attachmentsCount: 0, commentsCount: 0, timeline: [{ id: 'ACT-3', action: 'Task Created', details: 'Initialized task.', date: now, user: 'Shahim' }], subtasks: [{id: 'ST-1', title: 'Initial setup', completed: true}, {id: 'ST-2', title: 'Review specs', completed: false}], comments: [{id: 'CMT-1', authorId: 'MI', text: 'Looking forward to this!', createdAt: new Date().toISOString()}], attachments: [{id: 'ATT-1', name: 'specs.pdf', size: '2.4 MB', createdAt: new Date().toISOString()}], createdAt: now, updatedAt: now }
          ];
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(initialSeed));
          return initialSeed;
        }
        try { return JSON.parse(raw); } catch (e) { return []; }
      },

      _saveStorage: function (list) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(list));
      },

      getTasks: function (options) {
        options = options || {};
        var list = this._getStorage();
        var filtered = list.filter(function (t) {
          if (t.isDeleted) return false;
          if (t.status === 'Archived' && !options.includeArchived) return false;
          return true;
        });
        var sorted = filtered.sort(function (a, b) {
          var tA = new Date(a.createdAt || 0).getTime();
          var tB = new Date(b.createdAt || 0).getTime();
          return tB - tA;
        });
        return mockAsyncResponse(sorted);
      },

      getTaskById: function (id) {
        var list = this._getStorage();
        var match = list.filter(function (t) { return t.id === id && !t.isDeleted; })[0];
        return mockAsyncResponse(match || null);
      },

      createTask: function (data) {
        var list = this._getStorage();
        var now = new Date().toISOString();
        var newTask = {
          id: data.id || ('TSK-' + Math.floor(1000 + Math.random() * 9000)),
          title: data.title || 'Untitled Task',
          description: data.description || '',
          projectId: data.projectId || null,
          assigneeId: data.assigneeId || 'Unassigned',
          status: data.status || 'To Do',
          priority: data.priority || 'Medium',
          dueDate: data.dueDate || '',
          estimatedHours: parseFloat(data.estimatedHours || 0),
          tags: data.tags || [],
          dependencies: data.dependencies || [],
          recurrence: data.recurrence || 'None',
          reminder: data.reminder || 'None',
          attachmentsCount: 0,
          commentsCount: 0,
          timeline: [{ id: 'ACT-' + Date.now(), action: 'Task Created', details: 'Task initialized.', date: now, user: 'Shahim' }],
          subtasks: [],
          comments: [],
          attachments: [],
          createdAt: now,
          updatedAt: now
        };
        list.unshift(newTask);
        this._saveStorage(list);

        if (newTask.assigneeId !== 'Unassigned' && window.VerdeServices.Notifications) {
          window.VerdeServices.Notifications.addNotification('Task Assigned', newTask.title + ' was assigned to ' + newTask.assigneeId);
        }

        return mockAsyncResponse(newTask);
      },

      updateTask: function (id, data) {
        var list = this._getStorage();
        for (var i = 0; i < list.length; i++) {
          if (list[i].id === id) {
            var oldStatus = list[i].status;
            var newStatus = data.status || oldStatus;
            
            // SMART STATUS: Prevent moving blocked tasks to Completed
            if (newStatus === 'Completed' && oldStatus !== 'Completed') {
              var deps = list[i].dependencies || [];
              var isBlocked = false;
              for (var d = 0; d < deps.length; d++) {
                var depTask = list.find(t => t.id === deps[d]);
                if (depTask && depTask.status !== 'Completed') {
                  isBlocked = true;
                  break;
                }
              }
              if (isBlocked) {
                return Promise.reject(new Error('Cannot complete task. It is blocked by incomplete dependencies.'));
              }
            }

            var statusChanged = newStatus !== oldStatus;
            var priorityChanged = data.priority && data.priority !== list[i].priority;
            var oldAssignee = list[i].assigneeId;
            
            for (var k in data) {
              if (data.hasOwnProperty(k)) list[i][k] = data[k];
            }
            
            list[i].timeline = list[i].timeline || [];
            var now = new Date().toISOString();
            if (statusChanged) {
              list[i].timeline.unshift({ id: 'ACT-' + Date.now(), action: 'Status Changed', details: 'Status changed to ' + newStatus, date: now, user: 'Shahim' });
              
              // Notifications
              if (newStatus === 'Completed') {
                if (window.VerdeServices.Notifications) {
                  window.VerdeServices.Notifications.addNotification('Task Completed', list[i].title + ' was completed.');
                }
                
                // UNBLOCK check: If any task depends on this one, notify that it is unblocked
                var unblockedTasks = list.filter(t => (t.dependencies || []).includes(list[i].id) && t.status !== 'Completed');
                unblockedTasks.forEach(ut => {
                  var allDepsCompleted = true;
                  (ut.dependencies || []).forEach(depId => {
                    var depT = list.find(tx => tx.id === depId);
                    if (depT && depT.status !== 'Completed' && depT.id !== list[i].id) allDepsCompleted = false;
                  });
                  if (allDepsCompleted && window.VerdeServices.Notifications) {
                    window.VerdeServices.Notifications.addNotification('Dependency Unblocked', ut.title + ' is now ready to start.');
                  }
                });

                // RECURRENCE logic: auto-generate next occurrence
                if (list[i].recurrence && list[i].recurrence !== 'None') {
                  var nextDue = new Date();
                  var currentDue = list[i].dueDate ? new Date(list[i].dueDate) : new Date();
                  if (list[i].recurrence === 'Daily') nextDue.setDate(currentDue.getDate() + 1);
                  else if (list[i].recurrence === 'Weekly') nextDue.setDate(currentDue.getDate() + 7);
                  else if (list[i].recurrence === 'Monthly') nextDue.setMonth(currentDue.getMonth() + 1);
                  else if (list[i].recurrence === 'Yearly') nextDue.setFullYear(currentDue.getFullYear() + 1);
                  
                  var clonedTask = JSON.parse(JSON.stringify(list[i]));
                  clonedTask.id = 'TSK-' + Math.floor(Math.random() * 9000 + 1000);
                  clonedTask.status = 'To Do';
                  clonedTask.dueDate = nextDue.toISOString().split('T')[0];
                  clonedTask.timeline = [{ id: 'ACT-AUTO', action: 'Task Auto-Generated', details: 'Generated via recurrence rule.', date: now, user: 'System' }];
                  clonedTask.createdAt = now;
                  clonedTask.updatedAt = now;
                  clonedTask.commentsCount = 0;
                  clonedTask.attachmentsCount = 0;
                  clonedTask.comments = [];
                  clonedTask.attachments = [];
                  list.unshift(clonedTask);
                }
              }
            }
            
            if (priorityChanged) {
              list[i].timeline.unshift({ id: 'ACT-' + Date.now() + 1, action: 'Priority Changed', details: 'Priority changed to ' + data.priority, date: now, user: 'Shahim' });
            }
            
            if (data.assigneeId && data.assigneeId !== oldAssignee && data.assigneeId !== 'Unassigned') {
              if (window.VerdeServices.Notifications) {
                window.VerdeServices.Notifications.addNotification('Task Assigned', list[i].title + ' was assigned to ' + data.assigneeId);
              }
            }
            
            list[i].updatedAt = now;
            this._saveStorage(list);
            return mockAsyncResponse(list[i]);
          }
        }
        return mockAsyncResponse(null);
      },

      
      addSubtask: function(taskId, title) {
        var list = this._getStorage();
        for (var i = 0; i < list.length; i++) {
          if (list[i].id === taskId) {
            list[i].subtasks = list[i].subtasks || [];
            var newSub = { id: 'ST-' + Date.now(), title: title, completed: false, createdAt: new Date().toISOString() };
            list[i].subtasks.push(newSub);
            list[i].timeline = list[i].timeline || [];
            list[i].timeline.unshift({ id: 'ACT-' + Date.now(), action: 'Subtask Added', details: 'Added: ' + title, date: new Date().toISOString(), user: 'Shahim' });
            list[i].updatedAt = new Date().toISOString();
            this._saveStorage(list);
            return mockAsyncResponse(list[i]);
          }
        }
        return mockAsyncResponse(null);
      },
      
      toggleSubtask: function(taskId, subtaskId, completed) {
        var list = this._getStorage();
        for (var i = 0; i < list.length; i++) {
          if (list[i].id === taskId) {
            list[i].subtasks = list[i].subtasks || [];
            for (var j = 0; j < list[i].subtasks.length; j++) {
              if (list[i].subtasks[j].id === subtaskId) {
                list[i].subtasks[j].completed = completed;
                list[i].timeline = list[i].timeline || [];
                var statusStr = completed ? 'Completed' : 'Unchecked';
                list[i].timeline.unshift({ id: 'ACT-' + Date.now(), action: 'Subtask ' + statusStr, details: list[i].subtasks[j].title, date: new Date().toISOString(), user: 'Shahim' });
                break;
              }
            }
            list[i].updatedAt = new Date().toISOString();
            this._saveStorage(list);
            return mockAsyncResponse(list[i]);
          }
        }
        return mockAsyncResponse(null);
      },

      deleteSubtask: function(taskId, subtaskId) {
        var list = this._getStorage();
        for (var i = 0; i < list.length; i++) {
          if (list[i].id === taskId) {
            list[i].subtasks = list[i].subtasks || [];
            list[i].subtasks = list[i].subtasks.filter(st => st.id !== subtaskId);
            list[i].updatedAt = new Date().toISOString();
            this._saveStorage(list);
            return mockAsyncResponse(list[i]);
          }
        }
        return mockAsyncResponse(null);
      },

      addComment: function(taskId, authorId, text) {
        var list = this._getStorage();
        for (var i = 0; i < list.length; i++) {
          if (list[i].id === taskId) {
            list[i].comments = list[i].comments || [];
            var newComment = { id: 'CMT-' + Date.now(), authorId: authorId, text: text, createdAt: new Date().toISOString() };
            list[i].comments.push(newComment);
            list[i].commentsCount = list[i].comments.length;
            list[i].timeline = list[i].timeline || [];
            list[i].timeline.unshift({ id: 'ACT-' + Date.now(), action: 'Comment Added', details: 'By ' + authorId, date: new Date().toISOString(), user: authorId });
            list[i].updatedAt = new Date().toISOString();
            this._saveStorage(list);
            return mockAsyncResponse(list[i]);
          }
        }
        return mockAsyncResponse(null);
      },

      deleteComment: function(taskId, commentId) {
        var list = this._getStorage();
        for (var i = 0; i < list.length; i++) {
          if (list[i].id === taskId) {
            list[i].comments = list[i].comments || [];
            list[i].comments = list[i].comments.filter(c => c.id !== commentId);
            list[i].commentsCount = list[i].comments.length;
            list[i].timeline = list[i].timeline || [];
            list[i].timeline.unshift({ id: 'ACT-' + Date.now(), action: 'Comment Deleted', details: 'Comment removed', date: new Date().toISOString(), user: 'Shahim' });
            list[i].updatedAt = new Date().toISOString();
            this._saveStorage(list);
            return mockAsyncResponse(list[i]);
          }
        }
        return mockAsyncResponse(null);
      },

      addAttachment: function(taskId, name, sizeStr) {
        var list = this._getStorage();
        for (var i = 0; i < list.length; i++) {
          if (list[i].id === taskId) {
            list[i].attachments = list[i].attachments || [];
            var newAtt = { id: 'ATT-' + Date.now(), name: name, size: sizeStr, createdAt: new Date().toISOString() };
            list[i].attachments.push(newAtt);
            list[i].attachmentsCount = list[i].attachments.length;
            list[i].timeline = list[i].timeline || [];
            list[i].timeline.unshift({ id: 'ACT-' + Date.now(), action: 'Attachment Uploaded', details: name, date: new Date().toISOString(), user: 'Shahim' });
            list[i].updatedAt = new Date().toISOString();
            this._saveStorage(list);
            return mockAsyncResponse(list[i]);
          }
        }
        return mockAsyncResponse(null);
      },
      
      deleteAttachment: function(taskId, attachmentId) {
        var list = this._getStorage();
        for (var i = 0; i < list.length; i++) {
          if (list[i].id === taskId) {
            list[i].attachments = list[i].attachments || [];
            list[i].attachments = list[i].attachments.filter(a => a.id !== attachmentId);
            list[i].attachmentsCount = list[i].attachments.length;
            list[i].timeline = list[i].timeline || [];
            list[i].timeline.unshift({ id: 'ACT-' + Date.now(), action: 'Attachment Deleted', details: 'Attachment removed', date: new Date().toISOString(), user: 'Shahim' });
            list[i].updatedAt = new Date().toISOString();
            this._saveStorage(list);
            return mockAsyncResponse(list[i]);
          }
        }
        return mockAsyncResponse(null);
      },

      deleteTask: function (id, permanent) {
        var list = this._getStorage();
        if (permanent) {
          list = list.filter(function (t) { return t.id !== id; });
        } else {
          for (var i = 0; i < list.length; i++) {
            if (list[i].id === id) {
              list[i].isDeleted = true;
              list[i].updatedAt = new Date().toISOString();
              list[i].timeline = list[i].timeline || [];
              list[i].timeline.unshift({ id: 'ACT-' + Date.now(), action: 'Deleted', details: 'Task deleted.', date: new Date().toISOString(), user: 'Shahim' });
              break;
            }
          }
        }
        this._saveStorage(list);
        return mockAsyncResponse({ success: true });
      }
    },

    // 5. FINANCE SERVICE (LOCAL STORAGE BACKED)
    Finance: {
      STORAGE_KEY: 'verde_os_finance_transactions',
      _getStorage: function () {
        var raw = localStorage.getItem(this.STORAGE_KEY);
        if (!raw) {
          var initialSeed = window.VerdeMockData ? window.VerdeMockData.invoices : [];
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(initialSeed));
          return initialSeed;
        }
        try { return JSON.parse(raw); } catch (e) { return []; }
      },
      _saveStorage: function (list) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(list));
      },
      getInvoices: function () {
        var list = this._getStorage().filter(function(i) { return !i.isDeleted; });
        return mockAsyncResponse(list);
      },
      createTransaction: function (txData) {
        var list = this._getStorage();
        var now = new Date().toISOString();
        var newTx = {
          id: txData.id || ('INV-' + Math.floor(1000 + Math.random() * 9000)),
          invoiceNumber: txData.invoiceNumber || ('INV-' + Math.floor(1000 + Math.random() * 9000)),
          client: txData.client || 'Unknown',
          description: txData.description || 'Service',
          amount: parseFloat(txData.amount || 0),
          type: txData.type || 'Income',
          status: txData.status || 'Completed',
          date: txData.date || now.split('T')[0],
          createdAt: now
        };
        list.unshift(newTx);
        this._saveStorage(list);
        if (window.VerdeServices.Notifications) {
          window.VerdeServices.Notifications.addNotification('Finance Update', newTx.type + ' recorded: $' + newTx.amount);
        }
        return mockAsyncResponse(newTx);
      },
      deleteTransaction: function (id) {
        var list = this._getStorage();
        for (var i = 0; i < list.length; i++) {
          if (list[i].id === id) {
            list[i].isDeleted = true;
            this._saveStorage(list);
            return mockAsyncResponse({ success: true });
          }
        }
        return mockAsyncResponse(null);
      }
    },

    // 6. MEETINGS/CALENDAR SERVICE (LOCAL STORAGE BACKED)
    Meetings: {
      STORAGE_KEY: 'verde_os_meetings',
      _getStorage: function () {
        var raw = localStorage.getItem(this.STORAGE_KEY);
        if (!raw) {
          var initialSeed = window.VerdeMockData ? window.VerdeMockData.meetings : [];
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(initialSeed));
          return initialSeed;
        }
        try { return JSON.parse(raw); } catch (e) { return []; }
      },
      _saveStorage: function (list) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(list));
      },
      getMeetings: function () {
        var list = this._getStorage().filter(function(m) { return !m.isDeleted; });
        return mockAsyncResponse(list);
      },
      createMeeting: function (data) {
        var list = this._getStorage();
        var newMtg = {
          id: data.id || ('MTG-' + Math.floor(1000 + Math.random() * 9000)),
          client: data.client || 'Internal',
          title: data.title || data.purpose || 'Meeting',
          purpose: data.purpose || data.title || 'Meeting',
          date: data.date || new Date().toISOString().split('T')[0],
          time: data.time || '10:00 AM',
          status: data.status || 'Scheduled',
          createdAt: new Date().toISOString()
        };
        list.unshift(newMtg);
        this._saveStorage(list);
        if (window.VerdeServices.Notifications) {
          window.VerdeServices.Notifications.addNotification('Meeting Scheduled', newMtg.title + ' on ' + newMtg.date);
        }
        return mockAsyncResponse(newMtg);
      },
      updateMeeting: function(id, data) {
        var list = this._getStorage();
        for (var i = 0; i < list.length; i++) {
          if (list[i].id === id) {
            for (var k in data) {
              if (data.hasOwnProperty(k)) list[i][k] = data[k];
            }
            this._saveStorage(list);
            return mockAsyncResponse(list[i]);
          }
        }
        return mockAsyncResponse(null);
      },
      deleteMeeting: function (id) {
        var list = this._getStorage();
        for (var i = 0; i < list.length; i++) {
          if (list[i].id === id) {
            list[i].isDeleted = true;
            this._saveStorage(list);
            return mockAsyncResponse({ success: true });
          }
        }
        return mockAsyncResponse(null);
      }
    },

    // 7. REPORTS SERVICE (LOCAL STORAGE BACKED)
    Reports: {
      STORAGE_KEY: 'verde_os_reports',
      _getStorage: function () {
        var raw = localStorage.getItem(this.STORAGE_KEY);
        if (!raw) {
          var initialSeed = window.VerdeMockData ? window.VerdeMockData.reports : [];
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(initialSeed));
          return initialSeed;
        }
        try { return JSON.parse(raw); } catch (e) { return []; }
      },
      _saveStorage: function (list) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(list));
      },
      getReports: function () {
        return mockAsyncResponse(this._getStorage());
      },
      generateReport: function (name, category) {
        var list = this._getStorage();
        var newRep = {
          id: 'REP-' + Date.now(),
          name: name,
          category: category,
          author: window.VERDE_SESSION ? window.VERDE_SESSION.getUser().name : 'System',
          generatedDate: new Date().toISOString().split('T')[0],
          status: 'Ready'
        };
        list.unshift(newRep);
        this._saveStorage(list);
        if (window.VerdeServices.Notifications) {
          window.VerdeServices.Notifications.addNotification('Report Generated', name + ' is ready.');
        }
        return mockAsyncResponse(newRep);
      }
    },

    // 8. TEAM SERVICE (LOCAL STORAGE BACKED)
    Team: {
      STORAGE_KEY: 'verde_os_team_employees',
      _getStorage: function () {
        var raw = localStorage.getItem(this.STORAGE_KEY);
        if (!raw) {
          var initialSeed = window.VerdeMockData ? window.VerdeMockData.employees : [];
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(initialSeed));
          return initialSeed;
        }
        try { return JSON.parse(raw); } catch (e) { return []; }
      },
      _saveStorage: function (list) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(list));
      },
      getMembers: function () {
        return mockAsyncResponse(this._getStorage().filter(function(m) { return !m.isDeleted; }));
      },
      inviteMember: function (email, role) {
        var list = this._getStorage();
        var newMem = {
          id: 'EMP-' + Math.floor(1000 + Math.random() * 9000),
          name: email.split('@')[0],
          email: email,
          role: role || 'Employee',
          department: 'General',
          initials: email.substring(0,2).toUpperCase(),
          avatarBg: 'var(--primary)',
          status: 'Invited',
          workload: '0%'
        };
        list.push(newMem);
        this._saveStorage(list);
        return mockAsyncResponse(newMem);
      }
    },

    // 9. MARKETING SERVICE (LOCAL STORAGE BACKED)
    Marketing: {
      STORAGE_KEY: 'verde_os_marketing',
      _getStorage: function () {
        var raw = localStorage.getItem(this.STORAGE_KEY);
        if (!raw) {
          var initialSeed = [
            { id: 'MK-1', name: 'Q4 Enterprise SaaS Targeting', platform: 'Google Ads', budget: '$15,000', status: 'Running', perf: '+12%' },
            { id: 'MK-2', name: 'Product Update Walkthroughs', platform: 'Instagram', budget: '$4,500', status: 'Running', perf: '+8%' },
            { id: 'MK-3', name: 'B2B Networking Lead Gen', platform: 'LinkedIn', budget: '$12,000', status: 'Draft', perf: '--' }
          ];
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(initialSeed));
          return initialSeed;
        }
        try { return JSON.parse(raw); } catch (e) { return []; }
      },
      _saveStorage: function (list) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(list));
      },
      getCampaigns: function () {
        return mockAsyncResponse(this._getStorage());
      }
    },

    // 10. AI HUB SERVICE (DYNAMIC GENERATION)
    Ai: {
      getInsights: function () {
        return new Promise(function(resolve) {
          // Gather data to generate insights
          var p1 = window.VerdeServices.Tasks ? window.VerdeServices.Tasks.getTasks() : Promise.resolve([]);
          var p2 = window.VerdeServices.Projects ? window.VerdeServices.Projects.getProjects() : Promise.resolve([]);
          var p3 = window.VerdeServices.Crm ? window.VerdeServices.Crm.getClients() : Promise.resolve([]);
          var p4 = window.VerdeServices.Finance ? window.VerdeServices.Finance.getInvoices() : Promise.resolve([]);
          
          Promise.all([p1, p2, p3, p4]).then(function(results) {
            var tasks = results[0] || [];
            var projects = results[1] || [];
            var clients = results[2] || [];
            var finances = results[3] || [];
            
            var insights = [];
            
            // Task Insight
            var overdue = tasks.filter(t => t.status !== 'Completed' && t.dueDate && new Date(t.dueDate) < new Date()).length;
            if (overdue > 0) {
              insights.push(overdue + ' task' + (overdue > 1 ? 's are' : ' is') + ' currently overdue.');
            } else {
              var upcoming = tasks.filter(t => t.status !== 'Completed').length;
              insights.push('You have ' + upcoming + ' pending tasks in your pipeline.');
            }
            
            // Project Insight
            var atRisk = projects.filter(p => p.status === 'At Risk').length;
            if (atRisk > 0) {
              insights.push(atRisk + ' project' + (atRisk > 1 ? 's are' : ' is') + ' marked as "At Risk".');
            } else {
              var active = projects.filter(p => p.status === 'Active').length;
              insights.push(active + ' active projects are progressing steadily.');
            }
            
            // Client Insight
            var newClients = clients.filter(c => c.createdAt && new Date(c.createdAt) > new Date(Date.now() - 30*24*60*60*1000)).length;
            if (newClients > 0) {
              insights.push(newClients + ' new client' + (newClients > 1 ? 's' : '') + ' onboarded in the last 30 days.');
            }
            
            // Finance Insight
            var pendingInv = finances.filter(f => f.type === 'Income' && f.status === 'Processing').length;
            if (pendingInv > 0) {
              insights.push(pendingInv + ' income invoice' + (pendingInv > 1 ? 's are' : ' is') + ' currently processing.');
            }
            
            if (insights.length < 3) {
              insights.push('Revenue forecast for Q4 projected at +18% growth based on historical trends.');
            }
            if (insights.length < 3) {
              insights.push('Consider scheduling a review meeting for clients with no active projects.');
            }
            
            resolve(insights.slice(0, 4));
          }).catch(function() {
            resolve([
              'System is analyzing data to provide insights.',
              'Ensure all tasks and projects are up to date.',
              'Schedule client check-ins regularly.'
            ]);
          });
        });
      }
    },

    // 11. WORKSPACE & SETTINGS SERVICES
    Workspace: {
      getWorkspaceInfo: function () {
        return mockAsyncResponse(window.VerdeState ? window.VerdeState.get('workspace') : {});
      }
    },

    Settings: {
      getSettings: function () {
        return mockAsyncResponse({ theme: 'light', notificationsEnabled: true });
      }
    }
  };

})();
