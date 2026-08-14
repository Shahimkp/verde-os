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
    }
  };

  // Run the test after a short delay to ensure everything is loaded
  setTimeout(function() {
    if (window.VerdeFirebaseService && window.VerdeFirebaseService.testConnection) {
      window.VerdeFirebaseService.testConnection();
    }
  }, 2000);

})();
