const db = require('../config/database');

class Cliente {
  static async create(idAuto, nombre, dniRuc) {
    try {
      const query = "INSERT INTO Cliente (id_auto, nombre, dni_ruc) VALUES (?, ?, ?)";
      const result = await db.query(query, [idAuto, nombre, dniRuc]);
      return result.insertId;
    } catch (error) {
      throw new Error(`Error creating cliente: ${error.message}`);
    }
  }

  static async getByAutoId(idAuto) {
    try {
      const query = "SELECT * FROM Cliente WHERE id_auto = ?";
      const results = await db.query(query, [idAuto]);
      return results[0] || null;
    } catch (error) {
      throw new Error(`Error getting cliente: ${error.message}`);
    }
  }

  static async getByMotoId(idMoto) {
    try {
      // Para motos, buscamos en boletas, tickets o facturas que tengan cliente asociado
      const query = `
        SELECT DISTINCT c.* FROM Cliente c
        WHERE c.id_cliente IN (
          SELECT DISTINCT id_cliente FROM Boleta WHERE id_moto = ? AND id_cliente IS NOT NULL
          UNION
          SELECT DISTINCT id_cliente FROM Ticket WHERE id_moto = ? AND id_cliente IS NOT NULL
          UNION
          SELECT DISTINCT id_cliente FROM Factura WHERE id_moto = ? AND id_cliente IS NOT NULL
        )
        LIMIT 1
      `;
      const results = await db.query(query, [idMoto, idMoto, idMoto]);
      return results[0] || null;
    } catch (error) {
      throw new Error(`Error getting cliente by moto: ${error.message}`);
    }
  }

  static async createDefaultClient(idAuto) {
    try {
      // Crear un cliente por defecto para casos sin cliente específico
      const defaultName = "Cliente General";
      const defaultDni = "00000000";
      
      return await this.create(idAuto, defaultName, defaultDni);
    } catch (error) {
      throw new Error(`Error creating default cliente: ${error.message}`);
    }
  }
}

module.exports = Cliente;