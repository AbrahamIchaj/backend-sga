import { Transform } from 'class-transformer';
import { ArrayUnique, IsArray, IsInt, Min } from 'class-validator';

export class ActualizarRenglonesDto {
  @IsArray({ message: 'Debe proporcionar un arreglo válido de renglones' })
  @ArrayUnique({ message: 'Los renglones no pueden repetirse' })
  @IsInt({ each: true, message: 'Cada renglón debe ser un número entero' })
  @Min(0, { each: true, message: 'Los renglones deben ser números positivos' })
  @Transform(({ value }) =>
    Array.isArray(value)
      ? value
          .map((item) => Number(item))
          .filter((item) => Number.isInteger(item) && item >= 0)
      : [],
  )
  renglones: number[] = [];
}
