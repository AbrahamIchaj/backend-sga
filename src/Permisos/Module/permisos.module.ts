import { Module } from '@nestjs/common';
import { PermisosController } from '../Controller/permisos.controller';
import { PermisosService } from '../Services/permisos.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PermisosController],
  providers: [PermisosService],
  exports: [PermisosService],
})
export class PermisosModule {}
