---
-- Tabla de PostgreSQL para gestión de Almacenes
--- ///////////////////////////////////////////
CREATE TABLE CatalogoInsumos (
    idCatalogoInsumos INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    renglon INT NOT NULL,
    codigoInsumo INT NOT NULL,
    nombreInsumo VARCHAR(255) NOT NULL,
    caracteristicas TEXT,
    nombrePresentacion VARCHAR(255) NOT NULL,
    unidadMedida VARCHAR(255) NOT NULL,
    codigoPresentacion INT NOT NULL
);
-- Datos generales de las compras 
CREATE TABLE IngresoCompras (
    idIngresoCompras INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    numeroFactura INT NOT NULL,
    serieFactura VARCHAR(50) NOT NULL,
    tipoCompra VARCHAR(50) NOT NULL,
    fechaIngreso DATE NOT NULL,
    proveedor VARCHAR(250) NOT NULL,
    ordenCompra INT NOT NULL,
    programa INT NOT NULL,
    numero1h INT NOT NULL,
    noKardex INT NOT NULL,
);
CREATE TABLE IngresoComprasDetalle (
    idIngresoComprasDetalle INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    idIngresoCompras INT NOT NULL REFERENCES IngresoCompras(idIngresoCompras),
    idCatalogoInsumos INT NOT NULL REFERENCES CatalogoInsumos(idCatalogoInsumos),
    renglon INT NOT NULL,
    codigoInsumo INT NOT NULL,
    nombreInsumo VARCHAR(150) NOT NULL,
    codigoPresentacion INT NOT NULL,
    presentacion VARCHAR(100) NOT NULL,
    cantidadTotal INT NOT NULL,
    precioUnitario NUMERIC(10, 3) NOT NULL,
    precioTotalFactura NUMERIC(10, 3) NOT NULL,
    cartaCompromiso BOOLEAN NOT NULL DEFAULT FALSE,
    observaciones TEXT NULL
);
CREATE TABLE IngresoComprasLotes (
    idIngresoComprasLotes INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    idIngresoComprasDetalle INT NOT NULL REFERENCES IngresoComprasDetalle(idIngresoComprasDetalle),
    tipoIngreso VARCHAR(50) NOT NULL,
    cantidad INT NOT NULL,
    lote VARCHAR(75) NULL,
    fechaVencimiento DATE NULL
);
CREATE TABLE Inventario (
    idInventario INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    idIngresoCompras INT NOT NULL REFERENCES IngresoCompras(idIngresoCompras),
    idIngresoComprasLotes INT NOT NULL REFERENCES IngresoComprasLotes(idIngresoComprasLotes),
    renglon INT NOT NULL,
    codigoInsumo INT NOT NULL,
    nombreInsumo VARCHAR(150) NOT NULL,
    caracteristicas VARCHAR(400) NOT NULL,
    codigoPresentacion INT NOT NULL,
    presentacion VARCHAR(100) NOT NULL,
    unidadMedida VARCHAR(255) NOT NULL,
    lote VARCHAR(75) NOT NULL,
    fechaVencimiento DATE NOT NULL,
    cantidadDisponible INT NOT NULL,
    precioUnitario NUMERIC(10, 3) NOT NULL,
    precioTotal NUMERIC(10, 3) NOT NULL
);
CREATE TABLE Servicios(
    idServicio INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    observaciones VARCHAR(400)
);
CREATE TABLE Despachos (
    idDespacho INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    fechaDespacho TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    idInventario INT NOT NULL REFERENCES Inventario(idInventario),
    idIngresoCompras INT NOT NULL REFERENCES IngresoCompras(idIngresoCompras),
    cantidad INT NOT NULL,
    totalDespachado NUMERIC(10, 3) NOT NULL,
    idServicio INT NOT NULL REFERENCES Servicios(idServicio),
    idUsuario INT NOT NULL REFERENCES Usuarios(idUsuario),
    observaciones VARCHAR(300)
);
CREATE TABLE Usuarios(
    idUsuario INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(155) NOT NULL,
    correo VARCHAR(155) NOT NULL,
    contrasena VARCHAR(10) NOT NULL,
    fechaCreacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    img BYTEA,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    fechaDesabilitacion TIMESTAMP,
    idRol INT NOT NULL REFERENCES Roles(idRoles)
);
CREATE TABLE Roles (
    idRoles INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombreRol VARCHAR(75) NOT NULL UNIQUE,
    descripcion VARCHAR(255) NOT NULL
);
CREATE TABLE Permisos (
    idPermisos INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    permiso VARCHAR(100) NOT NULL UNIQUE,
    descripcion VARCHAR(255) NOT NULL
);
CREATE TABLE RolPermisos (
    idRoles INT NOT NULL REFERENCES Roles(idRoles),
    idPermisos INT NOT NULL REFERENCES Permisos(idPermisos),
    PRIMARY KEY (idRoles, idPermisos)
);
CREATE TABLE Reajustes (
    idReajuste INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    fechaReajuste TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    tipoReajuste INT NOT NULL,
    referenciaDocumento VARCHAR(100) NOT NULL,
    observaciones VARCHAR(300) NULL,
    idUsuario INT NOT NULL REFERENCES Usuarios(idUsuario)
);
CREATE TABLE ReajusteDetalle (
    idReajusteDetalle INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    idReajuste INT NOT NULL REFERENCES Reajustes(idReajuste),
    idInventario INT NOT NULL REFERENCES Inventario(idInventario),
    idCatalogoInsumos INT NOT NULL REFERENCES CatalogoInsumos(idCatalogoInsumos),
    lote VARCHAR(50) NULL,
    fechaVencimiento DATE NULL,
    presentacion VARCHAR(155) NULL,
    cantidad INT NOT NULL
);
-- Módulo de Historial de Inventario
CREATE TABLE HistorialInventario (
    idHistorial INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    idCatalogoInsumos INT NOT NULL REFERENCES CatalogoInsumos(idCatalogoInsumos),
    idInventario INT NOT NULL REFERENCES Inventario(idInventario),
    idIngresoCompras INT NOT NULL REFERENCES IngresoCompras(idIngresoCompras),
    idDespacho INT NOT NULL REFERENCES Despachos(idDespacho),
    idReajuste INT NOT NULL REFERENCES Reajustes(idReajuste),
    lote VARCHAR(50) NOT NULL,
    fechaVencimiento DATE NOT NULL,
    cantidad INT NOT NULL,
    tipoMovimiento VARCHAR(20) NOT NULL,
    -- 'INGRESO' o 'SALIDA'
    modulo VARCHAR(50) NOT NULL,
    -- 'COMPRA', 'DESPACHO', 'REAJUSTE'
    fechaMovimiento TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    idUsuario INT NOT NULL REFERENCES Usuarios(idUsuario)
);
-- Módulo de Abastecimiento
CREATE TABLE Abastecimientos(
    idAbastecimiento INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    renglon INT NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    codigoInsumo INT NOT NULL,
    nombreInsumo VARCHAR(150) NOT NULL,
    presentacion VARCHAR(100) NOT NULL,
    existencias INT NOT NULL,
    promedioMensual INT NOT NULL,
    mesesAbastecimiento NUMERIC(3, 2) NOT NULL
);
CREATE TABLE AuditoriaSistema (
    idAuditoria INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    idUsuario INT NOT NULL REFERENCES Usuarios(idUsuario),
    fechaAccion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    tablaAfectada VARCHAR(100) NOT NULL,
    idRegistroAfectado INT NOT NULL,
    tipoAccion VARCHAR(50) NOT NULL,
    descripcionAccion TEXT,
    datosPrevios JSONB,
    datosNuevos JSONB
);