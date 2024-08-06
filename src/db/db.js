const mysql = require("mysql");
const connection = mysql.createConnection({
  host: "localhost",
  user: "justo",
  password: "yuca123",
  database: "palot",
});
connection.connect((err) => {
  if (err) {
    console.error("Error al conectar con MySQL: " + err.stack);
    return;
  }
  console.log("Conexión exitosa con MySQL");
});

//---------------------------------------Functions--------------------------------

function queryTest(nombre, contraseña, res) {
  const query = `INSERT INTO Admin (nombre, hashed) VALUES ('${nombre}', '${contraseña}')`;
  connection.query(query, (err, resultados) => {
    if (err) {
      console.error("Error al insertar en la tabla Admin: " + err.stack);
      res.status(500).send("Error al insertar en la tabla Admin");
      return;
    }

    console.log("Nuevo registro insertado en la tabla Admin");
    res.send("Nuevo registro insertado en la tabla Admin");
  });
}

function getAllAdmins(res) {
  const query = "SELECT * FROM Admin";
  connection.query(query, (err, resultados) => {
    if (err) {
      console.error("Error al obtener datos de la tabla Admin: " + err.stack);
      return;
    }

    console.log("Datos obtenidos de la tabla Admin");
    res.send(resultados);
  });
}

/*
  Codigos de Error:
    1: Contraseña Incorrecta
    2: No Existe el Usuario
    3: No se pudo leer la tabla
*/
function checkLogin(username, password, res) {
  connection.query(
    "SELECT * FROM Admin WHERE nombre = ?",
    [username],
    (error, results, fields) => {
      if (error) {
        console.error(error);
        res.status(500).res.json({success: false, codigo: 3});
        return;
      }
      if (results.length > 0) {
        const user = results[0];

        if (password == user.hashed) {
          res.json({success: true});
        } else {
          res.status(401);
          res.json({success: false, codigo: 1} );
        }
      } else {
        res.status(401);
        res.json({success: false, codigo: 2});
      }
    }
  );
}


function getPlayas(res) {
  const query = "SELECT * FROM Playa";
  connection.query(query, (err, resultados) => {
    if (err) {
      console.error("Error al obtener datos de la tabla Admin: " + err.stack);
      return;
    }
    // Aqui quiero el sleep
    res.send(resultados);
    
  });
}


//-----------------------------------------------------------------------------------------

module.exports = { connection, queryTest, getAllAdmins, checkLogin, getPlayas};
//connection.end()
