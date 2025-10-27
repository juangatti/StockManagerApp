/**
 * Construye el nombre completo de un item de stock.
 * @param {string} nombreMarca - El nombre de la marca.
 * @param {string|null} variacion - La variación del producto (puede ser null o vacío).
 * @param {number|string} cantidad - La cantidad por envase (ej: 750, 1000).
 * @param {string} unidad - La unidad de medida ('ml' o 'g').
 * @returns {string} El nombre completo formateado (ej: "Fernet Branca 750ml", "Azúcar 1000g").
 */
export const buildNombreCompleto = (
  nombreMarca,
  variacion,
  cantidad,
  unidad
) => {
  // Asegurarse de que nombreMarca no sea null o undefined
  const marca = nombreMarca || "Marca Desconocida";
  let parts = [marca];

  // Añadir variación si existe y no está vacía
  if (variacion && variacion.trim() !== "") {
    parts.push(variacion.trim());
  }

  // Asegurarse de que cantidad sea un número antes de formatear
  const cantidadNum = parseFloat(cantidad);
  if (!isNaN(cantidadNum)) {
    // Formatear cantidad (quitar .000 si es entero)
    const formattedCantidad =
      cantidadNum % 1 === 0 ? cantidadNum.toFixed(0) : cantidadNum.toString();
    // Añadir cantidad formateada y la unidad ('ml' o 'g')
    parts.push(`${formattedCantidad}${unidad || "?"}`); // Añadir '?' si la unidad falta
  } else {
    console.warn(
      `Cantidad inválida (${cantidad}) recibida en buildNombreCompleto para ${marca}`
    );
    parts.push(`?${unidad || "?"}`); // Placeholder si cantidad no es válida
  }

  return parts.join(" "); // Unir las partes con espacios
};

// Puedes añadir más funciones helper aquí en el futuro y exportarlas
