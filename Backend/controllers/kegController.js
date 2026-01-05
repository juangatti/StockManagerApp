import pool from "../config/db.js";

// -- CREATE MANUAL KEG --
export const createKeg = async (req, res) => {
  const { code, style_id, supplier_id, initial_volume, cost, purchase_date } =
    req.body;

  if (!code || !style_id || !supplier_id || !initial_volume) {
    return res.status(400).json({ message: "Faltan datos obligatorios" });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Create a "Manual" purchase record for this single keg
    const [purchaseResult] = await connection.query(
      "INSERT INTO purchases (supplier_id, purchase_date, total_cost, status, notes) VALUES (?, ?, ?, 'COMPLETED', 'Carga Manual')",
      [supplier_id, purchase_date || new Date(), cost || 0]
    );
    const purchaseId = purchaseResult.insertId;

    // 2. Insert the Keg
    await connection.query(
      "INSERT INTO kegs (code, style_id, purchase_id, initial_volume, current_volume, status, cost) VALUES (?, ?, ?, ?, ?, 'STORED', ?)",
      [code, style_id, purchaseId, initial_volume, initial_volume, cost || 0]
    );

    await connection.commit();
    res.status(201).json({ message: "Barril creado exitosamente" });
  } catch (error) {
    await connection.rollback();
    console.error("Error creating manual keg:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return res
        .status(409)
        .json({ message: "Ya existe un barril con ese código" });
    }
    res.status(500).json({ message: "Error al crear barril" });
  } finally {
    connection.release();
  }
};

// -- GET KEGS (optional filters) --
export const getKegs = async (req, res) => {
  try {
    const { status } = req.query;
    let query = `
      SELECT k.*, bs.name as style_name, bs.fantasy_name as style_fantasy_name, g.name as glassware_name, p.purchase_date, s.name as supplier_name
      FROM kegs k
      JOIN beer_styles bs ON k.style_id = bs.id
      LEFT JOIN glassware g ON bs.glassware_id = g.id
      JOIN purchases p ON k.purchase_id = p.id
      JOIN suppliers s ON p.supplier_id = s.id
    `;
    const params = [];
    if (status) {
      query += " WHERE k.status = ?";
      params.push(status);
    }
    query += " ORDER BY k.id DESC";

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error("Error fetching kegs:", error);
    res
      .status(500)
      .json({ message: "Error al obtener barriles", error: error.message });
  }
};

// -- GET SINGLE KEG --
export const getKegById = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(
      `
            SELECT k.*, bs.name as style_name 
            FROM kegs k 
            JOIN beer_styles bs ON k.style_id = bs.id 
            WHERE k.id = ?`,
      [id]
    );

    if (rows.length === 0)
      return res.status(404).json({ message: "Barril no encontrado" });
    res.json(rows[0]);
  } catch (error) {
    console.error("Error fetching keg:", error);
    res.status(500).json({ message: "Error al obtener barril" });
  }
};

// -- LIFECYCLE: TAP KEG (Pinchar) --
export const tapKeg = async (req, res) => {
  const { id } = req.params; // Keg ID
  const { tap_number } = req.body;

  if (!tap_number) {
    return res
      .status(400)
      .json({ message: "Se requiere el número de canilla" });
  }

  try {
    // Verificar si la canilla ya está ocupada
    const [occupied] = await pool.query(
      "SELECT id FROM kegs WHERE tap_number = ? AND status = 'TAPPED'",
      [tap_number]
    );

    if (occupied.length > 0) {
      return res.status(400).json({
        message: `La canilla ${tap_number} ya está ocupada por el barril #${occupied[0].id}`,
      });
    }

    const [result] = await pool.query(
      "UPDATE kegs SET status = 'TAPPED', tap_number = ?, tapped_at = NOW() WHERE id = ? AND status = 'STORED'",
      [tap_number, id]
    );

    if (result.affectedRows === 0) {
      // Verificar si existe o si estaba en status incorrecto
      const [check] = await pool.query("SELECT status FROM kegs WHERE id = ?", [
        id,
      ]);
      if (check.length === 0)
        return res.status(404).json({ message: "Barril no encontrado" });
      if (check[0].status !== "STORED")
        return res.status(400).json({
          message: `El barril no está en depósito (Estado actual: ${check[0].status})`,
        });
    }

    res.json({ message: `Barril pinchado en canilla ${tap_number}` });
  } catch (error) {
    console.error("Error tapping keg:", error);
    res.status(500).json({ message: "Error al pinchar barril" });
  }
};

// -- LIFECYCLE: EMPTY KEG (Vaciar) --
export const emptyKeg = async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.query(
      "UPDATE kegs SET status = 'EMPTY', tap_number = NULL, emptied_at = NOW() WHERE id = ? AND status = 'TAPPED'",
      [id]
    );

    if (result.affectedRows === 0) {
      const [check] = await pool.query("SELECT status FROM kegs WHERE id = ?", [
        id,
      ]);
      if (check.length === 0)
        return res.status(404).json({ message: "Barril no encontrado" });
      if (check[0].status !== "TAPPED")
        return res.status(400).json({
          message: `El barril no está pinchado (Estado actual: ${check[0].status})`,
        });
    }

    res.json({ message: "Barril marcado como vacío" });
  } catch (error) {
    console.error("Error emptying keg:", error);
    res.status(500).json({ message: "Error al vaciar barril" });
  }
};

// -- LIFECYCLE: RETURN KEGS (Devolver a proveedor) --
export const returnKegs = async (req, res) => {
  const { kegIds } = req.body; // Array de IDs

  if (!kegIds || !Array.isArray(kegIds) || kegIds.length === 0) {
    return res
      .status(400)
      .json({ message: "Se requiere un array de IDs de barriles" });
  }

  try {
    // mysql2/promise expande arrays en IN (?)
    const [result] = await pool.query(
      `UPDATE kegs 
       SET status = 'RETURNED', returned_at = NOW() 
       WHERE id IN (?) AND status = 'EMPTY'`,
      [kegIds]
    );

    res.json({
      message: "Barriles devueltos correctamente",
      count: result.affectedRows,
    });
  } catch (error) {
    console.error("Error returning kegs:", error);
    res.status(500).json({ message: "Error al devolver barriles" });
  }
};
