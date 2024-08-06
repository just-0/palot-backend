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
  console.log("SOY UND DEBUG");
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
