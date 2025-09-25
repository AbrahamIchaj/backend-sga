import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { InventarioController } from '../Controller/inventario.controller';
import { InventarioService } from '../Services/inventario.service';

@Module({
  imports: [PrismaModule],
  controllers: [InventarioController],
  providers: [InventarioService],
  exports: [InventarioService],
})
export class InventarioModule {}
