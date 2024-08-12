const express = require("express");
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = 3000;

const db = require("./db/db");


app.use(bodyParser.json());
app.use(cors());
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
