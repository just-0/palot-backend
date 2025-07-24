const db = require("../config/database");
const moment = require("moment-timezone");
const config = require("../config/server");

class Auto {
  static async getByPlayaAndDate(idPlaya, startDate, endDate) {
    try {
      const query = `
        SELECT 
          Auto.*,
          COALESCE(Boleta.total_pagar, Ticket.total_pagar, Factura.total_pagar) AS total_pagar,
          CASE 
            WHEN Boleta.id_boleta IS NOT NULL THEN 'Boleta'
            WHEN Ticket.id_ticket IS NOT NULL THEN 'Ticket'
            WHEN Factura.id_factura IS NOT NULL THEN 'Factura'
            ELSE NULL
          END AS tipo_documento
        FROM Auto
        LEFT JOIN Boleta ON Auto.id_auto = Boleta.id_auto
        LEFT JOIN Ticket ON Auto.id_auto = Ticket.id_auto
        LEFT JOIN Factura ON Auto.id_auto = Factura.id_auto
        WHERE Auto.id_playa = ?
          AND Auto.hora_entrada BETWEEN ? AND ?
        ORDER BY Auto.hora_entrada DESC
      `;
      const results = await db.query(query, [idPlaya, startDate, endDate]);
      return results;
    } catch (error) {
      throw new Error(`Error getting autos: ${error.message}`);
    }
  }

  static async updateState(id, state) {
    try {
      const query = "UPDATE Auto SET state = ? WHERE id_auto = ?";
      const result = await db.query(query, [state, id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error updating auto state: ${error.message}`);
    }
  }

  static async updateExitTime(id, exitTime, state) {
    try {
      const query =
        "UPDATE Auto SET hora_salida = ?, state = ? WHERE id_auto = ?";
      const result = await db.query(query, [exitTime, state, id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error updating auto exit time: ${error.message}`);
    }
  }

  static async findById(id) {
    try {
      const query = "SELECT * FROM Auto WHERE id_auto = ?";
      const results = await db.query(query, [id]);
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      throw new Error(`Error finding auto: ${error.message}`);
    }
  }

  static async create(data) {
    try {
      const fechaEntrada = moment(data.horaEntrada)
        .tz(config.timezone)
        .format(process.env.DATE_FORMAT || "YYYY-MM-DD HH:mm:ss");

      const query =
        "INSERT INTO Auto (id_playa, placa, hora_entrada, image, state) VALUES (?, ?, ?, ?, ?)";
      const result = await db.query(query, [
        data.id_playa,
        data.placa,
        fechaEntrada,
        data.image || null,
        data.state,
      ]);

      // Obtener el registro creado
      const selectQuery = "SELECT * FROM Auto WHERE id_auto = ?";
      const newAuto = await db.query(selectQuery, [result.insertId]);
      return newAuto[0];
    } catch (error) {
      throw new Error(`Error creating auto: ${error.message}`);
    }
  }

  static async insertBulk(plates, idPlaya) {
    try {
      if (!plates || plates.length === 0) return;

      const values = plates.map((plate) => [
        idPlaya,
        plate.plateNumber,
        this.convertCaptureTimeToDate(plate.captureTime),
        plate.picName,
      ]);

      const query =
        "INSERT INTO Auto (id_playa, placa, hora_entrada, image) VALUES ?";
      await db.query(query, [values]);
    } catch (error) {
      throw new Error(`Error inserting bulk autos: ${error.message}`);
    }
  }

  static async findExistingPlates(plateNumbers) {
    try {
      const query = "SELECT placa, hora_entrada FROM Auto WHERE placa IN (?)";
      const results = await db.query(query, [plateNumbers]);
      return new Set(results.map((row) => `${row.placa}-${row.hora_entrada}`));
    } catch (error) {
      throw new Error(`Error finding existing plates: ${error.message}`);
    }
  }

  static convertCaptureTimeToDate(captureTime) {
    const year = captureTime.substring(0, 4);
    const month = captureTime.substring(4, 6);
    const day = captureTime.substring(6, 8);
    const hour = captureTime.substring(9, 11);
    const minute = captureTime.substring(11, 13);
    const second = captureTime.substring(13, 15);

    const formattedDate = `${year}-${month}-${day}T${hour}:${minute}:${second}`;
    return new Date(formattedDate);
  }

  static async findActiveByPlate(placa, idPlaya) {
    try {
      const query =
        "SELECT * FROM Auto WHERE placa = ? AND id_playa = ? AND hora_salida IS NULL LIMIT 1";
      const results = await db.query(query, [placa, idPlaya]);
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      throw new Error(`Error finding active auto by plate: ${error.message}`);
    }
  }
}

module.exports = Auto;
