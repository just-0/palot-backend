const db = require('../config/database');
const moment = require('moment-timezone');
const config = require('../config/server');

class Boleta {
  static async create(idAuto, totalPagar, fechaEmision) {
    try {
      const query = "INSERT INTO Boleta (id_auto, total_pagar, fecha_emision) VALUES (?, ?, ?)";
      const result = await db.query(query, [idAuto, totalPagar, fechaEmision]);
      return result.insertId;
    } catch (error) {
      throw new Error(`Error creating boleta: ${error.message}`);
    }
  }

  static async getByPlayaAndDate(idPlaya, startDate, endDate) {
    try {
      const query = `
        SELECT 
            m.id_moto AS id,
            m.placa AS placa,
            m.hora_entrada AS hora_entrada,
            m.hora_salida AS hora_salida,
            m.state AS state,
            m.img AS img,
            NULL AS monto,
            NULL AS fecha_emision,
            'Moto' AS tipo
        FROM 
            Moto m
        WHERE 
            m.id_playa = ?
            AND m.state = 2
            AND m.hora_entrada BETWEEN ? AND ?
        UNION ALL
        SELECT 
            a.id_auto AS id,
            a.placa AS placa,
            a.hora_entrada AS hora_entrada,
            a.hora_salida AS hora_salida,
            a.state AS state,
            a.img AS img,
            b.total_pagar AS monto,
            b.fecha_emision AS fecha_emision,
            'Auto' AS tipo
        FROM 
            Auto a
        LEFT JOIN 
            Boleta b ON a.id_auto = b.id_auto
        WHERE 
            a.id_playa = ?
            AND a.state = 2
            AND a.hora_entrada BETWEEN ? AND ?
      `;
      
      const results = await db.query(query, [idPlaya, startDate, endDate, idPlaya, startDate, endDate]);
      return results;
    } catch (error) {
      throw new Error(`Error getting boletas: ${error.message}`);
    }
  }
}

module.exports = Boleta;