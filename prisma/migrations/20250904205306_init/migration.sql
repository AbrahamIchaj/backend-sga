-- CreateTable
CREATE TABLE "public"."CatalogoInsumos" (
    "idCatalogoInsumos" SERIAL NOT NULL,
    "renglon" INTEGER NOT NULL,
    "codigoInsumo" INTEGER NOT NULL,
    "nombreInsumo" VARCHAR(255) NOT NULL,
    "caracteristicas" TEXT NOT NULL,
    "nombrePresentacion" VARCHAR(255) NOT NULL,
    "unidadMedida" VARCHAR(255) NOT NULL,
    "codigoPresentacion" INTEGER NOT NULL,

    CONSTRAINT "CatalogoInsumos_pkey" PRIMARY KEY ("idCatalogoInsumos")
);

-- CreateTable
CREATE TABLE "public"."IngresoCompras" (
    "idIngresoCompras" SERIAL NOT NULL,
    "numeroFactura" INTEGER NOT NULL,
    "serieFactura" VARCHAR(50) NOT NULL,
    "tipoCompra" VARCHAR(50) NOT NULL,
    "fechaIngreso" DATE NOT NULL,
    "proveedor" VARCHAR(250) NOT NULL,
    "ordenCompra" INTEGER NOT NULL,
    "programa" INTEGER NOT NULL,
    "numero1h" INTEGER NOT NULL,
    "noKardex" INTEGER NOT NULL,

    CONSTRAINT "IngresoCompras_pkey" PRIMARY KEY ("idIngresoCompras")
);

-- CreateTable
CREATE TABLE "public"."IngresoComprasDetalle" (
    "idIngresoComprasDetalle" SERIAL NOT NULL,
    "idIngresoCompras" INTEGER NOT NULL,
    "idCatalogoInsumos" INTEGER NOT NULL,
    "renglon" INTEGER NOT NULL,
    "codigoInsumo" INTEGER NOT NULL,
    "nombreInsumo" VARCHAR(150) NOT NULL,
    "codigoPresentacion" INTEGER NOT NULL,
    "presentacion" VARCHAR(100) NOT NULL,
    "cantidadTotal" INTEGER NOT NULL,
    "precioUnitario" DECIMAL(10,3) NOT NULL,
    "precioTotalFactura" DECIMAL(10,3) NOT NULL,
    "cartaCompromiso" BOOLEAN NOT NULL DEFAULT false,
    "observaciones" TEXT,

    CONSTRAINT "IngresoComprasDetalle_pkey" PRIMARY KEY ("idIngresoComprasDetalle")
);

-- CreateTable
CREATE TABLE "public"."IngresoComprasLotes" (
    "idIngresoComprasLotes" SERIAL NOT NULL,
    "idIngresoComprasDetalle" INTEGER NOT NULL,
    "tipoIngreso" VARCHAR(50) NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "lote" VARCHAR(75),
    "fechaVencimiento" TIMESTAMP(3),

    CONSTRAINT "IngresoComprasLotes_pkey" PRIMARY KEY ("idIngresoComprasLotes")
);

-- CreateTable
CREATE TABLE "public"."Inventario" (
    "idInventario" SERIAL NOT NULL,
    "idIngresoCompras" INTEGER NOT NULL,
    "idIngresoComprasLotes" INTEGER NOT NULL,
    "renglon" INTEGER NOT NULL,
    "codigoInsumo" INTEGER NOT NULL,
    "nombreInsumo" VARCHAR(150) NOT NULL,
    "caracteristicas" VARCHAR(400) NOT NULL,
    "codigoPresentacion" INTEGER NOT NULL,
    "presentacion" VARCHAR(100) NOT NULL,
    "unidadMedida" VARCHAR(255) NOT NULL,
    "lote" VARCHAR(75) NOT NULL,
    "fechaVencimiento" TIMESTAMP(3) NOT NULL,
    "cantidadDisponible" INTEGER NOT NULL,
    "precioUnitario" DECIMAL(10,3) NOT NULL,
    "precioTotal" DECIMAL(10,3) NOT NULL,

    CONSTRAINT "Inventario_pkey" PRIMARY KEY ("idInventario")
);

-- CreateTable
CREATE TABLE "public"."Servicios" (
    "idServicio" SERIAL NOT NULL,
    "nombre" VARCHAR(200) NOT NULL,
    "observaciones" VARCHAR(400),

    CONSTRAINT "Servicios_pkey" PRIMARY KEY ("idServicio")
);

