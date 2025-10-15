// src/hooks/useInactivityTimeout.js
import { useEffect, useRef } from "react";

export function useInactivityTimeout(logoutAction, timeout = 15 * 60 * 1000) {
  // Por defecto: 15 minutos
  const timerRef = useRef(null);

  const resetTimer = () => {
    // Limpia el temporizador anterior si existe
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    // Crea un nuevo temporizador
    timerRef.current = setTimeout(() => {
      // Cuando el temporizador se completa, ejecuta la acción de logout
      logoutAction();
    }, timeout);
  };

  useEffect(() => {
    // Lista de eventos que consideramos como "actividad"
    const activityEvents = ["mousemove", "keydown", "click", "scroll"];

    // Función que se ejecuta cada vez que hay actividad
    const handleActivity = () => {
      resetTimer();
    };

    // Añade los listeners para cada evento
    activityEvents.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    // Inicia el temporizador por primera vez
    resetTimer();

    // --- Función de limpieza ---
    // Esto es crucial. Se ejecuta cuando el componente que usa el hook se desmonta (ej: al hacer logout manual).
    return () => {
      // Limpia el último temporizador
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      // Elimina todos los listeners para evitar fugas de memoria
      activityEvents.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [logoutAction, timeout]); // El efecto se vuelve a ejecutar si la acción o el tiempo cambian

  // Este hook no necesita devolver nada, solo ejecuta su lógica interna.
}
