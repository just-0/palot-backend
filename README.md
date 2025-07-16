# 🚀 Palot Backend - Sistema de Gestión de Estacionamientos

## 📋 Descripción

Backend modular y profesional para el sistema de gestión de estacionamientos Palot. Construido con Node.js, Express.js y MySQL siguiendo las mejores prácticas de arquitectura de software.

## ✨ Características

- 🏗️ **Arquitectura Modular** (MVC + Services)
- 🔒 **Configuración Segura** con variables de entorno
- ✅ **Validación de Datos** con middleware personalizado
- 🛡️ **Manejo de Errores** centralizado
- 📊 **Logging Estructurado**
- 🔄 **Compatibilidad Legacy** para transición suave
- 🚀 **Graceful Shutdown** para producción
- 📱 **API RESTful** moderna

## 🛠️ Tecnologías

- **Runtime**: Node.js
- **Framework**: Express.js
- **Base de Datos**: MySQL
- **ORM**: Prisma (configurado)
- **Validación**: Middleware personalizado
- **Configuración**: dotenv
- **Parsing**: xml2js para cámaras

## 📦 Instalación

```bash
# Clonar el repositorio
git clone <repository-url>
cd palot-backend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones

# Iniciar servidor
npm start
```

## ⚙️ Configuración

### Variables de Entorno Principales

```env
# Servidor
PORT=3000
HOST=localhost
NODE_ENV=development

# Base de Datos
DB_HOST=localhost
DB_USER=tu_usuario
DB_PASSWORD=tu_contraseña
DB_NAME=palot

# Cámara
CAM_URL=http://192.168.1.64/ISAPI/Traffic/channels/1/vehicleDetect/plates
CAM_USER=admin
CAM_PASSWORD=tu_contraseña_camara
```

Ver `ENVIRONMENT-CONFIG.md` para configuración completa.

## 🚀 Uso

### Iniciar Servidor
```bash
npm start
```

### Desarrollo
```bash
npm run dev  # Si tienes nodemon configurado
```

### Endpoints Principales

#### Nuevos Endpoints (RESTful)
```
GET    /api/health              # Health check
POST   /api/auth/login          # Autenticación
GET    /api/playas              # Obtener playas
GET    /api/vehicles/autos      # Obtener autos
GET    /api/vehicles/motos      # Obtener motos
PUT    /api/vehicles/autos/:id/state  # Actualizar estado auto
GET    /api/camera/plates       # Obtener placas de cámara
```

#### Legacy Endpoints (Compatibilidad)
```
POST   /login                   # Login legacy
GET    /showPlayas              # Playas legacy
GET    /getPlacas               # Autos legacy
GET    /getPlacasMotos          # Motos legacy
```

## 📁 Estructura del Proyecto

```
palot-backend/
├── src/
│   ├── config/          # Configuraciones
│   ├── models/          # Modelos de datos
│   ├── services/        # Lógica de negocio
│   ├── controllers/     # Controladores HTTP
│   ├── routes/          # Definición de rutas
│   ├── middleware/      # Middleware personalizado
│   ├── utils/           # Utilidades
│   └── index.js         # Servidor principal
├── tests/               # Archivos de prueba
├── docs/               # Documentación
└── README.md
```

## 🧪 Testing

### Pruebas con archivo HTTP
```bash
# Usar tests/api.http con tu cliente HTTP favorito
# (VS Code REST Client, Postman, Insomnia)
```

### Ejemplos de Requests

```http
# Health Check
GET http://localhost:3000/api/health

# Login
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "username": "tu_usuario",
  "password": "tu_contraseña"
}
```

## 📊 Monitoreo

### Health Check
```bash
curl http://localhost:3000/api/health
```

### Logs del Servidor
El servidor proporciona logs estructurados con:
- ✅ Conexión a base de datos
- 📷 Estado de cámara
- 🚀 Información de inicio
- ❌ Errores detallados

## 🔧 Desarrollo

### Agregar Nueva Funcionalidad

1. **Crear Modelo** en `src/models/`
2. **Crear Servicio** en `src/services/`
3. **Crear Controlador** en `src/controllers/`
4. **Definir Rutas** en `src/routes/`
5. **Agregar Validación** en `src/middleware/validation.js`

### Ejemplo: Agregar Nuevo Endpoint

```javascript
// 1. Modelo (src/models/NewModel.js)
class NewModel {
  static async getAll() {
    // Lógica de base de datos
  }
}

// 2. Servicio (src/services/NewService.js)
class NewService {
  static async getAllItems() {
    // Lógica de negocio
  }
}

// 3. Controlador (src/controllers/NewController.js)
class NewController {
  static async getAll(req, res) {
    // Manejo de HTTP
  }
}

// 4. Ruta (src/routes/new.js)
router.get('/', NewController.getAll);
```

## 🚀 Despliegue

### Producción
```bash
NODE_ENV=production npm start
```

### Variables de Entorno para Producción
- Cambiar `DB_PASSWORD` por contraseña segura
- Actualizar `CAM_PASSWORD` 
- Configurar `CORS_ORIGIN` con dominio real
- Usar HTTPS en `CAM_URL` si es posible

## 🛡️ Seguridad

- ✅ Variables de entorno para credenciales
- ✅ Validación de entrada de datos
- ✅ Manejo seguro de errores
- ✅ CORS configurado
- ✅ Archivos de prueba sin credenciales

## 📚 Documentación

- `ARCHITECTURE.md` - Arquitectura detallada
- `ENVIRONMENT-CONFIG.md` - Configuración completa
- `tests/api.http` - Ejemplos de API

## 🤝 Contribución

1. Fork el proyecto
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.

## 🆘 Soporte

Para soporte técnico:
1. Revisar documentación en `/docs`
2. Verificar logs del servidor
3. Comprobar configuración en `.env`
4. Revisar conectividad de base de datos y cámara

---

**¡Tu backend ahora es profesional y escalable! 🎉**