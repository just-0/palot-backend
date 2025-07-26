const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class CronService {
  static init() {
    // Cerrar todas las playas a las 23:59 todos los días
    cron.schedule('59 23 * * *', async () => {
      try {
        // Obtener todas las playas abiertas
        const playasAbiertas = await prisma.playa.findMany({
          where: { estado: 'abierto' }
        });

        if (playasAbiertas.length > 0) {
          // Cerrar todas las playas abiertas
          await prisma.playa.updateMany({
            where: { estado: 'abierto' },
            data: {
              estado: 'cerrado',
              horaCerrado: new Date(),
              usuarioCerro: 'SISTEMA_AUTO'
            }
          });
        }
      } catch (error) {
        // Error al cerrar playas automáticamente
      }
    }, {
      timezone: "America/Lima"
    });
  }
}

module.exports = CronService;