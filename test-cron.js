#!/usr/bin/env node

/**
 * Script de prueba para el sistema de cierre automático de playas
 * 
 * Uso:
 * node test-cron.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testCronSystem() {
  console.log('🧪 Iniciando pruebas del sistema de cierre automático...\n');

  try {
    // 1. Verificar estado actual de las playas
    console.log('1️⃣ Verificando estado actual de las playas...');
    const statusResponse = await axios.get(`${BASE_URL}/debug/playas-status`);
    
    if (statusResponse.data.success) {
      console.log(`✅ Estado obtenido exitosamente`);
      console.log(`📊 Playas abiertas: ${statusResponse.data.playas.abiertas.count}`);
      console.log(`📊 Playas cerradas: ${statusResponse.data.playas.cerradas.count}`);
      console.log(`🕐 Hora Lima: ${statusResponse.data.limaTime}`);
      console.log(`⚙️ Estado del Cron: ${statusResponse.data.cronStatus}\n`);
      
      if (statusResponse.data.playas.abiertas.count > 0) {
        console.log('🏖️ Playas abiertas encontradas:');
        statusResponse.data.playas.abiertas.list.forEach(playa => {
          console.log(`   - ${playa.nombre} (ID: ${playa.id_playa}) - Abierta por: ${playa.usuarioAbrio}`);
        });
        console.log('');
      }
    }

    // 2. Probar cierre forzado
    console.log('2️⃣ Probando cierre forzado de playas...');
    const forceCloseResponse = await axios.post(`${BASE_URL}/debug/force-close-playas`);
    
    if (forceCloseResponse.data.success) {
      console.log(`✅ Cierre forzado ejecutado exitosamente`);
      console.log(`📊 Playas cerradas: ${forceCloseResponse.data.data.count}`);
      
      if (forceCloseResponse.data.data.count > 0) {
        console.log(`🎯 El sistema de cierre automático está funcionando correctamente!`);
      } else {
        console.log(`ℹ️ No había playas abiertas para cerrar`);
      }
    }

    // 3. Verificar estado después del cierre
    console.log('\n3️⃣ Verificando estado después del cierre...');
    const finalStatusResponse = await axios.get(`${BASE_URL}/debug/playas-status`);
    
    if (finalStatusResponse.data.success) {
      console.log(`✅ Estado final obtenido`);
      console.log(`📊 Playas abiertas: ${finalStatusResponse.data.playas.abiertas.count}`);
      console.log(`📊 Playas cerradas: ${finalStatusResponse.data.playas.cerradas.count}`);
      
      // Mostrar playas cerradas por el sistema
      const playasCerradasPorSistema = finalStatusResponse.data.playas.cerradas.list.filter(
        playa => playa.usuarioCerro === 'SISTEMA_MANUAL' || playa.usuarioCerro === 'SISTEMA_AUTO'
      );
      
      if (playasCerradasPorSistema.length > 0) {
        console.log('\n🤖 Playas cerradas por el sistema:');
        playasCerradasPorSistema.forEach(playa => {
          const fechaCierre = new Date(playa.horaCerrado).toLocaleString('es-PE', { timeZone: 'America/Lima' });
          console.log(`   - ${playa.nombre} (ID: ${playa.id_playa}) - Cerrada: ${fechaCierre} por ${playa.usuarioCerro}`);
        });
      }
    }

    console.log('\n🎉 Pruebas completadas exitosamente!');
    console.log('\n📋 Resumen de la configuración:');
    console.log('   - Cron programado para: 00:00 (medianoche)');
    console.log('   - Zona horaria: America/Lima');
    console.log('   - Usuario automático: SISTEMA_AUTO');
    console.log('   - Logs habilitados en modo desarrollo');
    
    console.log('\n💡 Recomendaciones:');
    console.log('   1. Verifica que el servidor esté corriendo 24/7');
    console.log('   2. Revisa los logs del servidor a medianoche');
    console.log('   3. Usa /debug/playas-status para monitorear el estado');
    console.log('   4. El cron de prueba (cada 5 min) solo funciona en desarrollo');

  } catch (error) {
    console.error('❌ Error durante las pruebas:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('🔌 El servidor no está corriendo. Inicia el servidor con: npm run dev');
    } else if (error.response) {
      console.error('📡 Error de respuesta:', error.response.status, error.response.data);
    }
  }
}

// Ejecutar las pruebas
testCronSystem();