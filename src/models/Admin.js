const db = require('../config/database');

class Admin {
  static async findByUsername(username) {
    try {
      const query = "SELECT * FROM Admin WHERE nombre = ?";
      const results = await db.query(query, [username]);
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      throw new Error(`Error finding admin: ${error.message}`);
    }
  }

  static async getAll() {
    try {
      const query = "SELECT * FROM Admin";
      const results = await db.query(query);
      return results;
    } catch (error) {
      throw new Error(`Error getting all admins: ${error.message}`);
    }
  }

  static async create(nombre, hashedPassword) {
    try {
      const query = "INSERT INTO Admin (nombre, hashed) VALUES (?, ?)";
      const result = await db.query(query, [nombre, hashedPassword]);
      return result.insertId;
    } catch (error) {
      throw new Error(`Error creating admin: ${error.message}`);
    }
  }
}

module.exports = Admin;