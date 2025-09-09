import { Module } from '@nestjs/common';
import { ServiciosController } from '../Controller/servicios.controller';
import { ServiciosService } from '../Services/servicios.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ServiciosController],
  providers: [ServiciosService],
  exports: [ServiciosService],
})
export class ServiciosModule {}
