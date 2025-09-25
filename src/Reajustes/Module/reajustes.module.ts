import { Module } from '@nestjs/common';
import { ReajustesController } from '../Controller/reajustes.controller';
import { ReajustesService } from '../Services/reajustes.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ReajustesController],
  providers: [ReajustesService],
  exports: [ReajustesService]
})
export class ReajustesModule {}
