const BASE_URL = process.env.BASE_URL || 'http://192.88.1.122:3000';
const API_PREFIX = process.env.API_PREFIX || '/api/v1';
const AUTH_TOKEN = process.env.AUTH_TOKEN;

function getHeaders() {
  const h = { 'Content-Type': 'application/json' };
  if (AUTH_TOKEN) h['Authorization'] = `Bearer ${AUTH_TOKEN}`;
  return h;
}

async function post(path, body) {
  if (typeof fetch === 'undefined') {
    console.error('Error: global fetch no está disponible');
    process.exit(1);
  }
  const url = `${BASE_URL}${API_PREFIX}${path}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let data = text;
  try {
    data = JSON.parse(text);
  } catch (e) {}
  return { status: res.status, ok: res.ok, data };
}

async function main() {
  console.log('Seed script: iniciando');

  // Roles a crear
  const roles = [
    { nombreRol: 'Administrador', descripcion: 'Acceso a todas las funciones' },
    { nombreRol: 'Encargado', descripcion: 'Acceso a algunas las funciones' },
    { nombreRol: 'Auxiliar', descripcion: 'Acceso a solo algunas funciones' },
  ];

  const roleIdMap = {};
  for (const r of roles) {
    console.log(`Creando rol: ${r.nombreRol}`);
    const res = await post('/roles', r);
    if (!res.ok) {
      console.error('Fallo al crear rol', r, res.status, res.data);
    } else {
      const id =
        (res.data && (res.data.id || res.data.idRol || res.data.id)) || null;
      roleIdMap[r.nombreRol] = id;
      console.log('Rol creado:', r.nombreRol, '=>', id || '(sin id devuelto)');
    }
  }

  // Permisos
  const permisos = [
    {
      permiso: 'GESTIONAR_MIGRACION',
      descripcion: 'Permite gestionar la migración de datos.',
    },
    {
      permiso: 'GESTIONAR_CATALOGO-INSUMOS',
      descripcion: 'Permite gestionar el catálogo de insumos.',
    },
    {
      permiso: 'GESTIONAR_COMPRAS',
      descripcion: 'Permite realizar compras y ver historiales de compras.',
    },
    {
      permiso: 'GESTIONAR_INVENTARIO',
      descripcion: 'Permite gestionar el inventario de productos.',
    },
    {
      permiso: 'GESTIONAR_PERMISOS',
      descripcion: 'Permite gestionar los permisos.',
    },
    { permiso: 'GESTIONAR_ROLES', descripcion: 'Permite gestionar roles.' },
    {
      permiso: 'GESTIONAR_SERVICIOS',
      descripcion: 'Permite gestionar los servicios.',
    },
    {
      permiso: 'GESTIONAR_USUARIOS',
      descripcion: 'Permite gestionar los usuarios.',
    },
    {
      permiso: 'GESTIONAR_DESPACHOS',
      descripcion: 'Permite gestionar los despachos de inventario.',
    },
    {
      permiso: 'GESTIONAR_REAJUSTES',
      descripcion: 'Permite gestionar los reajustes de inventario.',
    },
    {
      permiso: 'GESTIONAR_DASHBOARD',
      descripcion: 'Permite gestionar el dashboard.',
    },
  ];

  for (const p of permisos) {
    console.log(`Creando permiso: ${p.permiso}`);
    const res = await post('/permisos', p);
    if (!res.ok) {
      console.error('Fallo al crear permiso', p, res.status, res.data);
    } else console.log('Permiso creado:', p.permiso);
  }

  // Usuario admin
  const adminRoleId = roleIdMap['Administrador'] || 1;
  const admin = {
    nombres: 'Admin',
    apellidos: 'Admin',
    correo: 'adm287@hosptecpan.com',
    password: 'HospTecpan287!',
    telefono: 78404812,
    idRol: adminRoleId,
    activo: true,
  };
  const Auxiliar = {
    nombres: 'Jose',
    apellidos: 'Santizo',
    correo: 'auxsum1hosp287@gmail.com',
    password: 'HospTecpan287@',
    telefono: 12345678,
    idRol: adminRoleId,
    activo: true,
  };

  console.log('Creando usuario administrador con idRol =', adminRoleId);
  const resUser = await post('/usuarios', admin);
  if (!resUser.ok) {
    console.error('Fallo al crear usuario admin', resUser.status, resUser.data);
    process.exit(1);
  }
  console.log('Usuario admin creado:', resUser.data);

  console.log('Seed script: terminado');
}

main().catch((err) => {
  console.error('Error en seed script:', err);
  process.exit(1);
});
