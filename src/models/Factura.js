const db = require('../config/database');
const moment = require('moment-timezone');
const config = require('../config/server');

class Factura {
  static async create(idAuto, idMoto, idCliente, totalPagar, fechaEmision) {
    try {
      const query = "INSERT INTO Factura (id_auto, id_moto, id_cliente, total_pagar, fecha_emision) VALUES (?, ?, ?, ?, ?)";
      const result = await db.query(query, [idAuto || null, idMoto || null, idCliente || null, totalPagar, fechaEmision]);
      return result.insertId;
    } catch (error) {
      throw new Error(`Error creating factura: ${error.message}`);
    }
  }

  static async getByPlayaAndDate(idPlaya, startDate, endDate) {
    try {
      const query = `
        SELECT 
            f.id_factura AS id,
            COALESCE(a.placa, m.placa) AS placa,
            COALESCE(a.hora_entrada, m.hora_entrada) AS hora_entrada,
            COALESCE(a.hora_salida, m.hora_salida) AS hora_salida,
            COALESCE(a.state, m.state) AS state,
            COALESCE(a.image, m.image) AS img,
            f.total_pagar AS monto,
            f.fecha_emision AS fecha_emision,
            CASE 
                WHEN f.id_auto IS NOT NULL THEN 'Auto'
                WHEN f.id_moto IS NOT NULL THEN 'Moto'
            END AS tipo
        FROM 
            Factura f
        LEFT JOIN 
            Auto a ON f.id_auto = a.id_auto
        LEFT JOIN 
            Moto m ON f.id_moto = m.id_moto
        WHERE 
            (a.id_playa = ? OR m.id_playa = ?)
            AND COALESCE(a.state, m.state) IN (3, 4)
            AND COALESCE(a.hora_entrada, m.hora_entrada) BETWEEN ? AND ?
      `;
      
      const results = await db.query(query, [idPlaya, idPlaya, startDate, endDate]);
      return results;
    } catch (error) {
      throw new Error(`Error getting facturas: ${error.message}`);
    }
  }
}

module.exports = Factura;