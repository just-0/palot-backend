const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class CronService {
  static init() {
    console.log('🕒 Iniciando servicios de cron...');
    
    // Cerrar todas las playas a las 23:59 todos los días
    cron.schedule('59 23 * * *', async () => {
      console.log('🌙 Cerrando todas las playas automáticamente a las 23:59...');
      
      try {
        // Obtener todas las playas abiertas
        const playasAbiertas = await prisma.playa.findMany({
          where: { estado: 'abierto' }
        });

        if (playasAbiertas.length > 0) {
          console.log(`📋 Cerrando ${playasAbiertas.length} playas abiertas...`);
          
          // Cerrar todas las playas abiertas
          await prisma.playa.updateMany({
            where: { estado: 'abierto' },
            data: {
              estado: 'cerrado',
              horaCerrado: new Date(),
              usuarioCerro: 'SISTEMA_AUTO'
            }
          });

          console.log('✅ Todas las playas han sido cerradas automáticamente');
        } else {
          console.log('ℹ️ No hay playas abiertas para cerrar');
        }
      } catch (error) {
        console.error('❌ Error al cerrar playas automáticamente:', error);
      }
    }, {
      timezone: "America/Lima"
    });

    console.log('✅ Cron job configurado: Cierre automático de playas a las 23:59');
  }
}

module.exports = CronService;