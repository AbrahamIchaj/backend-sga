// ================================
// EJEMPLOS DE USO - MÓDULO PERMISOS
// ================================

// Casos de uso comunes para gestión de permisos en sistema de almacén

const ejemplosPermisos = {
  // PERMISOS TÍPICOS DE UN SISTEMA DE GESTIÓN DE ALMACÉN
  permisosComunes: [
    {
      permiso: "catalogo_insumos.read",
      descripcion: "Consultar catálogo de insumos"
    },
    {
      permiso: "catalogo_insumos.create",
      descripcion: "Crear nuevos insumos en el catálogo"
    },
    {
      permiso: "catalogo_insumos.update",
      descripcion: "Modificar información de insumos existentes"
    },
    {
      permiso: "catalogo_insumos.delete",
      descripcion: "Eliminar insumos del catálogo"
    },
    {
      permiso: "catalogo_insumos.import",
      descripcion: "Importar insumos masivamente desde CSV"
    },
    {
      permiso: "inventario.read",
      descripcion: "Consultar niveles de inventario"
    },
    {
      permiso: "inventario.update",
      descripcion: "Actualizar cantidades de inventario"
    },
    {
      permiso: "inventario.reajustes",
      descripcion: "Realizar reajustes de inventario"
    },
    {
      permiso: "despachos.read",
      descripcion: "Consultar historial de despachos"
    },
    {
      permiso: "despachos.create",
      descripcion: "Crear nuevos despachos"
    },
    {
      permiso: "despachos.cancel",
      descripcion: "Cancelar despachos existentes"
    },
    {
      permiso: "compras.read",
      descripcion: "Consultar registros de compras"
    },
    {
      permiso: "compras.create",
      descripcion: "Registrar nuevas compras"
    },
    {
      permiso: "compras.update",
      descripcion: "Modificar registros de compras"
    },
    {
      permiso: "reportes.inventario",
      descripcion: "Generar reportes de inventario"
    },
    {
      permiso: "reportes.movimientos",
      descripcion: "Generar reportes de movimientos"
    },
    {
      permiso: "reportes.abastecimiento",
      descripcion: "Generar reportes de abastecimiento"
    },
    {
      permiso: "usuarios.read",
      descripcion: "Consultar información de usuarios"
    },
    {
      permiso: "usuarios.create",
      descripcion: "Crear nuevos usuarios"
    },
    {
      permiso: "usuarios.update",
      descripcion: "Modificar información de usuarios"
    },
    {
      permiso: "usuarios.delete",
      descripcion: "Desactivar/eliminar usuarios"
    },
    {
      permiso: "roles.read",
      descripcion: "Consultar roles del sistema"
    },
    {
      permiso: "roles.create",
      descripcion: "Crear nuevos roles"
    },
    {
      permiso: "roles.update",
      descripcion: "Modificar roles existentes"
    },
    {
      permiso: "roles.delete",
      descripcion: "Eliminar roles del sistema"
    },
    {
      permiso: "permisos.read",
      descripcion: "Consultar permisos del sistema"
    },
    {
      permiso: "permisos.manage",
      descripcion: "Gestionar permisos del sistema"
    },
    {
      permiso: "servicios.read",
      descripcion: "Consultar servicios disponibles"
    },
    {
      permiso: "servicios.create",
      descripcion: "Crear nuevos servicios"
    },
    {
      permiso: "servicios.update",
      descripcion: "Modificar servicios existentes"
    },
    {
      permiso: "servicios.delete",
      descripcion: "Eliminar servicios"
    },
    {
      permiso: "admin.system",
      descripcion: "Administración completa del sistema"
    }
  ]
};

// ================================
// EJEMPLOS DE POSTMAN
// ================================

