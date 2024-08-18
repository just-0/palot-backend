const mysql = require("mysql");
const moment = require("moment-timezone");

const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
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
        res.status(500).res.json({ success: false, codigo: 3 });
        return;
      }
      if (results.length > 0) {
        const user = results[0];

        if (password == user.hashed) {
          res.json({ success: true });
        } else {
          res.status(401);
          res.json({ success: false, codigo: 1 });
        }
      } else {
        res.status(401);
        res.json({ success: false, codigo: 2 });
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
    res.send(resultados);
  });
}

function getAutoByID(req, res) {
  const query = "SELECT * FROM Playa where id_auto=? ";
  connection.query(query, [data.auto], (err, resultados) => {
    if (err) {
      console.error("Error al obtener datos de la tabla Admin: " + err.stack);
      return;
    }
    res.send(resultados);
  });
}

function getPlacasMotos(req, res) {
  const idPlaya = req.query.idPlaya;
  const todayStart = moment().startOf('day').format('YYYY-MM-DD HH:mm:ss');
  const todayEnd = moment().endOf('day').format('YYYY-MM-DD HH:mm:ss');
  
  const query = `
    SELECT Moto.*, Boleta.total_pagar
    FROM Moto
    LEFT JOIN Boleta ON Moto.id_moto = Boleta.id_moto
    WHERE Moto.id_playa = ? 
      AND Moto.hora_entrada BETWEEN ? AND ?
  `;
  
  connection.query(query, [idPlaya, todayStart, todayEnd], (err, resultados) => {
    if (err) {
      console.error("Error al obtener datos de la tabla Moto: " + err.stack);
      return res.status(500).send("Error al obtener datos");
    }
    res.send(resultados);
  });
}
function getPlacas(req, res) {
  const idPlaya = req.query.idPlaya;
  const todayStart = moment().startOf('day').format('YYYY-MM-DD HH:mm:ss');
  const todayEnd = moment().endOf('day').format('YYYY-MM-DD HH:mm:ss');
  
  const query = `
    SELECT Auto.*, Boleta.total_pagar
    FROM Auto
    LEFT JOIN Boleta ON Auto.id_auto = Boleta.id_auto
    WHERE Auto.id_playa = ?
      AND Auto.hora_entrada BETWEEN ? AND ?
  `;
  
  connection.query(query, [idPlaya, todayStart, todayEnd], (err, resultados) => {
    if (err) {
      console.error("Error al obtener datos de la tabla Auto: " + err.stack);
      return res.status(500).send("Error al obtener datos");
    }
    //console.log("aaadebug-",idPlaya, todayStart, todayEnd)
    res.send(resultados);
    
  });
}
function updateStateAuto(req, res) {
  const id_auto = req.params.id_auto;
  let state = req.body.state;

  
  if (state === undefined) {
    state = req.query.state;
  }

  const query = "UPDATE Auto SET state = ? WHERE id_auto = ?";
  connection.query(query, [state, id_auto], (err, results) => {
    if (err) {
      console.error("Error en la consulta:", err);
      return res.status(500).send("Error en la consulta");
    }
    if (results.affectedRows === 0) {
      return res.status(404).send("Registro no encontrado");
    }

    res.send(results);
  });
}
function updateStateMoto(req, res) {
  const id_moto = req.params.id_moto;
  let state = req.body.state;


  if (state === undefined) {
    state = req.query.state;
  }

  const query = "UPDATE Moto SET state = ? WHERE id_moto = ?";
  connection.query(query, [state, id_moto], (err, results) => {
    if (err) {
      console.error("Error en la consulta:", err);
      return res.status(500).send("Error en la consulta");
    }
    if (results.affectedRows === 0) {
      return res.status(404).send("Registro no encontrado");
    }

    res.send(results);
  });
}
function carroPagoTicketVenta(req, res) {
  const data = req.body;

  
  const query = "INSERT INTO Boleta (id_auto, total_pagar, fecha_emision) VALUES (?, ?, ?)";

  const fechaSalida = moment(data.horaSalida)
    .tz("America/Lima")
    .format("YYYY-MM-DD HH:mm:ss");

  
  connection.query(query, [data.id, data.Monto, fechaSalida], (err, results) => {
    if (err) {
      console.error("Error en la consulta PAGAR:", err);
      res.status(500).send({ error: 'Error en la consulta PAGAR' });
      return;
    }

    
    const boletaId = results.insertId;

    
    const query2 = "UPDATE Auto SET hora_salida = ?, state = ? WHERE id_auto = ?";

    
    connection.query(query2, [fechaSalida, data.state, data.id], (err, results) => {
      if (err) {
        console.error("Error en la consulta ACTUALIZAR AUTO:", err);
        res.status(500).send({ error: 'Error en la consulta ACTUALIZAR AUTO' });
        return;
      }

      
      res.send({ boletaId });
    });
  });
}
function motoPagoTicketVenta(req, res) {
  const data = req.body;


  const query = "INSERT INTO Boleta (id_moto, total_pagar, fecha_emision) VALUES (?, ?, ?)";

  const fechaSalida = moment(data.horaSalida)
    .tz("America/Lima")
    .format("YYYY-MM-DD HH:mm:ss");

  
  connection.query(query, [data.id, data.Monto, fechaSalida], (err, results) => {
    if (err) {
      console.error("Error en la consulta INSERTAR BOLETA:", err);
      res.status(500).send({ error: 'Error en la consulta INSERTAR BOLETA' });
      return;
    }

    
    const boletaId = results.insertId;

    
    const query2 = "UPDATE Moto SET hora_salida = ?, state = ? WHERE id_moto = ?";

    
    connection.query(query2, [fechaSalida, data.state, data.id], (err) => {
      if (err) {
        console.error("Error en la consulta ACTUALIZAR MOTO:", err);
        res.status(500).send({ error: 'Error en la consulta ACTUALIZAR MOTO' });
        return;
      }

      
      res.send({ boletaId });
    });
  });
}

