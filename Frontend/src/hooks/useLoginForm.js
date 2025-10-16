import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../stores/useAuthStore";

const REMEMBERED_USER_KEY = "mauerAppRememberedUser";

export function useLoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [rememberUser, setRememberUser] = useState(false);
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  // Efecto para cargar el usuario recordado al montar
  useEffect(() => {
    const rememberedUsername = localStorage.getItem(REMEMBERED_USER_KEY);
    if (rememberedUsername) {
      setUsername(rememberedUsername);
      setRememberUser(true);
    }
  }, []); // El array vacío asegura que solo se ejecute al montar

  // Manejador del envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    const result = await login(username, password);
    setIsLoading(false);

    if (result.success) {
      // Lógica para guardar o borrar el usuario
      if (rememberUser) {
        localStorage.setItem(REMEMBERED_USER_KEY, username);
      } else {
        localStorage.removeItem(REMEMBERED_USER_KEY);
      }
      navigate("/dashboard"); // Redirige al home tras un login exitoso
    } else {
      setError(result.message);
    }
  };

  // Retornamos todos los estados y manejadores que el componente necesita
  return {
    username,
    setUsername,
    password,
    setPassword,
    rememberUser,
    setRememberUser,
    error,
    isLoading,
    handleSubmit,
  };
}
