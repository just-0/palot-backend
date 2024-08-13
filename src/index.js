const express = require("express");
const bodyParser = require('body-parser');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const request = require('request');



const app = express();
const PORT = 3000;

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
  console.log("Received request to /api/ISAPI/Traffic/channels/1/vehicleDetect/plates/");
  
  const options = {
    method: 'GET',
    url: 'http://192.168.1.120/ISAPI/Traffic/channels/1/vehicleDetect/plates',
    headers: {
      'Content-Type': 'text/plain',
      'Authorization': 'Basic ' + Buffer.from('admin:Hik12345').toString('base64')
    },
    body: '<?xml version="1.0" encoding="UTF-8"?>\r\n<Root></Root>\r\n'
  };

  request(options, async (error, response, body) => {
    if (error) {
      console.error("Error during request:", error.message);
      return res.status(500).send(error.message);
    }
    
    
    
    
    const parsedPlates = await utils.parseXML(body);
    
    
    const newPlates = await db.filterNewPlates(parsedPlates);
    console.log("insertando.xd.");
    
    await db.insertNewPlates(newPlates,idPlaya);

    
    res.status(200).json(newPlates);
  });
});
/*--------------------------------------------------------------------------------*/ 
app.listen(PORT, () => {
  console.log(`Aplicación corriendo en el puerto ${PORT}`);
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
