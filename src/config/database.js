const mysql = require("mysql2");
require("dotenv").config();

class Database {
  constructor() {
    this.connection = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306,
      connectionLimit: 10,
      queueLimit: 0,
      reconnect: true,
      multipleStatements: false,
    });

    this.connect();
  }

  connect() {
    this.connection.getConnection((err, connection) => {
      if (err) {
        console.error("❌ Error al conectar con MySQL: " + err.stack);
        process.exit(1);
      }

      console.log("✅ Conectado a MySQL como ID " + connection.threadId);
      connection.release();
    });
  }

  query(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.connection.execute(sql, params, (error, results) => {
        if (error) {
          console.error("❌ Database query error:", error.message);
          reject(error);
        } else {
          resolve(results);
        }
      });
    });
  }

  close() {
    return new Promise((resolve, reject) => {
      this.connection.end((err) => {
        if (err) {
          console.error("❌ Error closing database pool:", err.message);
          reject(err);
        } else {
          console.log("✅ Database pool closed successfully");
          resolve();
        }
      });
    });
  }
}

module.exports = new Database();
