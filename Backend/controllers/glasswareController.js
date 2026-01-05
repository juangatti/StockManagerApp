import pool from "../config/db.js";

// -- GET ALL GLASSWARE --
export const getAllGlassware = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM glassware ORDER BY name ASC"
    );
    res.json(rows);
  } catch (error) {
    console.error("Error fetching glassware:", error);
    res.status(500).json({ message: "Error al obtener cristalería" });
  }
};

// -- GET LOW STOCK GLASSWARE --
export const getLowStockGlassware = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM glassware WHERE current_stock <= min_stock"
    );
    res.json(rows);
  } catch (error) {
    console.error("Error fetching low stock glassware:", error);
    res
      .status(500)
      .json({ message: "Error al obtener cristalería con bajo stock" });
  }
};

// -- CREATE GLASSWARE --
export const createGlassware = async (req, res) => {
  const { name, capacity_ml, current_stock, min_stock } = req.body;

  if (!name) {
    return res.status(400).json({ message: "El nombre es obligatorio" });
  }

  try {
    // Definir defaults si no vienen
    const stock = current_stock || 0;
    const min = min_stock || 0;

    const [result] = await pool.query(
      "INSERT INTO glassware (name, capacity_ml, current_stock, min_stock) VALUES (?, ?, ?, ?)",
      [name, capacity_ml, stock, min]
    );
    res.status(201).json({
      id: result.insertId,
      message: "Tipo de vaso creado exitosamente",
    });
  } catch (error) {
    console.error("Error creating glassware:", error);
    res.status(500).json({ message: "Error al crear tipo de vaso" });
  }
};
