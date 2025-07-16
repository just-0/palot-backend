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
}

module.exports = Playa;