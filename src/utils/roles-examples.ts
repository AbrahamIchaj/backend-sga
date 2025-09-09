// ================================
// EJEMPLOS DE USO - MÓDULO ROLES
// ================================

// Casos de uso comunes para gestión de roles en sistema de almacén

const ejemplosRoles = {
  // ROLES TÍPICOS DE UN SISTEMA DE GESTIÓN DE ALMACÉN
  rolesComunes: [
    {
      nombreRol: "Super Administrador",
      descripcion: "Acceso total al sistema, puede gestionar usuarios, roles y permisos"
    },
    {
      nombreRol: "Administrador",
      descripcion: "Gestión general del almacén, reportes y configuraciones"
    },
    {
      nombreRol: "Jefe de Almacén",
      descripcion: "Supervisión de inventario, compras y despachos"
    },
    {
      nombreRol: "Operador de Almacén",
      descripcion: "Registro de movimientos de inventario y despachos"
    },
    {
      nombreRol: "Contador/Auditor",
      descripcion: "Acceso de solo lectura para auditorías y reportes financieros"
    },
    {
      nombreRol: "Comprador",
      descripcion: "Gestión de compras y proveedores"
    },
    {
      nombreRol: "Consultor",
      descripcion: "Acceso de solo lectura a información básica del inventario"
    }
  ],

  // ASIGNACIONES TÍPICAS DE PERMISOS POR ROL
  permisosQueSuelenTener: {
    "Super Administrador": [
      "admin.system",
      "usuarios.read", "usuarios.create", "usuarios.update", "usuarios.delete",
      "roles.read", "roles.create", "roles.update", "roles.delete",
      "permisos.read", "permisos.manage",
      "catalogo_insumos.read", "catalogo_insumos.create", "catalogo_insumos.update", "catalogo_insumos.delete", "catalogo_insumos.import",
      "inventario.read", "inventario.update", "inventario.reajustes",
      "compras.read", "compras.create", "compras.update",
      "despachos.read", "despachos.create", "despachos.cancel",
      "reportes.inventario", "reportes.movimientos", "reportes.abastecimiento"
    ],
    "Administrador": [
      "usuarios.read", "usuarios.create", "usuarios.update",
      "catalogo_insumos.read", "catalogo_insumos.create", "catalogo_insumos.update", "catalogo_insumos.import",
      "inventario.read", "inventario.update", "inventario.reajustes",
      "compras.read", "compras.create", "compras.update",
      "despachos.read", "despachos.create",
      "reportes.inventario", "reportes.movimientos", "reportes.abastecimiento",
      "servicios.read", "servicios.create", "servicios.update"
    ],
    "Jefe de Almacén": [
      "catalogo_insumos.read", "catalogo_insumos.update",
      "inventario.read", "inventario.update", "inventario.reajustes",
      "compras.read", "compras.create",
      "despachos.read", "despachos.create",
      "reportes.inventario", "reportes.movimientos",
      "servicios.read"
    ],
    "Operador de Almacén": [
      "catalogo_insumos.read",
      "inventario.read", "inventario.update",
      "despachos.read", "despachos.create",
      "servicios.read"
    ],
    "Contador/Auditor": [
      "catalogo_insumos.read",
      "inventario.read",
      "compras.read",
      "despachos.read",
      "reportes.inventario", "reportes.movimientos", "reportes.abastecimiento"
    ],
    "Comprador": [
      "catalogo_insumos.read",
      "inventario.read",
      "compras.read", "compras.create", "compras.update"
    ],
    "Consultor": [
      "catalogo_insumos.read",
      "inventario.read",
      "reportes.inventario"
    ]
  }
};

// ================================
// EJEMPLOS DE POSTMAN - ROLES
// ================================