function createManualCar(req, res) {
  const data = req.body;

  const fechaEntrada = moment(data.horaEntrada)
    .tz("America/Lima")
    .format("YYYY-MM-DD HH:mm:ss");

  const query =
    "INSERT INTO Auto (id_playa, placa, hora_entrada, state) VALUES (?, ?, ?, ?)";

  connection.query(
    query,
    [data.id_playa, data.placa, fechaEntrada, data.state],
    (err, results) => {
      if (err) {
        console.error("Error en la consulta:", err);
        return res.status(500).send("Error en la consulta");
      }

      
      const id_auto = results.insertId;
      const selectQuery = "SELECT * FROM Auto WHERE id_auto = ?";

      connection.query(selectQuery, [id_auto], (err, rows) => {
        if (err) {
          console.error("Error al recuperar el carro:", err);
          return res.status(500).send("Error al recuperar el carro");
        }

        
        return res.status(201).json(rows[0]);
      });
    }
  );
}

function createManualBike(req, res) {
  const data = req.body;
  //console.log("HERERERERE ->", data.placa);
  const fechaEntrada = moment(data.horaEntrada)
    .tz("America/Lima")
    .format("YYYY-MM-DD HH:mm:ss");

  const query =
    "INSERT INTO Moto (id_playa, placa, hora_entrada, state) VALUES (?, ?, ?, ?)";

  connection.query(
    query,
    [data.id_playa, data.placa, fechaEntrada, data.state],
    (err, results) => {
      if (err) {
        console.error("Error en la consulta:", err);
        return res.status(500).send("Error en la consulta");
      }

      
      const id_moto = results.insertId;
      const selectQuery = "SELECT * FROM Moto WHERE id_moto = ?";

      connection.query(selectQuery, [id_moto], (err, rows) => {
        if (err) {
          console.error("Error al recuperar el carro:", err);
          return res.status(500).send("Error al recuperar el carro");
        }

       
        return res.status(201).json(rows[0]);
      });
    }
  );
}

