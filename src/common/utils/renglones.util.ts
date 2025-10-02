export async function obtenerRenglonesPermitidos(
  prisma: any,
  idUsuario: number,
): Promise<number[]> {
  if (!idUsuario) {
    return [];
  }

  if (!prisma?.usuariosRenglones?.findMany) {
    return [];
  }

  const registros = await prisma.usuariosRenglones.findMany({
    where: { idUsuario, activo: true },
    select: { renglon: true },
  });

  const unicos = new Set<number>();
  registros.forEach((item) => {
    if (typeof item.renglon === 'number') {
      unicos.add(item.renglon);
    }
  });

  return Array.from(unicos.values()).sort((a, b) => a - b);
}

export function validarRenglonPermitido(
  renglonesPermitidos: number[] | undefined,
  renglon: number | null | undefined,
): boolean {
  if (!renglonesPermitidos || renglonesPermitidos.length === 0) {
    return false;
  }
  if (renglon === null || typeof renglon === 'undefined') {
    return false;
  }
  return renglonesPermitidos.includes(Number(renglon));
}