const ejemplosPostman = {
  // 1. CREAR ROL
  crearRol: {
    method: "POST",
    url: "http://localhost:3001/api/v1/roles",
    headers: {
      "Content-Type": "application/json"
    },
    body: {
      "nombreRol": "Jefe de Almacén",
      "descripcion": "Supervisión de inventario, compras y despachos del almacén"
    }
  },

  // 2. BUSCAR ROLES
  buscarRoles: {
    method: "GET",
    url: "http://localhost:3001/api/v1/roles/search?query=almacen",
    headers: {
      "Content-Type": "application/json"
    }
  },

  // 3. ACTUALIZAR ROL (PATCH)
  actualizarRolParcial: {
    method: "PATCH",
    url: "http://localhost:3001/api/v1/roles/1",
    headers: {
      "Content-Type": "application/json"
    },
    body: {
      "descripcion": "Nueva descripción del rol actualizada"
    }
  },

  // 4. ASIGNAR PERMISOS A ROL
  asignarPermisos: {
    method: "POST",
    url: "http://localhost:3001/api/v1/roles/1/permisos",
    headers: {
      "Content-Type": "application/json"
    },
    body: {
      "permisos": [1, 2, 3, 5, 8] // IDs de permisos
    }
  },

  // 5. REVOCAR PERMISOS DE ROL
  revocarPermisos: {
    method: "DELETE",
    url: "http://localhost:3001/api/v1/roles/1/permisos",
    headers: {
      "Content-Type": "application/json"
    },
    body: {
      "permisos": [2, 3] // IDs de permisos a revocar
    }
  },

  // 6. SINCRONIZAR PERMISOS (REEMPLAZAR TODOS)
  sincronizarPermisos: {
    method: "PUT",
    url: "http://localhost:3001/api/v1/roles/1/permisos",
    headers: {
      "Content-Type": "application/json"
    },
    body: {
      "permisos": [1, 4, 7, 9] // Solo estos permisos quedarán asignados
    }
  },

  // 7. OBTENER PERMISOS DE UN ROL
  obtenerPermisosDeRol: {
    method: "GET",
    url: "http://localhost:3001/api/v1/roles/1/permisos",
    headers: {
      "Content-Type": "application/json"
    }
  },

  // 8. VERIFICAR SI ROL TIENE PERMISO ESPECÍFICO
  verificarPermiso: {
    method: "GET",
    url: "http://localhost:3001/api/v1/roles/1/permisos/verificar/catalogo_insumos.read",
    headers: {
      "Content-Type": "application/json"
    }
  },

  // 9. OBTENER ROLES SIN USUARIOS
  rolesSinUsuarios: {
    method: "GET",
    url: "http://localhost:3001/api/v1/roles/without-users",
    headers: {
      "Content-Type": "application/json"
    }
  },

  // 10. BUSCAR ROL POR NOMBRE EXACTO
  buscarPorNombre: {
    method: "GET",
    url: "http://localhost:3001/api/v1/roles/by-name/Administrador",
    headers: {
      "Content-Type": "application/json"
    }
  }
};

// ================================
// RESPUESTAS ESPERADAS
// ================================

const respuestasEjemplo = {
  // Éxito al crear rol
  crearExitoso: {
    "success": true,
    "message": "Rol creado exitosamente",
    "data": {
      "idRoles": 1,
      "nombreRol": "Jefe de Almacén",
      "descripcion": "Supervisión de inventario, compras y despachos del almacén",
      "RolPermisos": [],
      "Usuarios": []
    }
  },

  // Rol con permisos asignados
  rolConPermisos: {
    "success": true,
    "message": "Rol encontrado",
    "data": {
      "idRoles": 1,
      "nombreRol": "Administrador",
      "descripcion": "Gestión general del almacén",
      "RolPermisos": [
        {
          "Permisos": {
            "idPermisos": 1,
            "permiso": "catalogo_insumos.read",
            "descripcion": "Consultar catálogo de insumos"
          }
        },
        {
          "Permisos": {
            "idPermisos": 2,
            "permiso": "inventario.update",
            "descripcion": "Actualizar inventario"
          }
        }
      ],
      "Usuarios": [
        {
          "idUsuario": 1,
          "nombre": "Juan Pérez",
          "correo": "juan@empresa.com",
          "activo": true
        }
      ]
    }
  },

  // Error: rol duplicado
  rolYaExiste: {
    "message": "El rol \"Administrador\" ya existe",
    "error": "Conflict",
    "statusCode": 409
  },

  // Resultado de verificación de permiso
  verificacionPermiso: {
    "success": true,
    "message": "Rol tiene el permiso \"catalogo_insumos.read\"",
    "data": {
      "rolId": 1,
      "permiso": "catalogo_insumos.read",
      "tienePermiso": true
    }
  },

  // Error al eliminar rol con usuarios
  rolConUsuarios: {
    "message": "No se puede eliminar el rol porque está asignado a los siguientes usuarios: Juan Pérez, María García",
    "error": "Conflict",
    "statusCode": 409
  }
};

// ================================
// FLUJOS DE TRABAJO TÍPICOS
// ================================

