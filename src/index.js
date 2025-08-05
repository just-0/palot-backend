const express = require("express");
const cors = require("cors");
const { createServer } = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

// Import configurations and middleware
const config = require("./config/server");
const database = require("./config/database");
const errorHandler = require("./middleware/errorHandler");
const CronService = require("./services/CronService");

// Import routes
const routes = require("./routes");

// Create Express app and HTTP server
const app = express();
const httpServer = createServer(app);

// Configure Socket.IO with CORS
const io = new Server(httpServer, {
  cors: {
    origin: config.cors.origin.split(','),
    methods: config.cors.methods.split(','),
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

// Make io globally available for camera notifications
global.io = io;

// Socket.IO connection handling
io.on("connection", (socket) => {


  // Handle joining playa room
  socket.on("join-playa", (playaId) => {
    const roomName = `playa-${playaId}`;
    socket.join(roomName);


    // Confirm room join
    socket.emit("joined-playa", { playaId, roomName });
  });

  // Handle leaving playa room
  socket.on("leave-playa", (playaId) => {
    const roomName = `playa-${playaId}`;
    socket.leave(roomName);

  });

  // Handle disconnection
  socket.on("disconnect", (reason) => {
    // Cliente desconectado
  });

  // Handle connection errors
  socket.on("error", (error) => {
    // Error en WebSocket
  });
});

// Middleware - CORS configuration
app.use(
  cors({
    origin: config.cors.origin.split(','),
    methods: config.cors.methods.split(','),
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "userid",
      "usertype",
      "X-Requested-With",
      "Accept",
      "Origin",
    ],
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

// Express built-in middleware (replaces body-parser)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.text({ type: "application/xml" }));
app.use(express.text({ type: "text/xml" }));
app.use(express.text({ type: "text/plain" }));
// Middleware para manejar imágenes JPEG de cámaras Hikvision
app.use(express.raw({ type: "image/jpeg", limit: "10mb" }));
app.use(express.raw({ type: "image/png", limit: "10mb" }));
app.use(express.raw({ type: "application/octet-stream", limit: "10mb" }));

// Middleware simple para detectar peticiones de cámaras
app.use((req, res, next) => {
  if (
    req.url.includes("/camera") ||
    req.url.includes("/vehicle-detection") ||
    req.url.includes("/ISAPI")
  ) {

  }
  next();
});

// API Routes (new endpoints)
app.use("/api", routes);

// Legacy routes for backward compatibility (direct routes)
const AuthController = require("./controllers/AuthController");
const PlayaController = require("./controllers/PlayaController");
const VehicleController = require("./controllers/VehicleController");
const CameraController = require("./controllers/CameraController");
const { validateLogin, validatePlayaId } = require("./middleware/validation");

app.post("/login", validateLogin, AuthController.login);
app.get("/showPlayas", PlayaController.getAllPlayas);
app.get("/allPlayas", PlayaController.getAllPlayasForUserManagement);

// Nuevas rutas para usuarios y playas
const UserController = require("./controllers/UserController");
app.get("/users", UserController.getAllUsers);
app.post("/users", UserController.createUser);
app.put("/users/:id/:tipo", UserController.updateUser);
app.delete("/users/:id/:tipo", UserController.deleteUser);
app.get("/users/:id/:tipo/playas", UserController.getUserPlayas);

// Rutas para gestión de playas (con middleware de autenticación)
const { authenticateUser, requireAdmin } = require("./middleware/auth");
app.get("/playas", authenticateUser, PlayaController.getAllPlayas);
app.post(
  "/playas",
  authenticateUser,
  requireAdmin,
  PlayaController.createPlaya
);
app.put(
  "/playas/:id",
  authenticateUser,
  requireAdmin,
  PlayaController.updatePlaya
);
app.delete(
  "/playas/:id",
  authenticateUser,
  requireAdmin,
  PlayaController.deletePlaya
);
app.post("/playas/:id/abrir", authenticateUser, PlayaController.abrirPlaya);
app.post("/playas/:id/cerrar", authenticateUser, PlayaController.cerrarPlaya);
app.get("/getPlacas", validatePlayaId, VehicleController.getAutos);
app.get("/getPlacasMotos", validatePlayaId, VehicleController.getMotos);
app.put("/updateStateAuto/:id_auto", VehicleController.updateAutoState);
app.put("/updateStateMoto/:id_moto", VehicleController.updateMotoState);
app.put("/carroPagoTicketVenta", VehicleController.processAutoPayment);
app.put("/motoPagoTicketVenta", VehicleController.processMotoPayment);
app.put("/createManualCar", VehicleController.createManualAuto);
app.put("/createManualBike", VehicleController.createManualMoto);
app.get("/getBoletas", validatePlayaId, VehicleController.getBoletas);
app.get(
  "/api/ISAPI/Traffic/channels/1/vehicleDetect/plates",
  validatePlayaId,
  CameraController.getPlatesFromCamera
);

// Endpoint directo para notificaciones de cámara Hikvision
app.post("/camera/vehicle-detection", CameraController.receiveVehicleDetection);
app.post("/vehicle-detection", CameraController.receiveVehicleDetection);

// Endpoint proxy para imágenes de cámaras (requiere autenticación)
app.get("/api/camera/image/:filename", async (req, res) => {
  try {
    const filename = req.params.filename;
    const cameraIP = req.query.ip;

    if (!filename || !cameraIP) {
      return res.status(400).json({ error: "Filename and IP are required" });
    }

    // Buscar la playa por IP de cámara para obtener credenciales
    const PlayaController = require("./controllers/PlayaController");
    const CameraService = require("./services/CameraService");

    const playa = await CameraService.findPlayaByCamera(cameraIP);
    if (!playa || !playa.cam_user || !playa.cam_password) {
      return res.status(404).json({ error: "Camera credentials not found" });
    }

    // Hacer request autenticado a la cámara
    const imageUrl = `http://${cameraIP}:80/doc/ui/images/plate/${filename}`;
    const authHeader =
      "Basic " +
      Buffer.from(playa.cam_user + ":" + playa.cam_password).toString("base64");

    const axios = require("axios");
    const response = await axios({
      method: "GET",
      url: imageUrl,
      timeout: 5000,
      headers: {
        Authorization: authHeader,
      },
      responseType: "stream",
    });

    // Configurar headers de respuesta
    res.set("Content-Type", response.headers["content-type"] || "image/jpeg");
    res.set("Cache-Control", "public, max-age=3600"); // Cache por 1 hora

    // Pipe la imagen directamente al cliente
    response.data.pipe(res);
  } catch (error) {

    res.status(500).json({ error: "Error loading camera image" });
  }
});

// Endpoint de prueba para cámaras - PARA TESTING
app.all("/camera/test", (req, res) => {
  res.json({
    success: true,
    message: "Test endpoint funcionando correctamente",
    received: {
      method: req.method,
      headers: req.headers,
      query: req.query,
      body: req.body,
      ip: req.ip || req.connection.remoteAddress,
      timestamp: new Date().toISOString(),
    },
  });
});

// Debug endpoint para verificar headers
app.get("/debug-headers", (req, res) => {
  res.json({
    headers: req.headers,
    userId: req.headers.userid,
    userType: req.headers.usertype,
    timestamp: new Date().toISOString(),
  });
});

// Debug endpoint con autenticación
app.get("/debug-auth", authenticateUser, (req, res) => {
  res.json({
    message: "Authentication successful!",
    user: req.user,
    timestamp: new Date().toISOString(),
  });
});

// Endpoint para testing del cierre automático de playas
app.post("/debug/force-close-playas", async (req, res) => {
  try {
    const result = await CronService.forceCloseAllPlayas();
    res.json({
      success: true,
      message: "Cierre forzado ejecutado",
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al forzar cierre de playas",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Endpoint para verificar el estado de las playas y el cron
app.get("/debug/playas-status", async (req, res) => {
  try {
    const { PrismaClient } = require("@prisma/client");
    const prisma = new PrismaClient();
    
    const playasAbiertas = await prisma.playa.findMany({
      where: { estado: 'abierto' },
      select: {
        id_playa: true,
        nombre: true,
        estado: true,
        horaAbierto: true,
        usuarioAbrio: true
      }
    });

    const playasCerradas = await prisma.playa.findMany({
      where: { estado: 'cerrado' },
      select: {
        id_playa: true,
        nombre: true,
        estado: true,
        horaCerrado: true,
        usuarioCerro: true
      }
    });

    const now = new Date();
    const limaTime = now.toLocaleString('es-PE', { timeZone: 'America/Lima' });

    res.json({
      success: true,
      timestamp: now.toISOString(),
      limaTime: limaTime,
      cronStatus: "Activo - Cierre programado para 00:00 (medianoche)",
      playas: {
        abiertas: {
          count: playasAbiertas.length,
          list: playasAbiertas
        },
        cerradas: {
          count: playasCerradas.length,
          list: playasCerradas
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al obtener estado de playas",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "🚀 Palot Backend API",
    version: "2.0.0",
    status: "running",
    environment: config.nodeEnv,
    endpoints: {
      health: "/api/health",
      auth: "/api/auth",
      playas: "/api/playas",
      vehicles: "/api/vehicles",
      camera: "/api/camera",
      debug: "/debug-headers",
    },
  });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use("*", (req, res) => {
  res.status(config.httpCodes.NOT_FOUND).json({
    success: false,
    message: "Endpoint not found",
  });
});

// Start server with Socket.IO support
const server = httpServer.listen(config.port, config.host, () => {
  // Inicializar servicios de cron
  CronService.init();
});

// Graceful shutdown
let isShuttingDown = false;

async function gracefulShutdown(signal) {
  if (isShuttingDown) {
    console.log("� Sehutdown already in progress...");
    return;
  }

  isShuttingDown = true;
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);

  // Cerrar WebSocket connections
  if (global.io) {
    global.io.close();
  }

  // Cerrar servidor HTTP
  server.close(async () => {

    try {
      // Cerrar conexión a la base de datos
      await database.close();
      process.exit(0);
    } catch (error) {
      process.exit(1);
    }
  });

  // Forzar cierre después de 10 segundos si no se cierra normalmente
  setTimeout(() => {
    process.exit(1);
  }, 10000);
}

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

// Manejar errores no capturados
process.on("uncaughtException", (error) => {

  gracefulShutdown("uncaughtException");
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
  gracefulShutdown("unhandledRejection");
});
