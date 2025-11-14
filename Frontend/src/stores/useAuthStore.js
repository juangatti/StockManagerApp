// Frontend/src/stores/useAuthStore.js
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_BASE_URL;

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (username, password) => {
        try {
          const response = await axios.post(`${API_URL}/auth/login`, {
            username,
            password,
          });

          // 'user' ahora contiene 'display_name' y 'full_name' desde el backend
          const { user, token } = response.data;

          set({ user, token, isAuthenticated: true });
          return { success: true };
        } catch (error) {
          console.error(
            "Error de login:",
            error.response?.data?.message || error.message
          );
          return {
            success: false,
            message:
              error.response?.data?.message || "Error al iniciar sesión.",
          };
        }
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
      },

      // NUEVA ACCIÓN: Para actualizar el store localmente después de guardar
      updateUserProfile: (profileData) => {
        set((state) => ({
          user: {
            ...state.user,
            ...profileData, // Fusiona los nuevos datos (ej. display_name, full_name)
          },
        }));
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);

export default useAuthStore;
