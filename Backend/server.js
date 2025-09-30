const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");

const app = express();
const PORT = 5000;

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
});

app.use(cors());
app.use(express.json());

app.get("/api/pong", (req, res) => {
  res.json({ message: "pong" });
});

app.get("/api/stock", async (req, res) => {
  try {
    const query = `
      SELECT 
        si.id,
        si.nombre_item,
        si.stock_unidades,
        si.equivalencia_ml,
        si.prioridad_consumo,
        i.nombre AS ingrediente_padre 
      FROM stock_items AS si
      JOIN ingredientes AS i ON si.ingrediente_id = i.id
      ORDER BY i.nombre, si.prioridad_consumo;
    `;

    const [rows] = await pool.query(query);
    res.json(rows);
  } catch (error) {
    console.error("Error al consultar el stock", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/api/stock/totales", async (req, res) => {
  try {
    const query = `
      SELECT
        -- Si agrupar_totales es TRUE, el nombre es el del ingrediente.
        -- Si es FALSE, el nombre es el del item físico.
        CASE
          WHEN i.agrupar_totales = TRUE THEN i.nombre
          ELSE si.nombre_item
        END AS display_nombre,
        
        -- El cálculo de litros sigue siendo el mismo
        SUM(si.stock_unidades * si.equivalencia_ml) / 1000 AS total_litros
        
      FROM stock_items AS si
      JOIN ingredientes AS i ON si.ingrediente_id = i.id
      
      -- El GROUP BY también usa la misma lógica del CASE
      GROUP BY display_nombre
      ORDER BY display_nombre;
    `;
    const queryResult = await pool.query(query);
    const rows = queryResult[0];
    res.json(rows);
  } catch (error) {
    console.error("Error al calcular los totales", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/api/stock/compras", async (req, res) => {
  // Esperamos recibir un array de items, ej: [{ itemId: 1, cantidad: 12, descripcion: "Compra semanal" }]
  const itemsComprados = req.body;

  if (
    !itemsComprados ||
    !Array.isArray(itemsComprados) ||
    itemsComprados.length === 0
  ) {
    return res
      .status(400)
      .json({ message: "Datos de la compra inválidos o vacíos." });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction(); // Iniciamos la transacción

    for (const item of itemsComprados) {
      // 1. Obtenemos el stock actual para registrarlo
      const [stockActualRows] = await connection.query(
        "SELECT stock_unidades FROM stock_items WHERE id = ?",
        [item.itemId]
      );
      if (stockActualRows.length === 0) {
        throw new Error(`El item con ID ${item.itemId} no fue encontrado.`);
      }
      const stockAnterior = stockActualRows[0].stock_unidades;
      const stockNuevo = stockAnterior + item.cantidad;

      // 2. Actualizamos el stock en la tabla principal
      await connection.query(
        "UPDATE stock_items SET stock_unidades = ? WHERE id = ?",
        [stockNuevo, item.itemId]
      );

      // 3. Insertamos el registro en la tabla de movimientos
      await connection.query(
        `INSERT INTO stock_movements 
         (item_id, tipo_movimiento, cantidad_unidades_movidas, stock_anterior, stock_nuevo, descripcion) 
         VALUES (?, 'COMPRA', ?, ?, ?, ?)`,
        [
          item.itemId,
          item.cantidad,
          stockAnterior,
          stockNuevo,
          item.descripcion || "Compra",
        ]
      );
    }

    await connection.commit(); // Si todo salió bien, confirmamos los cambios
    res.status(200).json({
      message: "Compra registrada y stock actualizado correctamente.",
    });
  } catch (error) {
    await connection.rollback(); // Si algo falló, revertimos todos los cambios
    console.error("Error al registrar la compra:", error);
    res
      .status(500)
      .json({ message: "Error al registrar la compra.", error: error.message });
  } finally {
    connection.release(); // Liberamos la conexión
  }
});

app.post("/api/stock/ajuste", async (req, res) => {
  // Esperamos un objeto, ej: { itemId: 1, conteoReal: 11.8, descripcion: "Conteo semanal" }
  const { itemId, conteoReal, descripcion } = req.body;

  if (itemId === undefined || conteoReal === undefined) {
    return res
      .status(400)
      .json({ message: "Faltan datos para el ajuste (itemId, conteoReal)." });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Obtenemos el stock actual del sistema para calcular la diferencia
    const [stockActualRows] = await connection.query(
      "SELECT stock_unidades FROM stock_items WHERE id = ? FOR UPDATE",
      [itemId]
    );
    if (stockActualRows.length === 0) {
      throw new Error(`El item con ID ${itemId} no fue encontrado.`);
    }
    const stockAnterior = stockActualRows[0].stock_unidades;

    // 2. Calculamos la diferencia
    const cantidadMovida = conteoReal - stockAnterior;

    // Solo procedemos si hay un cambio real
    if (cantidadMovida !== 0) {
      // 3. Actualizamos el stock en la tabla principal con el conteo real
      await connection.query(
        "UPDATE stock_items SET stock_unidades = ? WHERE id = ?",
        [conteoReal, itemId]
      );

      // 4. Insertamos el registro del ajuste en la tabla de movimientos
      await connection.query(
        `INSERT INTO stock_movements 
             (item_id, tipo_movimiento, cantidad_unidades_movidas, stock_anterior, stock_nuevo, descripcion) 
             VALUES (?, 'AJUSTE', ?, ?, ?, ?)`,
        [
          itemId,
          cantidadMovida,
          stockAnterior,
          conteoReal,
          descripcion || "Ajuste por conteo físico",
        ]
      );
    }

    await connection.commit();
    res.status(200).json({
      message: `Ajuste registrado. Se movieron ${cantidadMovida.toFixed(
        2
      )} unidades.`,
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error al registrar el ajuste:", error);
    res
      .status(500)
      .json({ message: "Error al registrar el ajuste.", error: error.message });
  } finally {
    connection.release();
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
