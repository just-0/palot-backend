const db = require('../config/database');

class Ticket {
  static async create(idAuto, idMoto, idCliente, totalPagar, fechaEmision) {
    try {
      const query = "INSERT INTO Ticket (id_auto, id_moto, id_cliente, total_pagar, fecha_emision) VALUES (?, ?, ?, ?, ?)";
      const result = await db.query(query, [idAuto, idMoto, idCliente, totalPagar, fechaEmision]);
      return result.insertId;
    } catch (error) {
      throw new Error(`Error creating ticket: ${error.message}`);
    }
  }

  static async getByPlayaAndDate(idPlaya, startDate, endDate) {
    try {
      const query = `
        SELECT 
            t.id_ticket,
            t.id_auto,
            t.id_moto,
            t.id_cliente,
            t.total_pagar,
            t.fecha_emision,
            COALESCE(a.placa, m.placa) AS placa,
            COALESCE(a.hora_entrada, m.hora_entrada) AS hora_entrada,
            COALESCE(a.hora_salida, m.hora_salida) AS hora_salida,
            CASE 
                WHEN a.id_auto IS NOT NULL THEN 'Auto'
                WHEN m.id_moto IS NOT NULL THEN 'Moto'
            END AS tipo,
            c.nombre AS cliente_nombre,
            c.dni_ruc AS cliente_dni
        FROM 
            Ticket t
        LEFT JOIN 
            Auto a ON t.id_auto = a.id_auto
        LEFT JOIN 
            Moto m ON t.id_moto = m.id_moto
        LEFT JOIN 
            Cliente c ON t.id_cliente = c.id_cliente
        WHERE 
            (a.id_playa = ? OR m.id_playa = ?)
            AND t.fecha_emision BETWEEN ? AND ?
        ORDER BY 
            t.fecha_emision DESC
      `;
      
      const results = await db.query(query, [idPlaya, idPlaya, startDate, endDate]);
      return results;
    } catch (error) {
      throw new Error(`Error getting tickets: ${error.message}`);
    }
  }
}

module.exports = Ticket;