const ejemplosPostman = {
  // 1. CREAR PERMISO
  crearPermiso: {
    method: "POST",
    url: "http://localhost:3001/api/v1/permisos",
    headers: {
      "Content-Type": "application/json"
    },
    body: {
      "permiso": "catalogo_insumos.read",
      "descripcion": "Permite consultar el catálogo de insumos"
    }
  },

  // 2. BUSCAR PERMISOS
  buscarPermisos: {
    method: "GET",
    url: "http://localhost:3001/api/v1/permisos/search?query=insumos",
    headers: {
      "Content-Type": "application/json"
    }
  },

  // 3. ACTUALIZAR PERMISO (PATCH)
  actualizarPermisoParcial: {
    method: "PATCH",
    url: "http://localhost:3001/api/v1/permisos/1",
    headers: {
      "Content-Type": "application/json"
    },
    body: {
      "descripcion": "Nueva descripción del permiso"
    }
  },

  // 4. REEMPLAZAR PERMISO (PUT)
  reemplazarPermisoCompleto: {
    method: "PUT",
    url: "http://localhost:3001/api/v1/permisos/1",
    headers: {
      "Content-Type": "application/json"
    },
    body: {
      "permiso": "catalogo_insumos.read",
      "descripcion": "Descripción completamente nueva"
    }
  },

  // 5. OBTENER PERMISOS SIN ROLES
  permisosSinRoles: {
    method: "GET",
    url: "http://localhost:3001/api/v1/permisos/without-roles",
    headers: {
      "Content-Type": "application/json"
    }
  },

  // 6. OBTENER PERMISOS DE UN ROL ESPECÍFICO
  permisosPorRol: {
    method: "GET",
    url: "http://localhost:3001/api/v1/permisos/by-role/1",
    headers: {
      "Content-Type": "application/json"
    }
  },

  // 7. BUSCAR PERMISO POR NOMBRE EXACTO
  buscarPorNombre: {
    method: "GET",
    url: "http://localhost:3001/api/v1/permisos/by-name/catalogo_insumos.read",
    headers: {
      "Content-Type": "application/json"
    }
  },

  // 8. ELIMINAR PERMISO
  eliminarPermiso: {
    method: "DELETE",
    url: "http://localhost:3001/api/v1/permisos/1",
    headers: {
      "Content-Type": "application/json"
    }
  }
};

// ================================
// RESPUESTAS ESPERADAS
// ================================

const respuestasEjemplo = {
  // Éxito al crear permiso
  crearExitoso: {
    "success": true,
    "message": "Permiso creado exitosamente",
    "data": {
      "idPermisos": 1,
      "permiso": "catalogo_insumos.read",
      "descripcion": "Permite consultar el catálogo de insumos"
    }
  },

  // Error: permiso duplicado
  permisoYaExiste: {
    "message": "El permiso \"catalogo_insumos.read\" ya existe",
    "error": "Conflict",
    "statusCode": 409
  },

  // Resultados de búsqueda
  resultadosBusqueda: {
    "success": true,
    "message": "Búsqueda \"insumos\" encontró 3 resultados",
    "data": [
      {
        "idPermisos": 1,
        "permiso": "catalogo_insumos.read",
        "descripcion": "Consultar catálogo de insumos",
        "RolPermisos": []
      },
      {
        "idPermisos": 2,
        "permiso": "catalogo_insumos.create",
        "descripcion": "Crear nuevos insumos en el catálogo",
        "RolPermisos": [
          {
            "Roles": {
              "idRoles": 1,
              "nombreRol": "Administrador"
            }
          }
        ]
      }
    ]
  },

  // Error al eliminar permiso en uso
  permisoEnUso: {
    "message": "No se puede eliminar el permiso porque está asignado a uno o más roles",
    "error": "Conflict",
    "statusCode": 409
  }
};

// ================================
// CASOS DE PRUEBA RECOMENDADOS
// ================================

const casosDePrueba = [
  {
    nombre: "Crear permisos básicos del sistema",
    descripcion: "Crear los permisos fundamentales para cada módulo",
    pasos: [
      "POST /api/v1/permisos - Crear permiso 'catalogo_insumos.read'",
      "POST /api/v1/permisos - Crear permiso 'inventario.update'",
      "POST /api/v1/permisos - Crear permiso 'despachos.create'",
      "GET /api/v1/permisos - Verificar que se crearon correctamente"
    ]
  },
  {
    nombre: "Validar restricción de nombres únicos",
    descripcion: "Verificar que no se pueden crear permisos duplicados",
    pasos: [
      "POST /api/v1/permisos - Crear permiso 'test.permission'",
      "POST /api/v1/permisos - Intentar crear el mismo permiso",
      "Verificar que devuelve error 409 (Conflict)"
    ]
  },
  {
    nombre: "Búsqueda y filtrado de permisos",
    descripcion: "Probar diferentes métodos de búsqueda",
    pasos: [
      "GET /api/v1/permisos/search?query=catalogo - Buscar por término",
      "GET /api/v1/permisos/without-roles - Permisos sin asignar",
      "GET /api/v1/permisos/by-name/catalogo_insumos.read - Búsqueda exacta"
    ]
  },
  {
    nombre: "Actualización parcial vs completa",
    descripcion: "Comparar PATCH vs PUT",
    pasos: [
      "PATCH /api/v1/permisos/1 - Solo cambiar descripción",
      "PUT /api/v1/permisos/1 - Reemplazar permiso completo",
      "Verificar comportamiento diferente"
    ]
  },
  {
    nombre: "Protección de integridad referencial",
    descripcion: "Verificar que no se pueden eliminar permisos asignados a roles",
    pasos: [
      "Crear permiso y asignarlo a un rol",
      "DELETE /api/v1/permisos/:id - Intentar eliminar",
      "Verificar que devuelve error 409 (Conflict)"
    ]
  }
];

export {
  ejemplosPermisos,
  ejemplosPostman,
  respuestasEjemplo,
  casosDePrueba
};
