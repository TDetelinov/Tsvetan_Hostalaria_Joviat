// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Tus credenciales de la consola de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyB4qzaVYNTIX2OFIdQ9QgcE-f7KV7VUXbc",
  authDomain: "tsvetanhosteleriajoviat.firebaseapp.com",
  projectId: "tsvetanhosteleriajoviat",
  storageBucket: "tsvetanhosteleriajoviat.firebasestorage.app",
  messagingSenderId: "365829498443",
  appId: "1:365829498443:web:eafe31480a9aa8bb474fce",
  measurementId: "G-MWXLN11EXJ"
};

// 1. Inicializa la App
const app = initializeApp(firebaseConfig);

// 2. Exporta la base de datos
export const db = getFirestore(app);