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

    // 3. PROJECTS SERVICE (GET/POST /api/v1/projects)
    Projects: {
      getProjects: function () {
        return mockAsyncResponse(window.VerdeMockData ? window.VerdeMockData.projects : []);
      },
      getProjectById: function (id) {
        var projects = window.VerdeMockData ? window.VerdeMockData.projects : [];
        var match = projects.filter(function (p) { return p.id === id; })[0];
        return mockAsyncResponse(match || projects[0]);
      },
      createProject: function (projectData) {
        var newProject = window.VerdeModels ? window.VerdeModels.Project(projectData) : projectData;
        return mockAsyncResponse(newProject);
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
