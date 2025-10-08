import axios from "axios";
import useAuthStore from "../stores/useAuthStore";

// 1. Creamos una instancia de Axios con la URL base de nuestro backend
const api = axios.create({
  baseURL: "http://localhost:5000/api",
});

// 2. Creamos un "interceptor" de peticiones
// Esta función se ejecutará ANTES de que cada petición sea enviada
api.interceptors.request.use(
  (config) => {
    // Obtenemos el token desde nuestro store de Zustand
    const token = useAuthStore.getState().token;

    // Si el token existe, lo añadimos a los encabezados de la petición
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    // Manejo de errores
    return Promise.reject(error);
  }
);

export default api;
