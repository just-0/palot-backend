const db = require('../config/database');
const moment = require('moment-timezone');
const config = require('../config/server');

class Moto {
  static async getByPlayaAndDate(idPlaya, startDate, endDate) {
    try {
      const query = `
        SELECT 
          Moto.*,
          COALESCE(Boleta.total_pagar, Ticket.total_pagar, Factura.total_pagar) AS total_pagar,
          CASE 
            WHEN Boleta.id_boleta IS NOT NULL THEN 'Boleta'
            WHEN Ticket.id_ticket IS NOT NULL THEN 'Ticket'
            WHEN Factura.id_factura IS NOT NULL THEN 'Factura'
            ELSE NULL
          END AS tipo_documento
        FROM Moto
        LEFT JOIN Boleta ON Moto.id_moto = Boleta.id_moto
        LEFT JOIN Ticket ON Moto.id_moto = Ticket.id_moto
        LEFT JOIN Factura ON Moto.id_moto = Factura.id_moto
        WHERE Moto.id_playa = ? 
          AND Moto.hora_entrada BETWEEN ? AND ?
        ORDER BY Moto.hora_entrada DESC
      `;
      const results = await db.query(query, [idPlaya, startDate, endDate]);
      return results;
    } catch (error) {
      throw new Error(`Error getting motos: ${error.message}`);
    }
  }

  static async updateState(id, state) {
    try {
      const query = "UPDATE Moto SET state = ? WHERE id_moto = ?";
      const result = await db.query(query, [state, id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error updating moto state: ${error.message}`);
    }
  }

  static async updateExitTime(id, exitTime, state) {
    try {
      const query = "UPDATE Moto SET hora_salida = ?, state = ? WHERE id_moto = ?";
      const result = await db.query(query, [exitTime, state, id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error updating moto exit time: ${error.message}`);
    }
  }

  static async findById(id) {
    try {
      const query = "SELECT * FROM Moto WHERE id_moto = ?";
      const results = await db.query(query, [id]);
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      throw new Error(`Error finding moto: ${error.message}`);
    }
  }

  static async create(data) {
    try {
      const fechaEntrada = moment(data.horaEntrada)
        .tz(config.timezone)
        .format(process.env.DATE_FORMAT || "YYYY-MM-DD HH:mm:ss");

      const query = "INSERT INTO Moto (id_playa, placa, hora_entrada, state) VALUES (?, ?, ?, ?)";
      const result = await db.query(query, [data.id_playa, data.placa, fechaEntrada, data.state]);
      
      // Obtener el registro creado
      const selectQuery = "SELECT * FROM Moto WHERE id_moto = ?";
      const newMoto = await db.query(selectQuery, [result.insertId]);
      return newMoto[0];
    } catch (error) {
      throw new Error(`Error creating moto: ${error.message}`);
    }
  }
}

module.exports = Moto;