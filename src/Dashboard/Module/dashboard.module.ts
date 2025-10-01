import { Module } from '@nestjs/common';
import { DashboardController } from '../Controller/dashboard.controller';
import { DashboardService } from '../Services/dashboard.service';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [DashboardController],
  providers: [DashboardService, PrismaService],
})
export class DashboardModule {}
