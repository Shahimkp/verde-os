(function () {
  'use strict';

  window.VerdeFirebaseService = {
    getCollection: function(collectionName) {
      if (!window.verdeFirestore) return null;
      return window.verdeFirestore.collection(collectionName);
    },
    
    getDocument: function(collectionName, docId) {
      if (!window.verdeFirestore) return Promise.reject("Firestore not initialized");
      return window.verdeFirestore.collection(collectionName).doc(docId).get();
    },
    
    createDocument: function(collectionName, data, docId) {
      if (!window.verdeFirestore) return Promise.reject("Firestore not initialized");
      
      data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
      data.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
      
      if (docId) {
        return window.verdeFirestore.collection(collectionName).doc(docId).set(data);
      } else {
        return window.verdeFirestore.collection(collectionName).add(data);
      }
    },
    
    updateDocument: function(collectionName, docId, data) {
      if (!window.verdeFirestore) return Promise.reject("Firestore not initialized");
      
      data.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
      return window.verdeFirestore.collection(collectionName).doc(docId).update(data);
    },
    
    deleteDocument: function(collectionName, docId) {
      if (!window.verdeFirestore) return Promise.reject("Firestore not initialized");
      return window.verdeFirestore.collection(collectionName).doc(docId).delete();
    },
    
    subscribeToCollection: function(collectionName, callback) {
      if (!window.verdeFirestore) return function() {};
      
      return window.verdeFirestore.collection(collectionName)
        .onSnapshot(function(snapshot) {
          var docs = [];
          snapshot.forEach(function(doc) {
            docs.push(Object.assign({ id: doc.id }, doc.data()));
          });
          callback(docs);
        }, function(error) {
          console.error("Error subscribing to collection:", error);
        });
    },

    // Step 6 — VERIFY FIREBASE CONNECTION
    testConnection: function() {
      if (!window.verdeFirestore) {
        console.error('[VERDE OS] Firebase connection test failed: Firestore not initialized.');
        return;
      }
      
      console.log('[VERDE OS] Testing Firebase connection...');
      // Safe development-only test that doesn't overwrite data
      // We will try to read from a non-existent or test collection just to verify network connectivity
      window.verdeFirestore.collection('_system_test_').limit(1).get()
        .then(function() {
          console.log('[VERDE OS] Firebase connection test SUCCESSFUL. Ready for Phase 2.');
        })
        .catch(function(error) {
          console.error('[VERDE OS] Firebase connection test FAILED. Check permissions/config.', error);
        });
    },

    // Step 4 — UNIVERSAL REALTIME SYNC ENGINE
    startRealtimeSync: function() {
      console.log('[VERDE OS] Initializing Universal Realtime Sync Engine...');
      
      var collections = [
        { key: 'verde_os_notifications', coll: 'notifications' },
        { key: 'verde_os_crm_leads', coll: 'crm_leads' },
        { key: 'verde_os_crm_clients', coll: 'crm_clients' },
        { key: 'verde_os_crm_proposals', coll: 'crm_proposals' },
        { key: 'verde_os_tasks', coll: 'tasks' },
        { key: 'verde_os_finance_transactions', coll: 'finance_invoices' },
        { key: 'verde_os_team_employees', coll: 'team_employees' },
        { key: 'verde_os_team_attendance', coll: 'team_attendance' },
        { key: 'verde_os_team_leaves', coll: 'team_leaves' },
        { key: 'verde_os_team_payroll', coll: 'finance_payroll' },
        { key: 'verde_os_marketing', coll: 'marketing_campaigns' },
        { key: 'verde_os_meetings', coll: 'meetings' },
        { key: 'verde_os_reports', coll: 'reports' }
      ];

      var originalSetItem = localStorage.setItem;
      var isSyncing = false;

      // 1. Listen for Firestore changes and sync DOWN to localStorage
      collections.forEach(function(mod) {
        if (!window.verdeFirestore) return;
        
        window.verdeFirestore.collection(mod.coll).onSnapshot(function(snapshot) {
          isSyncing = true;
          var items = [];
          snapshot.forEach(function(doc) { items.push(doc.data()); });
          
          // Apply to local storage
          if (items.length > 0 || !localStorage.getItem(mod.key)) {
            originalSetItem.call(localStorage, mod.key, JSON.stringify(items));
          }
          
          isSyncing = false;
        }, function(error) {
          console.error('[VERDE OS] Sync DOWN failed for ' + mod.coll, error);
        });
      });

      // 2. Intercept localStorage writes and sync UP to Firestore
      localStorage.setItem = function(key, value) {
        originalSetItem.call(localStorage, key, value);
        
        if (isSyncing) return; // Ignore writes triggered by Firestore snapshots
        
        var mod = collections.filter(function(c) { return c.key === key; })[0];
        if (mod && window.verdeFirestore) {
          try {
            var items = JSON.parse(value);
            if (Array.isArray(items)) {
              var batch = window.verdeFirestore.batch();
              items.forEach(function(item) {
                if (!item.id) return;
                var docRef = window.verdeFirestore.collection(mod.coll).doc(item.id);
                if (item.isDeleted) {
                  batch.delete(docRef);
                } else {
                  batch.set(docRef, item, { merge: true });
                }
              });
              
              batch.commit().catch(function(e) {
                console.error('[VERDE OS] Sync UP failed for ' + key, e);
              });
            }
          } catch(e) {
            console.error('[VERDE OS] Sync UP parsing error', e);
          }
        }
      };
    },

    // Step 5 - UNIVERSAL MIGRATION UTILITY
    migrateAllModules: function() {
      return new Promise(function(resolve, reject) {
        console.log('[VERDE OS] Starting Universal Migration to Firestore...');
        if (!window.verdeFirestore) return reject("Firestore not initialized");

        var modulesToMigrate = [
          { key: 'verde_os_notifications', coll: 'notifications' },
          { key: 'verde_os_crm_leads', coll: 'crm_leads' },
          { key: 'verde_os_crm_clients', coll: 'crm_clients' },
          { key: 'verde_os_crm_proposals', coll: 'crm_proposals' },
          { key: 'verde_os_tasks', coll: 'tasks' },
          { key: 'verde_os_finance_transactions', coll: 'finance_invoices' },
          { key: 'verde_os_team_employees', coll: 'team_employees' },
          { key: 'verde_os_team_attendance', coll: 'team_attendance' },
          { key: 'verde_os_team_leaves', coll: 'team_leaves' },
          { key: 'verde_os_team_payroll', coll: 'finance_payroll' },
          { key: 'verde_os_marketing', coll: 'marketing_campaigns' },
          { key: 'verde_os_meetings', coll: 'meetings' },
          { key: 'verde_os_reports', coll: 'reports' }
        ];

        var promises = modulesToMigrate.map(function(mod) {
          return new Promise(function(res) {
            var raw = localStorage.getItem(mod.key);
            var items = [];
            try { if (raw) items = JSON.parse(raw); } catch(e) {}
            
            if (!items || !items.length) {
              console.log('[VERDE OS] Skipping ' + mod.coll + ': No local data.');
              return res({ coll: mod.coll, total: 0, migrated: 0 });
            }

            var batch = window.verdeFirestore.batch();
            var migrated = 0;

            items.forEach(function(item) {
              if (!item.id) return;
              var docRef = window.verdeFirestore.collection(mod.coll).doc(item.id);
              var data = Object.assign({}, item);
              data.migratedAt = firebase.firestore.FieldValue.serverTimestamp();
              batch.set(docRef, data, { merge: true });
              migrated++;
            });

            batch.commit().then(function() {
              console.log('[VERDE OS] Migrated ' + migrated + ' items to ' + mod.coll);
              res({ coll: mod.coll, total: items.length, migrated: migrated });
            }).catch(function(e) {
              console.error('[VERDE OS] Failed to migrate ' + mod.coll, e);
              res({ coll: mod.coll, total: items.length, migrated: 0, error: e });
            });
          });
        });

        Promise.all(promises).then(function(results) {
          console.log('[VERDE OS] Universal Migration Complete!', results);
          resolve(results);
        });
      });
    }
  };

  // Run the test after a short delay to ensure everything is loaded
  setTimeout(function() {
    if (window.VerdeFirebaseService && window.VerdeFirebaseService.testConnection) {
      window.VerdeFirebaseService.testConnection();
      
      // Attempt migration automatically for testing
      setTimeout(function() {
         window.VerdeFirebaseService.migrateAllModules();
      }, 1000);
    }
  }, 2000);

})();
