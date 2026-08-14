(function () {
  'use strict';

  var firebaseConfig = {
    apiKey: "AIzaSyCr3vPtSIsNhHGAXozN7rzDEnfuSCBHeFo",
    authDomain: "verde-fe1d1.firebaseapp.com",
    projectId: "verde-fe1d1",
    storageBucket: "verde-fe1d1.firebasestorage.app",
    messagingSenderId: "775235527332",
    appId: "1:775235527332:web:ef9176bdfd0231e1a7bc31",
    measurementId: "G-KMYM8MDQK4"
  };

  try {
    // Initialize Firebase
    if (!firebase.apps.length) {
      window.verdeFirebaseApp = firebase.initializeApp(firebaseConfig);
    } else {
      window.verdeFirebaseApp = firebase.app();
    }
    
    // Initialize Firestore
    window.verdeFirestore = firebase.firestore();
    
    console.log('[VERDE OS] Firebase Foundation initialized successfully.');
  } catch (error) {
    console.error('[VERDE OS] Firebase initialization failed:', error);
  }
})();
