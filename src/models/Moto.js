const db = require('../config/database');
const moment = require('moment-timezone');
const config = require('../config/server');

class Moto {
  static async getByPlayaAndDate(idPlaya, startDate, endDate) {
    try {
      const query = `
        SELECT Moto.*, NULL as total_pagar
        FROM Moto
        WHERE Moto.id_playa = ? 
          AND Moto.hora_entrada BETWEEN ? AND ?
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