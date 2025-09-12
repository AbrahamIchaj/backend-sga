import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { ComprasController } from '../Controller/compras.controller';
import { ComprasService } from '../Services/compras.service';

@Module({
  imports: [PrismaModule],
  controllers: [ComprasController],
  providers: [ComprasService],
  exports: [ComprasService],
})
export class ComprasModule {}
