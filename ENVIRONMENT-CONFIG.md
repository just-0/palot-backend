# Configuración de Environment - Palot Backend

## 📁 Estructura de Configuración

El backend utiliza un archivo `.env` para todas las configuraciones, siguiendo las mejores prácticas de desarrollo.

## ⚙️ Variables de Entorno Configuradas

### 🖥️ **Configuración del Servidor**
```env
NODE_ENV=development          # Entorno de ejecución
PORT=3000                    # Puerto del servidor
HOST=localhost               # Host del servidor
```

### 🗄️ **Configuración de Base de Datos**
```env
DATABASE_URL="mysql://justo:yuca123@localhost:3306/palot"
DB_HOST=localhost
DB_USER=justo
DB_PASSWORD=yuca123          # ⚠️ CAMBIAR EN PRODUCCIÓN
DB_NAME=palot
DB_PORT=3306
```

### 🕒 **Configuración de Zona Horaria**
```env
TIMEZONE=America/Lima        # Zona horaria para fechas
DATE_FORMAT=YYYY-MM-DD HH:mm:ss  # Formato de fechas
```

### 📷 **Configuración de Cámara**
```env
CAM_URL=http://192.168.1.64/ISAPI/Traffic/channels/1/vehicleDetect/plates
CAM_USER=admin
CAM_PASSWORD=Hik12345        # ⚠️ CAMBIAR EN PRODUCCIÓN
CAM_TIMEOUT=5000            # Timeout en milisegundos
```

### 🌐 **Códigos de Estado HTTP**
```env
HTTP_OK=200
HTTP_CREATED=201
HTTP_BAD_REQUEST=400
HTTP_UNAUTHORIZED=401
HTTP_NOT_FOUND=404
HTTP_INTERNAL_ERROR=500
```

### 🔐 **Configuración de Seguridad**
```env
LOGIN_ERROR_WRONG_PASSWORD=1
LOGIN_ERROR_USER_NOT_FOUND=2
LOGIN_ERROR_DB_ERROR=3
```

### 🌍 **Configuración CORS**
```env
CORS_ORIGIN=http://localhost:4200
CORS_METHODS=GET,POST,PUT,DELETE,OPTIONS
CORS_HEADERS=Content-Type,Authorization
```

## 🚀 **Comandos de Ejecución**

### Desarrollo
```bash
npm start
# o
npm run dev
```

### Producción
```bash
NODE_ENV=production npm start
```

## 🔧 **Funcionalidades Implementadas**

### ✅ **URLs Dinámicas**
- Todas las URLs se construyen usando variables de entorno
- Fácil cambio entre desarrollo/producción

### ✅ **Códigos de Estado Configurables**
- Todos los códigos HTTP son configurables
- Consistencia en respuestas de API

### ✅ **Zona Horaria Configurable**
- Todas las fechas usan la zona horaria configurada
- Formato de fecha consistente

### ✅ **Manejo de Errores Mejorado**
- Códigos de error configurables
- Mensajes de error consistentes

## 📝 **Ejemplo de Uso**

```javascript
// Antes (hardcodeado)
res.status(500).send("Error");

// Ahora (configurable)
res.status(parseInt(process.env.HTTP_INTERNAL_ERROR) || 500).send("Error");
```

## ⚠️ **Importante para Producción**

### 🔒 **Cambiar Credenciales**
- `DB_PASSWORD`: Cambiar contraseña de base de datos
- `CAM_PASSWORD`: Cambiar contraseña de cámara
- `CAM_USER`: Verificar usuario de cámara

### 🌐 **Actualizar URLs**
- `DB_HOST`: Cambiar a servidor de producción
- `CAM_URL`: Actualizar IP de cámara en producción
- `CORS_ORIGIN`: Cambiar a dominio de producción

### 🛡️ **Seguridad**
- Usar HTTPS en producción
- Configurar firewall apropiado
- Usar variables de entorno seguras

## 🐛 **Troubleshooting**

### Error de Base de Datos
- Verificar `DATABASE_URL`
- Comprobar credenciales `DB_*`

### Error de Cámara
- Verificar `CAM_URL`
- Comprobar conectividad de red
- Validar credenciales `CAM_*`

### Error de Puerto
- Cambiar `PORT` si está ocupado
- Verificar permisos de puerto