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

    // 2. CRM SERVICE (GET/POST /api/v1/crm)
    Crm: {
      getClients: function () {
        return mockAsyncResponse(window.VerdeMockData ? window.VerdeMockData.clients : []);
      },
      getLeads: function () {
        return mockAsyncResponse(window.VerdeMockData ? window.VerdeMockData.leads : []);
      },
      createClient: function (clientData) {
        var newClient = window.VerdeModels ? window.VerdeModels.Client(clientData) : clientData;
        return mockAsyncResponse(newClient);
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

      getProjects: function () {
        var list = this._getStorage();
        // Newest first by createdAt or order
        var sorted = list.slice().sort(function (a, b) {
          var tA = new Date(a.createdAt || 0).getTime();
          var tB = new Date(b.createdAt || 0).getTime();
          return tB - tA;
        });
        return mockAsyncResponse(sorted);
      },

      getProjectById: function (id) {
        var list = this._getStorage();
        var match = list.filter(function (p) { return p.id === id; })[0];
        return mockAsyncResponse(match || list[0]);
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
            for (var k in updateData) {
              if (updateData.hasOwnProperty(k)) {
                list[i][k] = updateData[k];
              }
            }
            list[i].updatedAt = new Date().toISOString();
            this._saveStorage(list);
            return mockAsyncResponse(list[i]);
          }
        }
        return mockAsyncResponse(null);
      },

      deleteProject: function (id) {
        var list = this._getStorage().filter(function (p) { return p.id !== id; });
        this._saveStorage(list);
        return mockAsyncResponse({ success: true });
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
