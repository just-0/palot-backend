const mysql = require('mysql2');
require('dotenv').config();

class Database {
  constructor() {
    this.connection = mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306
    });

    this.connect();
  }

  connect() {
    this.connection.connect((err) => {
      if (err) {
        console.error("❌ Error al conectar con MySQL: " + err.stack);
        process.exit(1);
      }
      console.log("✅ Conexión exitosa con MySQL");
    });
  }

  query(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.connection.query(sql, params, (error, results) => {
        if (error) {
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
          reject(err);
        } else {
          console.log("🔌 Conexión a la base de datos cerrada correctamente");
          resolve();
        }
      });
    });
  }
}

module.exports = new Database();