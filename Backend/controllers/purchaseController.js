import pool from "../config/db.js";

// -- CREATE PURCHASE (TRANSACTION) --
export const createPurchase = async (req, res) => {
  const { supplier_id, invoice_number, total_amount, notes, kegs } = req.body;

  if (
    !supplier_id ||
    !req.body.kegs ||
    !Array.isArray(kegs) ||
    kegs.length === 0
  ) {
    return res
      .status(400)
      .json({ message: "Faltan datos obligatorios (proveedor o barriles)" });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Insertar Compra
    const [purchaseResult] = await connection.query(
      "INSERT INTO purchases (supplier_id, invoice_number, total_amount, notes) VALUES (?, ?, ?, ?)",
      [supplier_id, invoice_number, total_amount, notes]
    );
    const purchaseId = purchaseResult.insertId;

    // 2. Procesar cada barril
    for (const keg of kegs) {
      const { style_id, code, cost_price, description } = keg;

      // Obtener defaults del estilo si no se especifican (opcional, aunque el schema tiene defaults en NULL o definidos)
      // En este caso, asumimos que el frontend o el usuario provee los overrides o dejamos que la base use defaults si aplicara,
      // pero el requerimiento dice "Datos copiados del estilo".
      // Vamos a leer el estilo para copiar valores.
      const [styleRows] = await connection.query(
        "SELECT * FROM beer_styles WHERE id = ?",
        [style_id]
      );

      if (styleRows.length === 0) {
        throw new Error(`Estilo con ID ${style_id} no encontrado`);
      }
      const style = styleRows[0];

      // Valores a insertar, usando los del estilo si no vienen en el request de barril (excepto costo y codigo)
      const abv = keg.abv || style.abv_default;
      const ibu = keg.ibu || style.ibu_default;
      const desc = description || style.description_default;
      const volume = keg.volume_initial || 50.0; // Default schema es 50

      await connection.query(
        `INSERT INTO kegs 
        (code, purchase_id, style_id, cost_price, volume_initial, description, abv, ibu, status) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'STORED')`,
        [code, purchaseId, style_id, cost_price, volume, desc, abv, ibu]
      );
    }

    await connection.commit();
    res.status(201).json({
      message: "Compra registrada con éxito",
      purchaseId,
      kegsCount: kegs.length,
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error processing purchase transaction:", error);
    res
      .status(500)
      .json({ message: "Error al procesar la compra", error: error.message });
  } finally {
    connection.release();
  }
};

// -- GET ALL PURCHASES --
export const getPurchases = async (req, res) => {
  try {
    const query = `
            SELECT p.*, s.name as supplier_name, COUNT(k.id) as kegs_count 
            FROM purchases p 
            JOIN suppliers s ON p.supplier_id = s.id 
            LEFT JOIN kegs k ON p.id = k.purchase_id 
            GROUP BY p.id 
            ORDER BY p.purchase_date DESC
        `;
    const [rows] = await pool.query(query);
    res.json(rows);
  } catch (error) {
    console.error("Error getting purchases:", error);
    res.status(500).json({ message: "Error al obtener compras" });
  }
};

// -- GET PURCHASE DETAILS --
export const getPurchaseById = async (req, res) => {
  const { id } = req.params;
  try {
    const [purchaseRows] = await pool.query(
      "SELECT * FROM purchases WHERE id = ?",
      [id]
    );
    if (purchaseRows.length === 0)
      return res.status(404).json({ message: "Compra no encontrada" });

    const [kegsRows] = await pool.query(
      "SELECT * FROM kegs WHERE purchase_id = ?",
      [id]
    );

    res.json({ purchase: purchaseRows[0], kegs: kegsRows });
  } catch (error) {
    console.error("Error getting purchase details:", error);
    res.status(500).json({ message: "Error al obtener detalle de compra" });
  }
};
