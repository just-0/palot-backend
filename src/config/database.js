const mysql = require('mysql2');
require('dotenv').config();

class Database {
  constructor() {
    this.connection = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306,
      connectionLimit: 10,
      acquireTimeout: 60000,
      timeout: 60000,
      reconnect: true,
      idleTimeout: 300000,
      maxIdle: 10
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

          resolve();
        }
      });
    });
  }
}

module.exports = new Database();