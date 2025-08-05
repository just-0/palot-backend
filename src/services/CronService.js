const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class CronService {
  static init() {
    console.log('🕐 Inicializando CronService para cierre automático de playas...');
    
    // Cerrar todas las playas a medianoche (00:00) todos los días
    cron.schedule('0 0 * * *', async () => {
      console.log('🌙 Ejecutando cierre automático de playas a medianoche...');
      
      try {
        // Obtener todas las playas abiertas
        const playasAbiertas = await prisma.playa.findMany({
          where: { estado: 'abierto' },
          select: {
            id_playa: true,
            nombre: true,
            estado: true
          }
        });

        console.log(`📊 Playas abiertas encontradas: ${playasAbiertas.length}`);

        if (playasAbiertas.length > 0) {
          // Log de las playas que se van a cerrar
          playasAbiertas.forEach(playa => {
            console.log(`🏖️  Cerrando playa: ${playa.nombre} (ID: ${playa.id_playa})`);
          });

          // Cerrar todas las playas abiertas
          const result = await prisma.playa.updateMany({
            where: { estado: 'abierto' },
            data: {
              estado: 'cerrado',
              horaCerrado: new Date(),
              usuarioCerro: 'SISTEMA_AUTO'
            }
          });

          console.log(`✅ Cierre automático completado. ${result.count} playas cerradas exitosamente.`);
          
          // Notificar a través de WebSocket si está disponible
          if (global.io) {
            global.io.emit('playas-closed-automatically', {
              message: 'Todas las playas han sido cerradas automáticamente',
              count: result.count,
              timestamp: new Date().toISOString()
            });
          }
        } else {
          console.log('ℹ️  No hay playas abiertas para cerrar.');
        }
      } catch (error) {
        console.error('❌ Error al cerrar playas automáticamente:', error);
        
        // Notificar error a través de WebSocket si está disponible
        if (global.io) {
          global.io.emit('auto-close-error', {
            message: 'Error en el cierre automático de playas',
            error: error.message,
            timestamp: new Date().toISOString()
          });
        }
      }
    }, {
      timezone: "America/Lima"
    });

    // Cron de prueba cada minuto para verificar que funciona (solo en desarrollo)
    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 Modo desarrollo: Configurando cron de prueba cada 5 minutos...');
      
      cron.schedule('*/5 * * * *', async () => {
        const now = new Date();
        console.log(`⏰ Cron de prueba ejecutándose: ${now.toLocaleString('es-PE', { timeZone: 'America/Lima' })}`);
        
        // Verificar cuántas playas están abiertas
        try {
          const playasAbiertas = await prisma.playa.count({
            where: { estado: 'abierto' }
          });
          console.log(`📈 Estado actual: ${playasAbiertas} playas abiertas`);
        } catch (error) {
          console.error('❌ Error en cron de prueba:', error);
        }
      }, {
        timezone: "America/Lima"
      });
    }

    console.log('✅ CronService inicializado correctamente');
    console.log('📅 Cierre automático programado para las 00:00 (medianoche) - Zona horaria: America/Lima');
  }

  // Método para forzar cierre manual (útil para testing)
  static async forceCloseAllPlayas() {
    console.log('🔧 Forzando cierre de todas las playas...');
    
    try {
      const playasAbiertas = await prisma.playa.findMany({
        where: { estado: 'abierto' },
        select: {
          id_playa: true,
          nombre: true
        }
      });

      if (playasAbiertas.length > 0) {
        const result = await prisma.playa.updateMany({
          where: { estado: 'abierto' },
          data: {
            estado: 'cerrado',
            horaCerrado: new Date(),
            usuarioCerro: 'SISTEMA_MANUAL'
          }
        });

        console.log(`✅ Cierre manual completado. ${result.count} playas cerradas.`);
        return { success: true, count: result.count };
      } else {
        console.log('ℹ️  No hay playas abiertas para cerrar.');
        return { success: true, count: 0 };
      }
    } catch (error) {
      console.error('❌ Error en cierre manual:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = CronService;