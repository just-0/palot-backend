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
    origin: ["http://localhost:4200", "http://127.0.0.1:4200"],
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Make io globally available for camera notifications
global.io = io;

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`📡 Cliente WebSocket conectado: ${socket.id}`);

  // Handle joining playa room
  socket.on('join-playa', (playaId) => {
    const roomName = `playa-${playaId}`;
    socket.join(roomName);
    console.log(`🏢 Cliente ${socket.id} se unió a la sala: ${roomName}`);
    
    // Confirm room join
    socket.emit('joined-playa', { playaId, roomName });
  });

  // Handle leaving playa room
  socket.on('leave-playa', (playaId) => {
    const roomName = `playa-${playaId}`;
    socket.leave(roomName);
    console.log(`🚪 Cliente ${socket.id} salió de la sala: ${roomName}`);
  });

  // Handle disconnection
  socket.on('disconnect', (reason) => {
    console.log(`📡 Cliente WebSocket desconectado: ${socket.id} - Razón: ${reason}`);
  });

  // Handle connection errors
  socket.on('error', (error) => {
    console.error(`❌ Error en WebSocket ${socket.id}:`, error);
  });
});

// Middleware - CORS configuration
app.use(
  cors({
    origin: ["http://localhost:4200", "http://127.0.0.1:4200"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
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
app.use(express.text({ type: "text/plain" }));
// Middleware para manejar imágenes JPEG de cámaras Hikvision
app.use(express.raw({ type: "image/jpeg", limit: "10mb" }));
app.use(express.raw({ type: "image/png", limit: "10mb" }));
app.use(express.raw({ type: "application/octet-stream", limit: "10mb" }));

// Middleware de logging simplificado (solo errores importantes)
app.use((req, res, next) => {
  // Solo loggear endpoints críticos o errores
  if (req.url.includes('/camera/vehicle-detection') && process.env.NODE_ENV === 'development') {
    console.log(`${req.method} ${req.url} - IP: ${req.ip || req.connection.remoteAddress}`);
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
  console.log("🚀 ================================");
  console.log("🚀 PALOT BACKEND SERVER STARTED");
  console.log("🚀 ================================");
  console.log(`🌐 Server: http://${config.host}:${config.port}`);
  console.log(`📊 Environment: ${config.nodeEnv}`);
  console.log(`🕒 Timezone: ${config.timezone}`);
  console.log(`📱 API Version: 2.0.0`);
  console.log(`📡 WebSocket: Enabled for real-time notifications`);
  console.log("🚀 ================================");

  // Inicializar servicios de cron
  CronService.init();
});

// Graceful shutdown
process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

async function gracefulShutdown(signal) {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);

  server.close(async () => {
    console.log("🔌 HTTP server closed");

    try {
      await database.close();
      console.log("✅ Graceful shutdown completed");
      process.exit(0);
    } catch (error) {
      console.error("❌ Error during shutdown:", error);
      process.exit(1);
    }
  });
}