const flujosDeTrabajoComunes = {
  // 1. CONFIGURACIÓN INICIAL DEL SISTEMA
  configuracionInicial: {
    pasos: [
      "1. Crear permisos básicos del sistema",
      "2. Crear rol 'Super Administrador' con todos los permisos",
      "3. Crear usuario inicial con rol Super Administrador",
      "4. Crear roles operativos (Administrador, Jefe de Almacén, etc.)",
      "5. Asignar permisos apropiados a cada rol"
    ],
    endpoints: [
      "POST /api/v1/permisos (crear múltiples permisos)",
      "POST /api/v1/roles (crear Super Administrador)",
      "POST /api/v1/roles/{id}/permisos (asignar todos los permisos)",
      "POST /api/v1/roles (crear roles operativos)",
      "POST /api/v1/roles/{id}/permisos (asignar permisos específicos)"
    ]
  },

  // 2. AGREGAR NUEVO EMPLEADO
  agregarEmpleado: {
    pasos: [
      "1. Determinar el rol apropiado para el empleado",
      "2. Verificar que el rol existe y tiene permisos correctos",
      "3. Crear usuario con el rol asignado",
      "4. Probar acceso del usuario"
    ],
    endpoints: [
      "GET /api/v1/roles/by-name/{nombreRol}",
      "GET /api/v1/roles/{id}/permisos",
      "POST /api/v1/usuarios (con idRol)"
    ]
  },

  // 3. CAMBIAR PERMISOS DE UN ROL
  cambiarPermisos: {
    pasos: [
      "1. Obtener permisos actuales del rol",
      "2. Identificar permisos a agregar/quitar",
      "3. Sincronizar permisos (reemplazar todos) O asignar/revocar específicos",
      "4. Verificar cambios"
    ],
    endpoints: [
      "GET /api/v1/roles/{id}/permisos",
      "PUT /api/v1/roles/{id}/permisos (sincronizar) O",
      "POST /api/v1/roles/{id}/permisos (asignar) +",
      "DELETE /api/v1/roles/{id}/permisos (revocar)",
      "GET /api/v1/roles/{id}/permisos (verificar)"
    ]
  },

  // 4. AUDITORÍA DE PERMISOS
  auditoriaPermisos: {
    pasos: [
      "1. Listar todos los roles",
      "2. Para cada rol, obtener usuarios y permisos",
      "3. Verificar permisos críticos",
      "4. Identificar roles sin usuarios o permisos innecesarios"
    ],
    endpoints: [
      "GET /api/v1/roles",
      "GET /api/v1/roles/{id}/permisos",
      "GET /api/v1/roles/without-users",
      "GET /api/v1/permisos/without-roles"
    ]
  }
};

// ================================
// CASOS DE PRUEBA RECOMENDADOS
// ================================

const casosDePrueba = [
  {
    nombre: "Crear estructura básica de roles",
    descripcion: "Crear roles fundamentales del sistema",
    pasos: [
      "POST /api/v1/roles - Crear 'Super Administrador'",
      "POST /api/v1/roles - Crear 'Administrador'",
      "POST /api/v1/roles - Crear 'Operador'",
      "GET /api/v1/roles - Verificar creación"
    ]
  },
  {
    nombre: "Gestión completa de permisos",
    descripcion: "Probar asignación, revocación y sincronización",
    pasos: [
      "POST /api/v1/roles/1/permisos - Asignar permisos iniciales",
      "POST /api/v1/roles/1/permisos - Asignar permisos adicionales",
      "DELETE /api/v1/roles/1/permisos - Revocar algunos permisos",
      "PUT /api/v1/roles/1/permisos - Sincronizar (reemplazar todos)"
    ]
  },
  {
    nombre: "Validación de integridad referencial",
    descripcion: "Verificar protecciones de eliminación",
    pasos: [
      "Crear rol y asignar a usuario",
      "DELETE /api/v1/roles/:id - Intentar eliminar",
      "Verificar que devuelve error 409 (Conflict)"
    ]
  },
  {
    nombre: "Búsqueda y filtrado avanzado",
    descripcion: "Probar diferentes métodos de consulta",
    pasos: [
      "GET /api/v1/roles/search?query=admin - Búsqueda por texto",
      "GET /api/v1/roles/without-users - Roles sin usuarios",
      "GET /api/v1/roles/by-name/Administrador - Búsqueda exacta"
    ]
  },
  {
    nombre: "Verificación de permisos específicos",
    descripción: "Probar verificación individual de permisos",
    pasos: [
      "Asignar permiso específico a rol",
      "GET /api/v1/roles/:id/permisos/verificar/permiso_especifico",
      "Verificar respuesta positiva",
      "Revocar permiso",
      "Verificar respuesta negativa"
    ]
  }
];

export {
  ejemplosRoles,
  ejemplosPostman,
  respuestasEjemplo,
  flujosDeTrabajoComunes,
  casosDePrueba
};
