const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

// Import configurations and middleware
const config = require('./config/server');
const database = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const routes = require('./routes');

// Create Express app
const app = express();

// Middleware
app.use(cors({
  origin: config.cors.origin,
  methods: config.cors.methods,
  allowedHeaders: config.cors.allowedHeaders.split(',')
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.text({ type: 'application/xml' }));
app.use(bodyParser.text({ type: 'text/plain' }));

// API Routes (new endpoints)
app.use('/api', routes);

// Legacy routes for backward compatibility (direct routes)
const AuthController = require('./controllers/AuthController');
const PlayaController = require('./controllers/PlayaController');
const VehicleController = require('./controllers/VehicleController');
const CameraController = require('./controllers/CameraController');
const { validateLogin, validatePlayaId } = require('./middleware/validation');

app.post('/login', validateLogin, AuthController.login);
app.get('/showPlayas', PlayaController.getAllPlayas);
app.get('/getPlacas', validatePlayaId, VehicleController.getAutos);
app.get('/getPlacasMotos', validatePlayaId, VehicleController.getMotos);
app.put('/updateStateAuto/:id_auto', VehicleController.updateAutoState);
app.put('/updateStateMoto/:id_moto', VehicleController.updateMotoState);
app.put('/carroPagoTicketVenta', VehicleController.processAutoPayment);
app.put('/motoPagoTicketVenta', VehicleController.processMotoPayment);
app.put('/createManualCar', VehicleController.createManualAuto);
app.put('/createManualBike', VehicleController.createManualMoto);
app.get('/getBoletas', validatePlayaId, VehicleController.getBoletas);
app.get('/api/ISAPI/Traffic/channels/1/vehicleDetect/plates', validatePlayaId, CameraController.getPlatesFromCamera);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: '🚀 Palot Backend API',
    version: '2.0.0',
    status: 'running',
    environment: config.nodeEnv,
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      playas: '/api/playas',
      vehicles: '/api/vehicles',
      camera: '/api/camera'
    }
  });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(config.httpCodes.NOT_FOUND).json({
    success: false,
    message: 'Endpoint not found'
  });
});

// Start server
const server = app.listen(config.port, config.host, () => {
  console.log('🚀 ================================');
  console.log('🚀 PALOT BACKEND SERVER STARTED');
  console.log('🚀 ================================');
  console.log(`🌐 Server: http://${config.host}:${config.port}`);
  console.log(`📊 Environment: ${config.nodeEnv}`);
  console.log(`🕒 Timezone: ${config.timezone}`);
  console.log(`📱 API Version: 2.0.0`);
  console.log('🚀 ================================');
});

// Graceful shutdown
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

async function gracefulShutdown(signal) {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
  
  server.close(async () => {
    console.log('🔌 HTTP server closed');
    
    try {
      await database.close();
      console.log('✅ Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  });
}
