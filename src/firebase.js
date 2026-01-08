import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// --- TU CONFIGURACIÓN DE FIREBASE ---
// Reemplaza los valores entre comillas con los que copiaste de la consola de Firebase.
const firebaseConfig = {
  apiKey: "TU_API_KEY",               // Ej: "AIzaSyD..."
  authDomain: "TU_PROYECTO.firebaseapp.com",
  projectId: "TU_PROYECTO_ID",        // Ej: "planificador-docente-xyz"
  storageBucket: "TU_PROYECTO.appspot.com",
  messagingSenderId: "TUS_NUMEROS",
  appId: "TU_APP_ID"                  // Ej: "1:123456789:web:..."
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Exportar los servicios para usarlos en el resto de la app
export const auth = getAuth(app);
export const db = getFirestore(app);

// Identificador único para separar datos si usas la misma BD para varias apps
// Puedes dejarlo como está o cambiarlo al nombre de tu colegio
export const appId = "ecomundo-v1";