# 🚀 Sistema de Gestión de Almacén (SGA) - Backend

<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

## 📋 Descripción

Backend del **Sistema de Gestión de Almacén (SGA)** desarrollado con **NestJS** y **Fastify** para proporcionar una API REST de alto rendimiento para la gestión de inventarios, almacenes y movimientos de stock.

## ✨ Características

- **🚀 Fastify**: Plataforma HTTP de alto rendimiento
- **🏗️ NestJS**: Framework progresivo para Node.js
- **📊 API REST**: Endpoints bien estructurados con prefijo `/api/v1`
- **🔒 CORS**: Configurado para desarrollo y producción
- **📝 Logging**: Logging integrado con Fastify
- **🧪 Testing**: Tests unitarios y end-to-end con Jest
- **🔧 TypeScript**: Código tipado y moderno
- **📦 Modular**: Arquitectura modular y escalable

## 🛠️ Tecnologías

- **NestJS**: ^11.0.1
- **Fastify**: ^5.5.0
- **TypeScript**: ^5.7.3
- **Jest**: ^30.0.0
- **ESLint + Prettier**: Linting y formateo de código

## 🚀 Instalación y Configuración

### Prerrequisitos

- Node.js (versión 18 o superior)
- pnpm (recomendado) o npm

### Instalación

```bash
# Clonar el repositorio
git clone <url-del-repositorio>
cd backend-sga

# Instalar dependencias
pnpm install

# Configurar variables de entorno
cp env.example .env
# Editar .env con tus configuraciones
```

### Variables de Entorno

Crea un archivo `.env` basado en `env.example`:

```env
# Configuración del Servidor
PORT=3000
NODE_ENV=development

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

## 🧪 Testing

```bash
# Tests unitarios
pnpm run test

# Tests en modo watch
pnpm run test:watch

# Tests end-to-end
pnpm run test:e2e

# Cobertura de código
pnpm run test:cov
```

## 📡 Endpoints de la API

### Base URL: `http://localhost:3000/api/v1`

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/` | Información de bienvenida del sistema |
| `GET` | `/health` | Estado de salud de la aplicación |
| `GET` | `/info` | Información del sistema y versión |

### Ejemplo de Respuesta

```json
{
  "message": "Bienvenido al Sistema de Gestión de Almacén (SGA) - Backend API",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "status": "success"
}
```

## 🏗️ Arquitectura del Proyecto

```
src/
├── app.controller.ts      # Controlador principal
├── app.service.ts         # Servicios de la aplicación
├── app.module.ts          # Módulo principal
└── main.ts               # Punto de entrada (configuración Fastify)

test/
├── app.e2e-spec.ts       # Tests end-to-end
└── jest-e2e.json         # Configuración Jest E2E

src/app.controller.spec.ts # Tests unitarios
```

## 🔧 Scripts Disponibles

| Comando | Descripción |
|---------|-------------|
| `pnpm run start` | Iniciar en modo desarrollo |
| `pnpm run start:dev` | Modo desarrollo con hot reload |
| `pnpm run start:debug` | Modo debug |
| `pnpm run start:prod` | Modo producción |
| `pnpm run build` | Compilar proyecto |
| `pnpm run test` | Ejecutar tests unitarios |
| `pnpm run test:e2e` | Ejecutar tests end-to-end |
| `pnpm run lint` | Linting del código |
| `pnpm run format` | Formateo con Prettier |

## 🚧 Próximos Pasos

### Fase 1: Base de Datos
- [ ] Configurar TypeORM o Prisma
- [ ] Crear entidades del dominio SGA
- [ ] Implementar migraciones

### Fase 2: Módulos del Negocio
- [ ] Módulo de Productos (CRUD de inventario)
- [ ] Módulo de Almacenes (gestión de ubicaciones)
- [ ] Módulo de Movimientos (entradas/salidas)
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
- **API básica**: ✅ 100% completa
- **Testing**: ✅ 100% completo
- **Funcionalidades SGA**: 🚧 0% implementadas
- **Base de datos**: 🚧 0% configurada

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
- **Issues**: Crear un issue en el repositorio

---

**Desarrollado con ❤️ usando NestJS y Fastify**
