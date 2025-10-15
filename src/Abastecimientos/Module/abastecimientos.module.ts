import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { ReportesModule } from '../../Reportes/Module/reportes.module';
import { AbastecimientosController } from '../Controller/abastecimientos.controller';
import { AbastecimientosService } from '../Services/abastecimientos.service';

@Module({
  imports: [PrismaModule, ReportesModule],
  controllers: [AbastecimientosController],
  providers: [AbastecimientosService],
  exports: [AbastecimientosService],
})
export class AbastecimientosModule {}
