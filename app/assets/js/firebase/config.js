(function () {
  'use strict';

  var firebaseConfig = {
    apiKey: "AIzaSyDsimlcBO30D4pO7mCLHm_QpJFoOW7yJeQ",
    authDomain: "verde-os.firebaseapp.com",
    projectId: "verde-os",
    storageBucket: "verde-os.firebasestorage.app",
    messagingSenderId: "1073737150629",
    appId: "1:1073737150629:web:f123fc155caf2515259d4c",
    measurementId: "G-MCLS496GS6"
  };

  window.VERDE_FIREBASE_CONFIG = firebaseConfig;

  try {
    // Initialize Firebase
    if (!firebase.apps.length) {
      window.verdeFirebaseApp = firebase.initializeApp(firebaseConfig);
    } else {
      window.verdeFirebaseApp = firebase.app();
    }
    
    // Make auth and db accessible
    window.verdeAuth = firebase.auth();
    window.verdeDb = firebase.firestore();
    
    // Enable offline persistence for Firestore
    window.verdeDb.enablePersistence({ synchronizeTabs: true })
      .catch(function(err) {
        if (err.code == 'failed-precondition') {
          console.warn('Multiple tabs open, offline persistence enabled in first tab only');
        } else if (err.code == 'unimplemented') {
          console.warn('Browser does not support offline persistence');
        }
      });
      
    console.log("[VERDE OS] Firebase Foundation Connected");
  } catch (error) {
    console.error("[VERDE OS] Firebase initialization error:", error);
  }
})();
