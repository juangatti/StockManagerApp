import { useState, useEffect } from "react";

// Hook simple que espera 'delay' ms después de que 'value' deja de cambiar.
export function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Configura un temporizador para actualizar el valor debounced después del delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Limpia el temporizador si el valor cambia (o al desmontar)
    // Esto evita que el valor se actualice si el usuario sigue escribiendo
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]); // Solo se re-ejecuta si value o delay cambian

  return debouncedValue;
}
