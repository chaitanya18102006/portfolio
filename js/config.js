/* ------------------------------------------------------------------
   SITE CONFIG  —  paste your keys here when you have them.

   1) Firebase  → https://console.firebase.google.com
        Project settings → General → "Your apps" → Web app → copy the config.
        Also enable:  Authentication → Email/Password   and   Firestore Database.
   2) imgbb     → https://api.imgbb.com  (free API key for image hosting)

   Until the keys are filled in, everything runs in DEMO MODE:
   content is saved in this browser only and uploaded images are stored
   inside the browser (no external services are contacted).
------------------------------------------------------------------- */
window.SITE_CONFIG = {
  firebase: {
    apiKey: "AIzaSyDgCYt-cTGPv5d14yF9jux9iY8LLDcA8Fw",
    authDomain: "chaitanya-portfolio-2c449.firebaseapp.com",
    projectId: "chaitanya-portfolio-2c449",
    storageBucket: "chaitanya-portfolio-2c449.firebasestorage.app",
    messagingSenderId: "475564764261",
    appId: "1:475564764261:web:94fec05629adff3e9aaa8c"
  },

  // imgbb API key: leave EMPTY. With Firebase on, save it from Admin → Settings → "Image hosting (imgbb)";
  // it is then stored privately in Firestore (admin-only) and never appears in the public site code.
  imgbbKey: "",

  // Optional: only this email may use the admin panel (also enforce in Firestore rules)
  adminEmail: ""
};