-- CreateTable
CREATE TABLE "public"."Despachos" (
    "idDespacho" SERIAL NOT NULL,
    "fechaDespacho" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "idInventario" INTEGER NOT NULL,
    "idIngresoCompras" INTEGER NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "totalDespachado" DECIMAL(10,3) NOT NULL,
    "idServicio" INTEGER NOT NULL,
    "idUsuario" INTEGER NOT NULL,
    "observaciones" VARCHAR(300),

    CONSTRAINT "Despachos_pkey" PRIMARY KEY ("idDespacho")
);

-- CreateTable
CREATE TABLE "public"."Usuarios" (
    "idUsuario" SERIAL NOT NULL,
    "nombre" VARCHAR(155) NOT NULL,
    "correo" VARCHAR(155) NOT NULL,
    "contrasena" VARCHAR(10) NOT NULL,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "img" BYTEA,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fechaDesabilitacion" TIMESTAMP(3),
    "idRol" INTEGER NOT NULL,
    "rol" VARCHAR(50) NOT NULL,

    CONSTRAINT "Usuarios_pkey" PRIMARY KEY ("idUsuario")
);

-- CreateTable
CREATE TABLE "public"."Roles" (
    "idRoles" SERIAL NOT NULL,
    "nombreRol" VARCHAR(75) NOT NULL,
    "descripcion" VARCHAR(255) NOT NULL,

    CONSTRAINT "Roles_pkey" PRIMARY KEY ("idRoles")
);

-- CreateTable
CREATE TABLE "public"."Permisos" (
    "idPermisos" SERIAL NOT NULL,
    "permiso" VARCHAR(100) NOT NULL,
    "descripcion" VARCHAR(255) NOT NULL,

    CONSTRAINT "Permisos_pkey" PRIMARY KEY ("idPermisos")
);

-- CreateTable
CREATE TABLE "public"."RolPermisos" (
    "idRoles" INTEGER NOT NULL,
    "idPermisos" INTEGER NOT NULL,

    CONSTRAINT "RolPermisos_pkey" PRIMARY KEY ("idRoles","idPermisos")
);

-- CreateTable
CREATE TABLE "public"."Reajustes" (
    "idReajuste" SERIAL NOT NULL,
    "fechaReajuste" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tipoReajuste" INTEGER NOT NULL,
    "referenciaDocumento" VARCHAR(100) NOT NULL,
    "observaciones" VARCHAR(300),
    "idUsuario" INTEGER NOT NULL,

    CONSTRAINT "Reajustes_pkey" PRIMARY KEY ("idReajuste")
);

-- CreateTable
CREATE TABLE "public"."ReajusteDetalle" (
    "idReajusteDetalle" SERIAL NOT NULL,
    "idReajuste" INTEGER NOT NULL,
    "idInventario" INTEGER NOT NULL,
    "idCatalogoInsumos" INTEGER NOT NULL,
    "lote" VARCHAR(50),
    "fechaVencimiento" TIMESTAMP(3),
    "presentacion" VARCHAR(155),
    "cantidad" INTEGER NOT NULL,

    CONSTRAINT "ReajusteDetalle_pkey" PRIMARY KEY ("idReajusteDetalle")
);

-- CreateTable
CREATE TABLE "public"."HistorialInventario" (
    "idHistorial" SERIAL NOT NULL,
    "idCatalogoInsumos" INTEGER NOT NULL,
    "idInventario" INTEGER NOT NULL,
    "idIngresoCompras" INTEGER NOT NULL,
    "idDespacho" INTEGER NOT NULL,
    "idReajuste" INTEGER NOT NULL,
    "lote" VARCHAR(50),
    "fechaVencimiento" TIMESTAMP(3) NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "tipoMovimiento" VARCHAR(20) NOT NULL,
    "modulo" VARCHAR(50) NOT NULL,
    "fechaMovimiento" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "idUsuario" INTEGER NOT NULL,

    CONSTRAINT "HistorialInventario_pkey" PRIMARY KEY ("idHistorial")
);

