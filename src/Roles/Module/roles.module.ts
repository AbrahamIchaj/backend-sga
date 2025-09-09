import { Module } from '@nestjs/common';
import { RolesController } from '../Controller/roles.controller';
import { RolesService } from '../Services/roles.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { PermisosModule } from '../../Permisos/Module/permisos.module';

@Module({
  imports: [PrismaModule, PermisosModule],
  controllers: [RolesController],
  providers: [RolesService],
  exports: [RolesService],
})
export class RolesModule {}
