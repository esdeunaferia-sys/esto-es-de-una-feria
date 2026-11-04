import { getAnalytics, isSupported } from 'firebase/analytics';
import { initializeApp } from 'firebase/app';

// REEMPLAZÁ ESTE BLOQUE CON EL QUE COPIASTE DE FIREBASE:
const firebaseConfig = {
  apiKey: "AIzaSyCPQM_ppQppkLo0tzoEc2pGVY8XB1bz7Ho",
  authDomain: "esto-es-de-una-feria.firebaseapp.com",
  projectId: "esto-es-de-una-feria",
  storageBucket: "esto-es-de-una-feria.firebasestorage.app",
  messagingSenderId: "1002779607978",
  appId: "1:1002779607978:web:a1972c52498d2e495321d3",
  measurementId: "G-CLHX3QSQT4"
};

// Inicializamos Firebase
const app = initializeApp(firebaseConfig);

// Inicializamos Analytics de forma segura (evita errores cuando lo pases a app móvil)
let analytics;
isSupported().then(yes => {
  if (yes) analytics = getAnalytics(app);
});

export { analytics, app };

