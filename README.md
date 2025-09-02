# 🚀 Sistema de Gestión de Almacén (SGA) - Backend

<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

## 📋 Descripción

Backend del **Sistema de Gestión de Almacén (SGA)** desarrollado con **NestJS**, **Fastify** y **Prisma** para proporcionar una API REST de alto rendimiento para la gestión de inventarios, almacenes y movimientos de stock.

## ✨ Características

- **🚀 Fastify**: Plataforma HTTP de alto rendimiento
- **🏗️ NestJS**: Framework progresivo para Node.js
- **🗄️ Prisma**: ORM moderno para TypeScript y Node.js
- **📊 PostgreSQL**: Base de datos robusta y escalable
- **📊 API REST**: Endpoints bien estructurados
- **🔒 CORS**: Configurado para desarrollo y producción
- **📝 Logging**: Logging integrado con Fastify
- **🔧 TypeScript**: Código tipado y moderno
- **📦 Modular**: Arquitectura modular y escalable

## 🛠️ Tecnologías

- **NestJS**: ^11.0.1
- **Fastify**: ^5.5.0
- **Prisma**: ^6.15.0
- **PostgreSQL**: Base de datos
- **TypeScript**: ^5.7.3
- **ESLint + Prettier**: Linting y formateo de código

## 🚀 Instalación y Configuración

### Prerrequisitos

- Node.js (versión 18 o superior)
- pnpm (recomendado) o npm
- PostgreSQL (versión 12 o superior)

### Instalación

```bash
# Clonar el repositorio
git clone <url-del-repositorio>
cd backend-sga

# Instalar dependencias
pnpm install

# Configurar variables de entorno
cp env.example .env
# Editar .env con tus configuraciones de base de datos
```

### Configuración de la Base de Datos

1. **Instalar PostgreSQL** en tu sistema
2. **Crear la base de datos** usando el script proporcionado:
   ```bash
   psql -U postgres -f scripts/setup-db.sql
   ```
3. **Configurar variables de entorno** en `.env`:
   ```env
   DATABASE_URL="postgresql://postgres:tu_password@localhost:5432/sga_db?schema=public"
   ```

### Variables de Entorno

Crea un archivo `.env` basado en `env.example`:

```env
# Configuración del Servidor
PORT=3000
NODE_ENV=development

# Configuración de Base de Datos PostgreSQL
DATABASE_URL="postgresql://postgres:password@localhost:5432/sga_db?schema=public"

# Configuración de CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:4200

# Configuración de Logging
LOG_LEVEL=info
```

## 🏃‍♂️ Ejecución

### Desarrollo

```bash
# Modo desarrollo con hot reload
pnpm run start:dev

# Modo debug
pnpm run start:debug
```

### Producción

```bash
# Compilar
pnpm run build

# Ejecutar
pnpm run start:prod
```

## 🗄️ Base de Datos

### Modelos de Prisma

- **User**: Usuarios del sistema con roles
- **Category**: Categorías de productos
- **Product**: Productos del inventario
- **Warehouse**: Almacenes físicos

### Comandos de Base de Datos

```bash
# Generar cliente de Prisma
npx prisma generate

# Crear migración
npx prisma migrate dev --name init

# Aplicar migraciones
npx prisma migrate deploy

# Abrir Prisma Studio
npx prisma studio

# Resetear base de datos (solo desarrollo)
npx prisma migrate reset
```

## 📡 Endpoints de la API

### Base URL: `http://localhost:3000`

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/` | Página de bienvenida del sistema |
| `GET` | `/status` | Estado de la base de datos |
| `GET` | `/info` | Información del sistema y versión |

### Ejemplo de Respuesta

```json
{
  "name": "SGA Backend",
  "version": "1.0.0",
  "framework": "NestJS",
  "platform": "Fastify",
  "database": "PostgreSQL con Prisma",
  "features": [
    "API REST con Fastify",
    "Base de datos PostgreSQL",
    "ORM Prisma",
    "Arquitectura modular",
    "CORS habilitado"
  ]
}
```

## 🏗️ Arquitectura del Proyecto

```
backend-sga/
├── src/
│   ├── prisma/
│   │   ├── prisma.service.ts    # Servicio de Prisma
│   │   └── prisma.module.ts     # Módulo de Prisma
│   ├── app.controller.ts         # Controlador principal
│   ├── app.service.ts            # Servicios de la aplicación
│   ├── app.module.ts             # Módulo principal
│   └── main.ts                   # Punto de entrada (configuración Fastify)
├── prisma/
│   └── schema.prisma             # Esquema de la base de datos
├── scripts/
│   └── setup-db.sql              # Script de configuración de BD
└── archivos de configuración
```

## 🔧 Scripts Disponibles

| Comando | Descripción |
|---------|-------------|
| `pnpm run start` | Iniciar en modo desarrollo |
| `pnpm run start:dev` | Modo desarrollo con hot reload |
| `pnpm run start:debug` | Modo debug |
| `pnpm run start:prod` | Modo producción |
| `pnpm run build` | Compilar proyecto |
| `pnpm run lint` | Linting del código |
| `pnpm run format` | Formateo con Prettier |

## 🚧 Próximos Pasos

### Fase 1: Base de Datos ✅
- [x] Configurar Prisma ORM
- [x] Crear esquema de base de datos
- [x] Configurar conexión PostgreSQL
- [ ] Implementar migraciones
- [ ] Agregar seeders de datos

### Fase 2: Módulos del Negocio
- [ ] Módulo de Productos (CRUD de inventario)
- [ ] Módulo de Almacenes (gestión de ubicaciones)
- [ ] Módulo de Categorías (clasificación de productos)
- [ ] Módulo de Usuarios (autenticación y autorización)

### Fase 3: Funcionalidades Avanzadas
- [ ] Validación de datos con class-validator
- [ ] Autenticación JWT
- [ ] Autorización basada en roles
- [ ] Logging estructurado
- [ ] Manejo de errores global

## 📊 Estado del Proyecto

- **Infraestructura**: ✅ 100% completa
- **Configuración Fastify**: ✅ 100% completa
- **Configuración Prisma**: ✅ 100% completa
- **Esquema de Base de Datos**: ✅ 100% completo
- **API básica**: ✅ 100% completa
- **Funcionalidades SGA**: 🚧 0% implementadas

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🆘 Soporte

- **Documentación NestJS**: [https://docs.nestjs.com](https://docs.nestjs.com)
- **Documentación Fastify**: [https://www.fastify.io/docs](https://www.fastify.io/docs)
- **Documentación Prisma**: [https://www.prisma.io/docs](https://www.prisma.io/docs)
- **Issues**: Crear un issue en el repositorio

---

**Desarrollado con ❤️ usando NestJS, Fastify y Prisma**