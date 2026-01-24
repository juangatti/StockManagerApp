import pool from "../config/db.js";

/**
 * Registra una compra unificada (Factura + Barriles o Items de Stock)
 * POST /api/purchases
 */
export const registerPurchase = async (req, res) => {
  const {
    supplier_id,
    invoice_number,
    invoice_date,
    total_amount,
    main_category,
    notes,
    items, // Para stock general: [{ itemId, quantity, unitCost }]
    kegs, // Para cerveza: [{ style_id, code, cost_price, description, volume }]
  } = req.body;

  // Validaciones básicas
  if (
    !supplier_id ||
    !invoice_number ||
    !invoice_date ||
    !total_amount ||
    !main_category
  ) {
    return res
      .status(400)
      .json({ message: "Faltan datos de la cabecera de la factura." });
  }

  // Validación de sumas (Opcional en backend, pero recomendada)
  let calculatedTotal = 0;
  if (main_category === "cerveza" && kegs) {
    calculatedTotal = kegs.reduce(
      (sum, k) => sum + parseFloat(k.cost_price || 0),
      0,
    );
  } else if (items) {
    calculatedTotal = items.reduce(
      (sum, i) =>
        sum + parseFloat(i.quantity || 0) * parseFloat(i.unitCost || 0),
      0,
    );
  }

  // Permitimos una pequeña tolerancia por redondeo si es necesario (ej: 0.01)
  if (Math.abs(calculatedTotal - parseFloat(total_amount)) > 0.1) {
    return res.status(400).json({
      message: `El total de la factura ($${total_amount}) no coincide con la suma de los ítems ($${calculatedTotal.toFixed(2)}).`,
    });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Crear el registro de la compra (Factura)
    const [purchaseResult] = await connection.query(
      `INSERT INTO purchases (supplier_id, invoice_number, invoice_date, total_amount, main_category, notes) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        supplier_id,
        invoice_number,
        invoice_date,
        total_amount,
        main_category,
        notes,
      ],
    );
    const purchaseId = purchaseResult.insertId;

    // 2. Crear un evento de stock para trazabilidad histórica
    const [eventoResult] = await connection.query(
      "INSERT INTO eventos_stock (tipo_evento, descripcion) VALUES ('COMPRA', ?)",
      [`Factura ${invoice_number} - ${main_category.toUpperCase()}`],
    );
    const eventoId = eventoResult.insertId;

    // 3. Procesar dependiendo de la categoría
    if (main_category === "cerveza") {
      if (!kegs || !Array.isArray(kegs))
        throw new Error("No se proporcionaron datos de los barriles.");

      for (const keg of kegs) {
        const { style_id, code, cost_price, description, volume } = keg;

        // Insertar barril
        await connection.query(
          `INSERT INTO kegs (code, purchase_id, style_id, cost_price, volume_initial, current_volume, description, status) 
           VALUES (?, ?, ?, ?, ?, ?, ?, 'STORED')`,
          [
            code,
            purchaseId,
            style_id,
            cost_price,
            volume || 50.0,
            volume || 50.0,
            description || "",
          ],
        );

        // Opcional: Registrar movimiento en stock_movements para el barril?
        // El requerimiento dice "vincular purchase_id a stock_movements y kegs".
        // Para barriles, el registro en 'kegs' con purchase_id es suficiente, pero
        // podemos añadir un movimiento genérico si el sistema lo requiere.
      }
    } else {
      // Categorías generales: comida, bebidas, mantenimiento
      if (!items || !Array.isArray(items))
        throw new Error("No se proporcionaron ítems para la compra.");

      for (const item of items) {
        const { itemId, quantity, unitCost } = item;

        // Obtener stock actual para el registro del movimiento
        const [stockRows] = await connection.query(
          "SELECT stock_unidades FROM stock_items WHERE id = ? FOR UPDATE",
          [itemId],
        );
        if (stockRows.length === 0)
          throw new Error(`El ítem con ID ${itemId} no existe.`);

        const stockAnterior = stockRows[0].stock_unidades;
        const stockNuevo = stockAnterior + parseFloat(quantity);

        // Actualizar stock_items
        await connection.query(
          "UPDATE stock_items SET stock_unidades = ? WHERE id = ?",
          [stockNuevo, itemId],
        );

        // Crear registro en stock_movements
        await connection.query(
          `INSERT INTO stock_movements 
           (type, item_id, tipo_movimiento, cantidad_unidades_movidas, stock_anterior, stock_nuevo, description, evento_id, purchase_id, supplier_id, invoice_number) 
           VALUES ('COMPRA', ?, 'ENTRADA', ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            itemId,
            quantity,
            stockAnterior,
            stockNuevo,
            `Ingreso por Factura ${invoice_number}`,
            eventoId,
            purchaseId,
            supplier_id,
            invoice_number,
          ],
        );
      }
    }

    await connection.commit();
    res.status(201).json({
      success: true,
      message: "Factura y stock registrados correctamente.",
      purchaseId,
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error en transacción de compra:", error);
    res.status(500).json({
      success: false,
      message: "Error al procesar la compra.",
      error: error.message,
    });
  } finally {
    connection.release();
  }
};

/**
 * Obtiene el listado de compras/facturas
 */
export const getPurchases = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT p.*, s.name as supplier_name 
      FROM purchases p
      JOIN suppliers s ON p.supplier_id = s.id
      ORDER BY p.invoice_date DESC
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener compras." });
  }
};

// -- GET PURCHASE DETAILS --
export const getPurchaseById = async (req, res) => {
  const { id } = req.params;
  try {
    const [purchaseRows] = await pool.query(
      "SELECT * FROM purchases WHERE id = ?",
      [id],
    );
    if (purchaseRows.length === 0)
      return res.status(404).json({ message: "Compra no encontrada" });

    const [kegsRows] = await pool.query(
      "SELECT * FROM kegs WHERE purchase_id = ?",
      [id],
    );

    res.json({ purchase: purchaseRows[0], kegs: kegsRows });
  } catch (error) {
    console.error("Error getting purchase details:", error);
    res.status(500).json({ message: "Error al obtener detalle de compra" });
  }
};
