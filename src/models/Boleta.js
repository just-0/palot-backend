const db = require('../config/database');
const moment = require('moment-timezone');
const config = require('../config/server');

class Boleta {
  static async create(idAuto, idMoto, idCliente, totalPagar, fechaEmision) {
    try {
      const query = "INSERT INTO Boleta (id_auto, id_moto, id_cliente, total_pagar, fecha_emision) VALUES (?, ?, ?, ?, ?)";
      const result = await db.query(query, [idAuto || null, idMoto || null, idCliente || null, totalPagar, fechaEmision]);
      return result.insertId;
    } catch (error) {
      throw new Error(`Error creating boleta: ${error.message}`);
    }
  }

  static async getByPlayaAndDate(idPlaya, startDate, endDate) {
    try {
      const query = `
        SELECT 
            a.id_auto AS id,
            a.placa AS placa,
            a.hora_entrada AS hora_entrada,
            a.hora_salida AS hora_salida,
            a.state AS state,
            a.image AS img,
            COALESCE(b.total_pagar, t.total_pagar, f.total_pagar) AS monto,
            COALESCE(b.fecha_emision, t.fecha_emision, f.fecha_emision) AS fecha_emision,
            CASE 
                WHEN b.id_boleta IS NOT NULL THEN 'Boleta'
                WHEN t.id_ticket IS NOT NULL THEN 'Ticket'
                WHEN f.id_factura IS NOT NULL THEN 'Factura'
                ELSE 'Sin Documento'
            END AS tipo_documento,
            'Auto' AS tipo_vehiculo
        FROM 
            Auto a
        LEFT JOIN 
            Boleta b ON a.id_auto = b.id_auto
        LEFT JOIN 
            Ticket t ON a.id_auto = t.id_auto
        LEFT JOIN 
            Factura f ON a.id_auto = f.id_auto
        WHERE 
            a.id_playa = ?
            AND a.state IN (3, 4)
            AND a.hora_entrada BETWEEN ? AND ?
        UNION ALL
        SELECT 
            m.id_moto AS id,
            m.placa AS placa,
            m.hora_entrada AS hora_entrada,
            m.hora_salida AS hora_salida,
            m.state AS state,
            m.image AS img,
            COALESCE(b.total_pagar, t.total_pagar, f.total_pagar) AS monto,
            COALESCE(b.fecha_emision, t.fecha_emision, f.fecha_emision) AS fecha_emision,
            CASE 
                WHEN b.id_boleta IS NOT NULL THEN 'Boleta'
                WHEN t.id_ticket IS NOT NULL THEN 'Ticket'
                WHEN f.id_factura IS NOT NULL THEN 'Factura'
                ELSE 'Sin Documento'
            END AS tipo_documento,
            'Moto' AS tipo_vehiculo
        FROM 
            Moto m
        LEFT JOIN 
            Boleta b ON m.id_moto = b.id_moto
        LEFT JOIN 
            Ticket t ON m.id_moto = t.id_moto
        LEFT JOIN 
            Factura f ON m.id_moto = f.id_moto
        WHERE 
            m.id_playa = ?
            AND m.state IN (3, 4)
            AND m.hora_entrada BETWEEN ? AND ?
        ORDER BY hora_entrada DESC
      `;
      
      const results = await db.query(query, [idPlaya, startDate, endDate, idPlaya, startDate, endDate]);
      return results;
    } catch (error) {
      throw new Error(`Error getting boletas: ${error.message}`);
    }
  }
}

module.exports = Boleta;