function getBoletas(req, res) {
  const idPlaya = req.query.id_playa; 
  
  if (!idPlaya) {
    return res.status(400).send("El id_playa es requerido");
  }

  const todayStart = moment().startOf('day').format('YYYY-MM-DD HH:mm:ss');
  const todayEnd = moment().endOf('day').format('YYYY-MM-DD HH:mm:ss');

  const query = `
    SELECT 
        m.id_moto AS id,
        m.placa AS placa,
        m.hora_entrada AS hora_entrada,
        m.hora_salida AS hora_salida,
        m.state AS state,
        m.img AS img,
        b.total_pagar AS monto,
        b.fecha_emision AS fecha_emision,
        'Moto' AS tipo
    FROM 
        Moto m
    LEFT JOIN 
        Boleta b ON m.id_moto = b.id_moto
    WHERE 
        m.id_playa = ?
        AND m.state = 2
        AND m.hora_entrada BETWEEN ? AND ?
    UNION ALL
    SELECT 
        a.id_auto AS id,
        a.placa AS placa,
        a.hora_entrada AS hora_entrada,
        a.hora_salida AS hora_salida,
        a.state AS state,
        a.img AS img,
        b.total_pagar AS monto,
        b.fecha_emision AS fecha_emision,
        'Auto' AS tipo
    FROM 
        Auto a
    LEFT JOIN 
        Boleta b ON a.id_auto = b.id_auto
    WHERE 
        a.id_playa = ?
        AND a.state = 2
        AND a.hora_entrada BETWEEN ? AND ?;
  `;


  connection.query(query, [idPlaya, todayStart, todayEnd, idPlaya, todayStart, todayEnd], (err, resultados) => {
    if (err) {
      console.error("Error al obtener datos combinados: " + err.stack);
      return res.status(500).send("Error al obtener datos");
    }
    
    res.send(resultados);
  });


}

function filterNewPlates(plates,db) {
  return new Promise((resolve, reject) => {
    const plateNumbers = plates.map(plate => plate.plateNumber);
    const query = `SELECT placa, hora_entrada FROM Auto WHERE placa IN (?)`;
    
    connection.query(query, [plateNumbers], (err, results) => {
      if (err) {
        reject(err);
      } else {
        const existingPlates = new Set(results.map(row => `${row.placa}-${row.hora_entrada}`));
        const newPlates = plates.filter(plate => !existingPlates.has(`${plate.plateNumber}-${ convertToDate(plate.captureTime)}`));
        resolve(newPlates);
      }
    });
  });
}
  
function insertNewPlates(plates, id_playa) {
  return new Promise((resolve, reject) => {
    const plateData = plates.map(plate => ({
      placa: plate.plateNumber,
      hora_entrada: convertToDate(plate.captureTime),
      img: plate.picName,
      id_playa: id_playa
    }));
    
    const values = plateData.map(data => [data.id_playa, data.placa, data.hora_entrada, data.img]);

    
    if (values.length === 0) {
      return;// console.log("NO HAY PLACAS NUEVAS");
    }

    const query = `INSERT INTO Auto (id_playa, placa, hora_entrada, img) VALUES ?`;

    connection.query(query, [values], (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}
function convertToDate(captureTime) {
  
  const year = captureTime.substring(0, 4);
  const month = captureTime.substring(4, 6);
  const day = captureTime.substring(6, 8);
  const hour = captureTime.substring(9, 11);
  const minute = captureTime.substring(11, 13);
  const second = captureTime.substring(13, 15);

  
  const formattedDate = `${year}-${month}-${day}T${hour}:${minute}:${second}`;

  
  return new Date(formattedDate);
}

//-----------------------------------------------------------------------------------------

module.exports = {
  connection,
  queryTest,
  getAllAdmins,
  checkLogin,
  getPlayas,
  getPlacas,
  updateStateAuto,
  carroPagoTicketVenta,
  createManualCar,
  getAutoByID,
  createManualBike,
  getPlacasMotos,
  updateStateMoto,
  motoPagoTicketVenta,
  getBoletas,
  filterNewPlates,
    insertNewPlates,
};
//connection.end()
