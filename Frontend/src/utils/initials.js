/**
 * Genera iniciales a partir de un nombre completo o un nombre de usuario.
 * @param {string | null | undefined} fullName - El nombre completo (ej. "Juan Gatti")
 * @param {string | null | undefined} username - El nombre de usuario (ej. "juangatti")
 * @returns {string} Las iniciales (ej. "JG") o un placeholder.
 */
export const getInitials = (fullName, username) => {
  try {
    // Priorizamos el nombre completo (full_name)
    if (fullName && typeof fullName === "string" && fullName.trim() !== "") {
      const names = fullName.trim().split(" ");

      // Primera letra del primer nombre
      const firstInitial = names[0][0] || "";

      // Primera letra del último nombre (si hay más de un nombre)
      const lastInitial = names.length > 1 ? names[names.length - 1][0] : "";

      return (firstInitial + lastInitial).toUpperCase();
    }

    // Fallback al nombre de usuario (username) si no hay nombre completo
    if (username && typeof username === "string" && username.trim() !== "") {
      // Tomamos las primeras dos letras del username
      return username.substring(0, 2).toUpperCase();
    }

    // Fallback final si todo falla
    return "?";
  } catch (error) {
    console.error("Error al generar iniciales:", error);
    return "?"; // Retorno seguro en caso de error
  }
};
