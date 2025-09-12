import { Controller, Post, Body, Get, Param, ParseIntPipe, Query, Put, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ComprasService } from '../Services/compras.service';
import { CreateCompraDto } from '../dto/create-compra.dto';
import { ListComprasQueryDto, UpdateCompraDto, AnularCompraDto } from '../dto/update-compra.dto';

@Controller('compras')
export class ComprasController {
  private readonly logger = new Logger(ComprasController.name);

  constructor(private readonly comprasService: ComprasService) {}

  @Post()
  async create(@Body() body: { compra: CreateCompraDto; idUsuario: number }) {
    try {
      const { compra, idUsuario } = body;
      if (!idUsuario) throw new HttpException('idUsuario es requerido', HttpStatus.BAD_REQUEST);

  const result = await this.comprasService.create(compra, idUsuario);
  return { success: true, data: result };
    } catch (error) {
      this.logger.error(`Error al crear compra: ${error.message}`);
      if (error instanceof HttpException) throw error;
      throw new HttpException(`Error al crear compra: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get()
  async findAll(@Query() query: ListComprasQueryDto) {
    try {
      const data = await this.comprasService.findAll(query);
      return { success: true, ...data };
    } catch (error) {
      this.logger.error(`Error al listar compras: ${error.message}`);
      throw new HttpException(`Error al listar compras: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    try {
      const data = await this.comprasService.findOne(id);
      return { success: true, data };
    } catch (error) {
      this.logger.error(`Error al obtener compra ${id}: ${error.message}`);
      if (error instanceof HttpException) throw error;
      throw new HttpException(`Error al obtener compra: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get(':id/detalle-completo')
  async findOneWithDetails(@Param('id', ParseIntPipe) id: number) {
    try {
      const data = await this.comprasService.findOneWithDetails(id);
      return { success: true, data };
    } catch (error) {
      this.logger.error(`Error al obtener detalle completo de compra ${id}: ${error.message}`);
      if (error instanceof HttpException) throw error;
      throw new HttpException(`Error al obtener detalle completo: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Put(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCompraDto) {
    try {
      const data = await this.comprasService.update(id, dto);
      return { success: true, message: 'Compra actualizada', data };
    } catch (error) {
      this.logger.error(`Error al actualizar compra ${id}: ${error.message}`);
      if (error.code === 'P2025') {
        throw new HttpException(`Compra con ID ${id} no encontrada`, HttpStatus.NOT_FOUND);
      }
      throw new HttpException(`Error al actualizar compra: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post(':id/anular')
  async anular(@Param('id', ParseIntPipe) id: number, @Body() dto: AnularCompraDto) {
    try {
      if (!dto?.motivo?.trim()) {
        throw new HttpException('Motivo de anulación es requerido', HttpStatus.BAD_REQUEST);
      }
      if (!dto?.idUsuario) {
        throw new HttpException('idUsuario es requerido', HttpStatus.BAD_REQUEST);
      }

  const result = await this.comprasService.anular(id, dto.idUsuario, dto.motivo.trim());
  return { success: true, data: result };
    } catch (error) {
      this.logger.error(`Error al anular compra ${id}: ${error.message}`);
      if (error instanceof HttpException) throw error;
      throw new HttpException(`Error al anular compra: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
