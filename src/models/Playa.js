const db = require('../config/database');

class Playa {
  static async getAll() {
    try {
      const query = "SELECT * FROM Playa";
      const results = await db.query(query);
      return results;
    } catch (error) {
      throw new Error(`Error getting all playas: ${error.message}`);
    }
  }

  static async findById(id) {
    try {
      const query = "SELECT * FROM Playa WHERE id_playa = ?";
      const results = await db.query(query, [id]);
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      throw new Error(`Error finding playa: ${error.message}`);
    }
  }

  static async getById(id) {
    return this.findById(id);
  }

  static async create(data) {
    try {
      const query = `
        INSERT INTO Playa (nombre_admin, nombre, direccion, tarifaAuto, tarifaMoto, facturacion) 
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      const result = await db.query(query, [
        data.nombre_admin,
        data.nombre,
        data.direccion || null,
        data.tarifaAuto || null,
        data.tarifaMoto || null,
        data.facturacion || false
      ]);
      return result.insertId;
    } catch (error) {
      throw new Error(`Error creating playa: ${error.message}`);
    }
  }

  static async update(id, data) {
    try {
      const query = `
        UPDATE Playa 
        SET nombre = ?, direccion = ?, tarifaAuto = ?, tarifaMoto = ?, facturacion = ?
        WHERE id_playa = ?
      `;
      const result = await db.query(query, [
        data.nombre,
        data.direccion || null,
        data.tarifaAuto || null,
        data.tarifaMoto || null,
        data.facturacion || false,
        id
      ]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error updating playa: ${error.message}`);
    }
  }

  /**
   * Busca una playa por la IP de su cámara configurada
   * Intenta múltiples patrones de búsqueda en cam_url
   * Si no encuentra una específica, usa la primera playa abierta como fallback
   * @param {string} sourceIP - IP de origen de la cámara
   * @returns {Object|null} - Datos de la playa encontrada o null
   */
  static async findByCameraIP(sourceIP) {
    try {
      // Buscar playa que tenga configurada la URL de cámara con esta IP
      let query = "SELECT * FROM Playa WHERE cam_url LIKE ? OR cam_url LIKE ? OR cam_url LIKE ?";
      let searchPatterns = [
        `%${sourceIP}%`,           // IP en cualquier parte de la URL
        `http://${sourceIP}%`,     // IP al inicio con http
        `https://${sourceIP}%`     // IP al inicio con https
      ];
      
      let results = await db.query(query, searchPatterns);
      
      if (results.length > 0) {
        return results[0];
      }

      // Si no se encuentra por cam_url, buscar cualquier playa abierta como fallback
      query = "SELECT * FROM Playa WHERE estado = 'abierto' ORDER BY id_playa ASC LIMIT 1";
      results = await db.query(query);
      
      if (results.length > 0) {
        return results[0];
      }

      return null;
    } catch (error) {
      console.error('Error finding playa by camera IP:', error);
      return null;
    }
  }

  static async getFirstAvailable() {
    try {
      // Obtener la primera playa disponible (abierta)
      const query = "SELECT * FROM Playa WHERE estado = 'abierto' LIMIT 1";
      const results = await db.query(query);
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error('Error getting first available playa:', error);
      return null;
    }
  }
}

module.exports = Playa;