-- CreateTable
CREATE TABLE "public"."Abastecimientos" (
    "idAbastecimiento" SERIAL NOT NULL,
    "renglon" INTEGER NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "codigoInsumo" INTEGER NOT NULL,
    "nombreInsumo" VARCHAR(150) NOT NULL,
    "presentacion" VARCHAR(100) NOT NULL,
    "existencias" INTEGER NOT NULL,
    "promedioMensual" INTEGER NOT NULL,
    "mesesAbastecimiento" DECIMAL(3,2) NOT NULL,

    CONSTRAINT "Abastecimientos_pkey" PRIMARY KEY ("idAbastecimiento")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuarios_correo_key" ON "public"."Usuarios"("correo");

-- CreateIndex
CREATE UNIQUE INDEX "Roles_nombreRol_key" ON "public"."Roles"("nombreRol");

-- CreateIndex
CREATE UNIQUE INDEX "Permisos_permiso_key" ON "public"."Permisos"("permiso");

-- AddForeignKey
ALTER TABLE "public"."IngresoComprasDetalle" ADD CONSTRAINT "IngresoComprasDetalle_idIngresoCompras_fkey" FOREIGN KEY ("idIngresoCompras") REFERENCES "public"."IngresoCompras"("idIngresoCompras") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."IngresoComprasDetalle" ADD CONSTRAINT "IngresoComprasDetalle_idCatalogoInsumos_fkey" FOREIGN KEY ("idCatalogoInsumos") REFERENCES "public"."CatalogoInsumos"("idCatalogoInsumos") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."IngresoComprasLotes" ADD CONSTRAINT "IngresoComprasLotes_idIngresoComprasDetalle_fkey" FOREIGN KEY ("idIngresoComprasDetalle") REFERENCES "public"."IngresoComprasDetalle"("idIngresoComprasDetalle") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Inventario" ADD CONSTRAINT "Inventario_idIngresoCompras_fkey" FOREIGN KEY ("idIngresoCompras") REFERENCES "public"."IngresoCompras"("idIngresoCompras") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Inventario" ADD CONSTRAINT "Inventario_idIngresoComprasLotes_fkey" FOREIGN KEY ("idIngresoComprasLotes") REFERENCES "public"."IngresoComprasLotes"("idIngresoComprasLotes") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Despachos" ADD CONSTRAINT "Despachos_idInventario_fkey" FOREIGN KEY ("idInventario") REFERENCES "public"."Inventario"("idInventario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Despachos" ADD CONSTRAINT "Despachos_idIngresoCompras_fkey" FOREIGN KEY ("idIngresoCompras") REFERENCES "public"."IngresoCompras"("idIngresoCompras") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Despachos" ADD CONSTRAINT "Despachos_idServicio_fkey" FOREIGN KEY ("idServicio") REFERENCES "public"."Servicios"("idServicio") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Despachos" ADD CONSTRAINT "Despachos_idUsuario_fkey" FOREIGN KEY ("idUsuario") REFERENCES "public"."Usuarios"("idUsuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Usuarios" ADD CONSTRAINT "Usuarios_idRol_fkey" FOREIGN KEY ("idRol") REFERENCES "public"."Roles"("idRoles") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RolPermisos" ADD CONSTRAINT "RolPermisos_idRoles_fkey" FOREIGN KEY ("idRoles") REFERENCES "public"."Roles"("idRoles") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RolPermisos" ADD CONSTRAINT "RolPermisos_idPermisos_fkey" FOREIGN KEY ("idPermisos") REFERENCES "public"."Permisos"("idPermisos") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Reajustes" ADD CONSTRAINT "Reajustes_idUsuario_fkey" FOREIGN KEY ("idUsuario") REFERENCES "public"."Usuarios"("idUsuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReajusteDetalle" ADD CONSTRAINT "ReajusteDetalle_idReajuste_fkey" FOREIGN KEY ("idReajuste") REFERENCES "public"."Reajustes"("idReajuste") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReajusteDetalle" ADD CONSTRAINT "ReajusteDetalle_idInventario_fkey" FOREIGN KEY ("idInventario") REFERENCES "public"."Inventario"("idInventario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReajusteDetalle" ADD CONSTRAINT "ReajusteDetalle_idCatalogoInsumos_fkey" FOREIGN KEY ("idCatalogoInsumos") REFERENCES "public"."CatalogoInsumos"("idCatalogoInsumos") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."HistorialInventario" ADD CONSTRAINT "HistorialInventario_idCatalogoInsumos_fkey" FOREIGN KEY ("idCatalogoInsumos") REFERENCES "public"."CatalogoInsumos"("idCatalogoInsumos") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."HistorialInventario" ADD CONSTRAINT "HistorialInventario_idInventario_fkey" FOREIGN KEY ("idInventario") REFERENCES "public"."Inventario"("idInventario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."HistorialInventario" ADD CONSTRAINT "HistorialInventario_idIngresoCompras_fkey" FOREIGN KEY ("idIngresoCompras") REFERENCES "public"."IngresoCompras"("idIngresoCompras") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."HistorialInventario" ADD CONSTRAINT "HistorialInventario_idDespacho_fkey" FOREIGN KEY ("idDespacho") REFERENCES "public"."Despachos"("idDespacho") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."HistorialInventario" ADD CONSTRAINT "HistorialInventario_idReajuste_fkey" FOREIGN KEY ("idReajuste") REFERENCES "public"."Reajustes"("idReajuste") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."HistorialInventario" ADD CONSTRAINT "HistorialInventario_idUsuario_fkey" FOREIGN KEY ("idUsuario") REFERENCES "public"."Usuarios"("idUsuario") ON DELETE RESTRICT ON UPDATE CASCADE;
