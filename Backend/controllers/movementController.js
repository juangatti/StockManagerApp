import pool from "../config/db.js";

// -- CREATE PURCHASE (TRANSACTION) --
// Maneja tanto Barriles como Cristalería
export const createPurchase = async (req, res) => {
  const { supplier_id, invoice_number, items } = req.body;

  if (!supplier_id || !items || !Array.isArray(items) || items.length === 0) {
    return res
      .status(400)
      .json({ message: "Datos incompletos para la compra" });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Iterar sobre los items
    for (const item of items) {
      // --- LÓGICA BARRILES ---
      // Si tiene style_id y code, asumimos que es un barril
      if (item.style_id && item.code) {
        // 1. Crear stock_movement para el barril
        // Barriles no manejan stock acumulado en la misma lógica, ponemos 0/0 o 0/1.
        const [moveResult] = await connection.query(
          `INSERT INTO stock_movements 
           (supplier_id, invoice_number, type, description, fecha_movimiento, cantidad_unidades_movidas, stock_anterior, stock_nuevo) 
           VALUES (?, ?, 'COMPRA', ?, NOW(), 1, 0, 0)`,
          [supplier_id, invoice_number, `Compra Barril Código ${item.code}`]
        );
        const stockMovementId = moveResult.insertId;

        // 2. Insertar en kegs
        // Asumimos status DEFAULT 'STORED'
        await connection.query(
          `INSERT INTO kegs 
           (code, stock_movement_id, style_id, status, volume_initial, current_volume) 
           VALUES (?, ?, ?, 'STORED', ?, ?)`,
          [
            item.code,
            stockMovementId,
            item.style_id,
            item.volume_initial || 50,
            item.volume_initial || 50, // Set current_volume too
          ]
        );
      }

      // --- LÓGICA CRISTALERÍA ---
      // Si tiene glassware_id y quantity, asumimos que es vaso
      else if (item.glassware_id && item.quantity) {
        // Need to get current stock to populate stock_anterior/nuevo if required by strict schema,
        // OR we can trust the update later.
        // SCHEMA SAYS: stock_anterior float NOT NULL, stock_nuevo float NOT NULL.
        // So we MUST query it.
        const [glassRows] = await connection.query(
          "SELECT current_stock FROM glassware WHERE id = ?",
          [item.glassware_id]
        );
        const currentStock = glassRows[0]?.current_stock || 0;
        const newStock = currentStock + item.quantity;

        // 1. Crear stock_movement
        await connection.query(
          `INSERT INTO stock_movements 
             (supplier_id, invoice_number, glassware_id, cantidad_unidades_movidas, stock_anterior, stock_nuevo, type, description, fecha_movimiento) 
             VALUES (?, ?, ?, ?, ?, ?, 'COMPRA', ?, NOW())`,
          [
            supplier_id,
            invoice_number,
            item.glassware_id,
            item.quantity, // cantidad_unidades_movidas
            currentStock, // stock_anterior
            newStock, // stock_nuevo
            `Compra Cristalería ID ${item.glassware_id}`,
          ]
        );

        // 2. Actualizar Stock en glassware (Sumar)
        // ... (Next block updates it, but we already calculated newStock)

        await connection.query(
          "UPDATE glassware SET current_stock = current_stock + ? WHERE id = ?",
          [item.quantity, item.glassware_id]
        );
      }
    }

    await connection.commit();
    res.status(201).json({ message: "Compra registrada con éxito" });
  } catch (error) {
    await connection.rollback();
    console.error("Error processing purchase:", error);
    res
      .status(500)
      .json({ message: "Error al procesar la compra", error: error.message });
  } finally {
    connection.release();
  }
};

// -- CREATE GLASSWARE ADJUSTMENT (AJUSTE/ROTURA) --
export const createGlasswareAdjustment = async (req, res) => {
  const { glassware_id, quantity, reason } = req.body; // quantity debe ser negativo para resta (ej: -5)

  if (!glassware_id || !quantity) {
    return res.status(400).json({ message: "Faltan datos para el ajuste" });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Get current stock for mandatory columns
    const [glassRows] = await connection.query(
      "SELECT current_stock FROM glassware WHERE id = ?",
      [glassware_id]
    );
    const currentStock = glassRows[0]?.current_stock || 0;
    const newStock = currentStock + quantity; // quantity is negative for loss

    // 2. Crear stock_movement
    await connection.query(
      `INSERT INTO stock_movements 
             (glassware_id, cantidad_unidades_movidas, stock_anterior, stock_nuevo, type, description, fecha_movimiento) 
             VALUES (?, ?, ?, ?, 'AJUSTE', ?, NOW())`,
      [
        glassware_id,
        quantity,
        currentStock,
        newStock,
        reason || "Ajuste de inventario",
      ]
    );

    // 2. Actualizar Stock en glassware (Sumar la cantidad, que si es negativa restará)
    await connection.query(
      "UPDATE glassware SET current_stock = current_stock + ? WHERE id = ?",
      [quantity, glassware_id]
    );

    await connection.commit();
    res.status(201).json({ message: "Ajuste registrado con éxito" });
  } catch (error) {
    await connection.rollback();
    console.error("Error creating adjustment:", error);
    res.status(500).json({ message: "Error al registrar ajuste" });
  } finally {
    connection.release();
  }
};
