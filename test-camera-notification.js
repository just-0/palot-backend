#!/usr/bin/env node

/**
 * Script de prueba para simular notificaciones HTTP de cámara Hikvision
 * Uso: node test-camera-notification.js [--server=http://localhost:3000] [--playa-id=1]
 */

const axios = require("axios");

// Configuración del servidor (puede ser sobrescrita por argumentos)
let SERVER_URL = "http://localhost:3000";
let PLAYA_ID = 1;

// Procesar argumentos de línea de comandos
process.argv.forEach((arg) => {
  if (arg.startsWith("--server=")) {
    SERVER_URL = arg.split("=")[1];
  }
  if (arg.startsWith("--playa-id=")) {
    PLAYA_ID = parseInt(arg.split("=")[1]);
  }
});

const ENDPOINT = "/camera/vehicle-detection";

// Generar timestamp actual en formato Hikvision
function generateHikvisionTimestamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hour = String(now.getHours()).padStart(2, "0");
  const minute = String(now.getMinutes()).padStart(2, "0");
  const second = String(now.getSeconds()).padStart(2, "0");

  return `${year}${month}${day}T${hour}${minute}${second}-500`;
}

// Datos de prueba que simula lo que envía la cámara Hikvision
const testNotifications = [
  {
    channelID: "1",
    dateTime: generateHikvisionTimestamp(),
    eventType: "vehicleDetection",
    country: "Peru",
    licensePlate: "ABC123",
    lane: "1",
    direction: "forward",
    confidenceLevel: "97",
  },
  {
    channelID: "1",
    dateTime: generateHikvisionTimestamp(),
    eventType: "vehicleDetection",
    country: "Peru",
    licensePlate: "XYZ789",
    lane: "1",
    direction: "forward",
    confidenceLevel: "85",
  },
  {
    channelID: "1",
    dateTime: generateHikvisionTimestamp(),
    eventType: "vehicleDetection",
    country: "Peru",
    licensePlate: "GHI789", // Todas las placas se registran como auto
    lane: "1",
    direction: "forward",
    confidenceLevel: "92",
  },
  {
    channelID: "1",
    dateTime: generateHikvisionTimestamp(),
    eventType: "vehicleDetection",
    country: "Peru",
    licensePlate: "JKL012", // Todas las placas se registran como auto
    lane: "1",
    direction: "forward",
    confidenceLevel: "88",
  },
  {
    channelID: "1",
    dateTime: generateHikvisionTimestamp(),
    eventType: "vehicleDetection",
    country: "Peru",
    licensePlate: "DEF456",
    lane: "2",
    direction: "backward",
    confidenceLevel: "94",
  },
];

async function checkServerHealth() {
  try {
    console.log("🔍 Verificando estado del servidor...");
    const response = await axios.get(`${SERVER_URL}/api/health`);
    console.log("✅ Servidor disponible:", response.data);
    return true;
  } catch (error) {
    console.error("❌ Servidor no disponible:", error.message);
    return false;
  }
}

async function checkPlayaExists() {
  try {
    console.log(`🏢 Verificando playa ID ${PLAYA_ID}...`);
    const response = await axios.get(`${SERVER_URL}/allPlayas`);
    const playas = response.data;
    const playa = playas.find((p) => p.id_playa === PLAYA_ID);

    if (playa) {
      console.log(
        `✅ Playa encontrada: ${playa.nombre} (Estado: ${playa.estado})`
      );
      if (playa.estado !== "abierto") {
        console.log(
          "⚠️  ADVERTENCIA: La playa está cerrada. Las detecciones serán ignoradas."
        );
      }
      return playa;
    } else {
      console.log(`❌ Playa con ID ${PLAYA_ID} no encontrada`);
      return null;
    }
  } catch (error) {
    console.error("❌ Error verificando playa:", error.message);
    return null;
  }
}

async function sendTestNotification(notification, index) {
  try {
    console.log(
      `\n📤 [${index + 1}] Enviando: ${notification.licensePlate} (${
        notification.confidenceLevel
      }% confianza)`
    );

    const response = await axios.post(`${SERVER_URL}${ENDPOINT}`, {}, {
      params: notification,
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Hikvision-Camera/1.0",
        "X-Camera-IP": "192.168.1.100", // Simular IP de cámara
      },
      timeout: 5000,
    });

    if (response.data.success) {
      console.log(`✅ [${index + 1}] Procesado exitosamente`);
      if (response.data.data) {
        const data = response.data.data;
        console.log(
          `   📋 Auto ID: ${data.id_auto}, Placa: ${data.placa}, Playa: ${data.id_playa}`
        );
        console.log(
          `   🕒 Entrada: ${new Date(data.hora_entrada).toLocaleString()}`
        );
      }
    } else {
      console.log(`⚠️  [${index + 1}] Ignorado: ${response.data.message}`);
    }

    return response.data;
  } catch (error) {
    console.error(
      `❌ [${index + 1}] Error:`,
      error.response?.data?.message || error.message
    );
    return null;
  }
}

