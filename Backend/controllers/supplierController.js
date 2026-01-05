import pool from "../config/db.js";

// -- GET ALL SUPPLIERS --
export const getSuppliers = async (req, res) => {
  try {
    // Solo devolvemos los activos por defecto, a menos que se quiera todo
    const [rows] = await pool.query(
      "SELECT * FROM suppliers WHERE active = 1 ORDER BY name ASC"
    );
    res.json(rows);
  } catch (error) {
    console.error("Error fetching suppliers:", error);
    res.status(500).json({ message: "Error al obtener proveedores" });
  }
};

// -- GET SINGLE SUPPLIER --
export const getSupplierById = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query("SELECT * FROM suppliers WHERE id = ?", [
      id,
    ]);
    if (rows.length === 0)
      return res.status(404).json({ message: "Proveedor no encontrado" });
    res.json(rows[0]);
  } catch (error) {
    console.error("Error fetching supplier by ID:", error);
    res.status(500).json({ message: "Error al obtener proveedor" });
  }
};

// -- CREATE SUPPLIER --
export const createSupplier = async (req, res) => {
  const { name, contact_info, tax_id } = req.body;

  if (!name) {
    return res
      .status(400)
      .json({ message: "El nombre del proveedor es obligatorio" });
  }

  try {
    const [result] = await pool.query(
      "INSERT INTO suppliers (name, contact_info, tax_id) VALUES (?, ?, ?)",
      [name, contact_info, tax_id]
    );
    res
      .status(201)
      .json({ id: result.insertId, message: "Proveedor creado exitosamente" });
  } catch (error) {
    console.error("Error creating supplier:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return res
        .status(409)
        .json({ message: "Ya existe un proveedor con ese nombre" });
    }
    res.status(500).json({ message: "Error al crear proveedor" });
  }
};

// -- UPDATE SUPPLIER --
export const updateSupplier = async (req, res) => {
  const { id } = req.params;
  const { name, contact_info, tax_id, active } = req.body;

  try {
    const [result] = await pool.query(
      "UPDATE suppliers SET name = ?, contact_info = ?, tax_id = ?, active = ? WHERE id = ?",
      [name, contact_info, tax_id, active, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Proveedor no encontrado" });
    }
    res.json({ message: "Proveedor actualizado correctamente" });
  } catch (error) {
    console.error("Error updating supplier:", error);
    res.status(500).json({ message: "Error al actualizar proveedor" });
  }
};

// -- DELETE SUPPLIER (Soft Delete) --
export const deleteSupplier = async (req, res) => {
  const { id } = req.params;
  try {
    // Borrado lógico
    const [result] = await pool.query(
      "UPDATE suppliers SET active = 0 WHERE id = ?",
      [id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Proveedor no encontrado" });
    }
    res.json({ message: "Proveedor eliminado (desactivado) correctamente" });
  } catch (error) {
    console.error("Error deleting supplier:", error);
    res.status(500).json({ message: "Error al eliminar proveedor" });
  }
};
