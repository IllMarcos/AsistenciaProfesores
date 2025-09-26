// firebaseConfig.js

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Reemplaza esto con la configuración de tu propio proyecto de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyC9i59PWDHyJo7WlN8y1l9Ew_b_SxuCbpA",
  authDomain: "asistenciasapp-98589.firebaseapp.com",
  projectId: "asistenciasapp-98589",
  storageBucket: "asistenciasapp-98589.firebasestorage.app",
  messagingSenderId: "423516730869",
  appId: "1:423516730869:web:837a795f78a3f0a35e9cbc",
  measurementId: "G-YSFXDNCWT7"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);

// Exporta los servicios que usaremos
export const auth = getAuth(app);
export const db = getFirestore(app);