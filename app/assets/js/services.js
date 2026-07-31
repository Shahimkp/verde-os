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
          status: projectData.isDraft ? 'Draft' : (projectData.status || 'Planning'),
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

    // 4. TASKS SERVICE (GET/POST/PUT /api/v1/tasks)
    Tasks: {
      getTasks: function () {
        return mockAsyncResponse(window.VerdeMockData ? window.VerdeMockData.tasks : []);
      },
      createTask: function (taskData) {
        var newTask = window.VerdeModels ? window.VerdeModels.Task(taskData) : taskData;
        return mockAsyncResponse(newTask);
      },
      updateTaskStatus: function (taskId, status) {
        return mockAsyncResponse({ id: taskId, status: status, success: true });
      }
    },

    // 5. FINANCE SERVICE (GET/POST /api/v1/finance)
    Finance: {
      getInvoices: function () {
        return mockAsyncResponse(window.VerdeMockData ? window.VerdeMockData.invoices : []);
      },
      createTransaction: function (txData) {
        return mockAsyncResponse({ id: 'INV-' + Date.now(), success: true });
      }
    },

    // 6. REPORTS SERVICE (GET/POST /api/v1/reports)
    Reports: {
      getReports: function () {
        return mockAsyncResponse(window.VerdeMockData ? window.VerdeMockData.reports : []);
      },
      generateReport: function (name, category) {
        return mockAsyncResponse({ id: 'REP-' + Date.now(), name: name, category: category, status: 'Ready' });
      }
    },

    // 7. TEAM SERVICE (GET/POST /api/v1/team)
    Team: {
      getMembers: function () {
        return mockAsyncResponse(window.VerdeMockData ? window.VerdeMockData.employees : []);
      },
      inviteMember: function (email, role) {
        return mockAsyncResponse({ email: email, role: role, success: true });
      }
    },

    // 8. MARKETING SERVICE (GET/POST /api/v1/marketing)
    Marketing: {
      getCampaigns: function () {
        return mockAsyncResponse([
          { name: 'Q4 Enterprise SaaS Targeting', platform: 'Google Ads', budget: '$15,000', status: 'Running', perf: '+12%' },
          { name: 'Product Update Walkthroughs', platform: 'Instagram', budget: '$4,500', status: 'Running', perf: '+8%' },
          { name: 'B2B Networking Lead Gen', platform: 'LinkedIn', budget: '$12,000', status: 'Draft', perf: '--' }
        ]);
      }
    },

    // 9. AI HUB SERVICE (GET/POST /api/v1/ai)
    Ai: {
      getInsights: function () {
        return mockAsyncResponse([
          'Vertex Systems client has been inactive for 14 days.',
          'Project "BlueWave CRM Portal" milestone due in 3 days.',
          'Revenue forecast for Q4 projected at +18% growth.'
        ]);
      }
    },

    // 10. WORKSPACE & SETTINGS SERVICES (GET/PUT /api/v1/workspace)
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
