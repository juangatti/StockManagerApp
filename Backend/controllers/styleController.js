import pool from "../config/db.js";

// -- GET ALL STYLES --
// -- GET ALL STYLES --
export const getStyles = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT bs.*, g.name as recommended_glass 
       FROM beer_styles bs 
       LEFT JOIN glassware g ON bs.glassware_id = g.id 
       WHERE bs.active = 1 
       ORDER BY bs.fantasy_name ASC, bs.name ASC`
    );
    res.json(rows);
  } catch (error) {
    console.error("Error fetching styles:", error);
    res.status(500).json({ message: "Error al obtener estilos" });
  }
};

// -- GET SINGLE STYLE --
export const getStyleById = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query("SELECT * FROM beer_styles WHERE id = ?", [
      id,
    ]);
    if (rows.length === 0)
      return res.status(404).json({ message: "Estilo no encontrado" });
    res.json(rows[0]);
  } catch (error) {
    console.error("Error fetching style by ID:", error);
    res.status(500).json({ message: "Error al obtener estilo" });
  }
};

// -- CREATE STYLE --
export const createStyle = async (req, res) => {
  const {
    name,
    fantasy_name,
    description_default,
    abv_default,
    ibu_default,
    glassware_id,
  } = req.body;

  if (!name) {
    return res
      .status(400)
      .json({ message: "El nombre del estilo es obligatorio" });
  }

  try {
    const [result] = await pool.query(
      "INSERT INTO beer_styles (name, fantasy_name, description_default, abv_default, ibu_default, glassware_id) VALUES (?, ?, ?, ?, ?, ?)",
      [
        name,
        fantasy_name,
        description_default,
        abv_default,
        ibu_default,
        glassware_id,
      ]
    );
    res
      .status(201)
      .json({ id: result.insertId, message: "Estilo creado exitosamente" });
  } catch (error) {
    console.error("Error creating style:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return res
        .status(409)
        .json({ message: "Ya existe un estilo con ese nombre" });
    }
    res.status(500).json({ message: "Error al crear estilo" });
  }
};

// -- UPDATE STYLE --
export const updateStyle = async (req, res) => {
  const { id } = req.params;
  const {
    name,
    fantasy_name,
    description_default,
    abv_default,
    ibu_default,
    glassware_id,
    active,
  } = req.body;

  try {
    const [result] = await pool.query(
      "UPDATE beer_styles SET name = ?, fantasy_name = ?, description_default = ?, abv_default = ?, ibu_default = ?, glassware_id = ?, active = ? WHERE id = ?",
      [
        name,
        fantasy_name,
        description_default,
        abv_default,
        ibu_default,
        glassware_id,
        active,
        id,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Estilo no encontrado" });
    }
    res.json({ message: "Estilo actualizado correctamente" });
  } catch (error) {
    console.error("Error updating style:", error);
    res.status(500).json({ message: "Error al actualizar estilo" });
  }
};

// -- DELETE STYLE (Soft Delete) --
export const deleteStyle = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query(
      "UPDATE beer_styles SET active = 0 WHERE id = ?",
      [id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Estilo no encontrado" });
    }
    res.json({ message: "Estilo eliminado (desactivado) correctamente" });
  } catch (error) {
    console.error("Error deleting style:", error);
    res.status(500).json({ message: "Error al eliminar estilo" });
  }
};