async function verifyDatabaseRecords() {
  try {
    console.log("\n🔍 Verificando registros en base de datos...");

    // Obtener autos
    const autosResponse = await axios.get(
      `${SERVER_URL}/getPlacas?idPlaya=${PLAYA_ID}`
    );
    const autos = autosResponse.data;

    // Obtener motos
    const motosResponse = await axios.get(
      `${SERVER_URL}/getPlacasMotos?idPlaya=${PLAYA_ID}`
    );
    const motos = motosResponse.data;

    console.log(`📊 Registros encontrados:`);
    console.log(`   🚗 Autos: ${autos.length}`);
    console.log(`   🏍️  Motos: ${motos.length}`);

    // Mostrar los últimos 5 registros
    const allVehicles = [...autos, ...motos].sort(
      (a, b) =>
        new Date(b.hora_entrada).getTime() - new Date(a.hora_entrada).getTime()
    );

    if (allVehicles.length > 0) {
      console.log(`\n📋 Últimos registros:`);
      allVehicles.slice(0, 5).forEach((vehicle, index) => {
        const type = vehicle.id_auto ? "🚗" : "🏍️";
        const id = vehicle.id_auto || vehicle.id_moto;
        const time = new Date(vehicle.hora_entrada).toLocaleTimeString();
        console.log(`   ${type} ${vehicle.placa} (ID: ${id}) - ${time}`);
      });
    }
  } catch (error) {
    console.error("❌ Error verificando base de datos:", error.message);
  }
}

async function runTests() {
  console.log("🧪 PRUEBAS DE NOTIFICACIONES DE CÁMARA HIKVISION");
  console.log("=".repeat(60));
  console.log(`🌐 Servidor: ${SERVER_URL}`);
  console.log(`🏢 Playa ID: ${PLAYA_ID}`);
  console.log("=".repeat(60));

  // Verificar servidor
  const serverOk = await checkServerHealth();
  if (!serverOk) {
    console.log("❌ No se puede continuar sin servidor");
    return;
  }

  // Verificar playa
  const playa = await checkPlayaExists();
  if (!playa) {
    console.log("❌ No se puede continuar sin playa válida");
    return;
  }

  console.log("\n🚀 Iniciando envío de notificaciones...");

  // Enviar notificaciones de prueba
  for (let i = 0; i < testNotifications.length; i++) {
    const notification = testNotifications[i];
    await sendTestNotification(notification, i);

    // Esperar un poco entre notificaciones para simular detecciones reales
    if (i < testNotifications.length - 1) {
      console.log("   ⏳ Esperando 3 segundos...");
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }

  // Verificar resultados en base de datos
  console.log("\n⏳ Esperando 2 segundos antes de verificar base de datos...");
  await new Promise((resolve) => setTimeout(resolve, 2000));

  await verifyDatabaseRecords();

  console.log("\n" + "=".repeat(60));
  console.log("🏁 PRUEBAS COMPLETADAS");
  console.log("💡 Revisa el frontend para ver las nuevas detecciones");
  console.log("=".repeat(60));
}

// Función para prueba individual
async function testSinglePlate(licensePlate) {
  const notification = {
    channelID: "1",
    dateTime: generateHikvisionTimestamp(),
    eventType: "vehicleDetection",
    country: "Peru",
    licensePlate: licensePlate,
    lane: "1",
    direction: "forward",
    confidenceLevel: "95",
  };

  console.log(`🧪 Probando placa individual: ${licensePlate}`);
  await sendTestNotification(notification, 0);
}

// Ejecutar las pruebas
if (require.main === module) {
  // Verificar si se pasó una placa específica como argumento
  const plateArg = process.argv.find((arg) => arg.startsWith("--plate="));

  if (plateArg) {
    const licensePlate = plateArg.split("=")[1];
    testSinglePlate(licensePlate).catch(console.error);
  } else {
    runTests().catch(console.error);
  }
}

module.exports = {
  sendTestNotification,
  testNotifications,
  testSinglePlate,
  generateHikvisionTimestamp,
};
