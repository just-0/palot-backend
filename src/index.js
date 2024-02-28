const express = require("express");
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

const db = require("./db/db");


app.use(bodyParser.urlencoded({ extended: true }));
/*-----------------------------------ROUTING---------------------------------------------*/ 

app.get("/", (req, res) => {
  db.getAllAdmins(res);
});

app.post("/login", (req,res) => {
  
  
  const  {username, password} = req.body;
  db.checkLogin(username, password, res)
  
})











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
