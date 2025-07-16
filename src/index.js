const express = require("express");
const bodyParser = require('body-parser');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const request = require('request');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

const db = require("./db/db");
const utils = require("./db/utils");


app.use(bodyParser.json());
app.use(cors());
app.use('/api', bodyParser.text({ type: 'application/xml' }));
app.use('/api/ISAPI/Traffic/channels/1/vehicleDetect/plates/', bodyParser.text({ type: 'text/plain' }));

/*-----------------------------------ROUTING---------------------------------------------*/ 

app.get("/", (req, res) => {
  //db.getAllAdmins(res);
});

app.post("/login", (req,res) => {
  
  
  const  {username, password} = req.body;
  db.checkLogin(username, password, res)
  
})


app.get("/showPlayas", (req, res) => {
  db.getPlayas(res);
  
});

app.get("/getPlacasMotos", (req, res) => {
  db.getPlacasMotos(req,res);
  
});
app.get("/getPlacas", (req, res) => {
  db.getPlacas(req,res);
  
});

app.put("/updateStateAuto/:id_auto",  (req, res) => {

   db.updateStateAuto(req,res);
});

app.put("/updateStateMoto/:id_moto",  (req, res) => {

  db.updateStateMoto(req,res);
});
app.put("/carroPagoTicketVenta/",  (req, res) => {

  db.carroPagoTicketVenta(req,res)
});
app.put("/motoPagoTicketVenta/",  (req, res) => {

  db.motoPagoTicketVenta(req,res)
});


app.put("/createManualCar/",  (req, res) => {
  
  db.createManualCar(req,res)
  
});

app.put("/createManualBike/",  (req, res) => {
  
  db.createManualBike(req,res)
  
});
app.get("/getBoletas",  (req, res) => {
  
  db.getBoletas(req,res)
  
});

app.get('/api/ISAPI/Traffic/channels/1/vehicleDetect/plates/', (req, res) => {
  const idPlaya = req.query.id_playa;
  console.log("PLACAS CAMARA")
  
  const options = {
    method: 'GET',
    url: process.env.CAM_URL,
    timeout: parseInt(process.env.CAM_TIMEOUT) || 5000,
    headers: {
      'Content-Type': 'text/plain',
      'Authorization': 'Basic ' + Buffer.from(process.env.CAM_USER + ':' + process.env.CAM_PASSWORD).toString('base64')
    },
    body: '<?xml version="1.0" encoding="UTF-8"?>\r\n<Root></Root>\r\n'
  };

  request(options, async (error, response, body) => {
    if (error) {
      console.error("Error during request:", error.message);
      // En lugar de devolver error 500, devolver array vacío para que la app siga funcionando
      console.log("Cámara no disponible, devolviendo array vacío");
      return res.status(parseInt(process.env.HTTP_OK) || 200).json([]);
    }
    
    try {
      const parsedPlates = await utils.parseXML(body);
      const newPlates = await db.filterNewPlates(parsedPlates);
      await db.insertNewPlates(newPlates, idPlaya);
      res.status(parseInt(process.env.HTTP_OK) || 200).json(newPlates);
    } catch (parseError) {
      console.error("Error parsing camera data:", parseError.message);
      res.status(parseInt(process.env.HTTP_OK) || 200).json([]);
    }
  });
});
/*--------------------------------------------------------------------------------*/ 
app.listen(PORT, HOST, () => {
  console.log(`🚀 Servidor corriendo en http://${HOST}:${PORT}`);
  console.log(`📊 Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🕒 Zona horaria: ${process.env.TIMEZONE || 'America/Lima'}`);
});

process.on("exit", () => {
  if (db.connection && db.connection.state !== "disconnected") {
    db.connection.end((err) => {
      if (err) {
        console.error(
          "Error al cerrar la conexión a la base de datos: " + err.stack
        );
        return;
      }
      console.log("Conexión a la base de datos cerrada correctamente");
    });
  }
});
