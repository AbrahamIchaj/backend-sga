import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Logger,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { DespachosService } from '../Services/despachos.service';
import { CreateDespachoDto } from '../dto/create-despacho.dto';
import {
  DisponibilidadDespachoQueryDto,
  ListDespachosQueryDto,
} from '../dto/despacho-query.dto';

@Controller('despachos')
export class DespachosController {
  private readonly logger = new Logger(DespachosController.name);

  constructor(private readonly despachosService: DespachosService) {}

  @Get('disponibilidad')
  async disponibilidad(@Query() query: DisponibilidadDespachoQueryDto) {
    try {
      const data = await this.despachosService.getDisponibilidad(query);
      return { success: true, data };
    } catch (error) {
      this.logger.error(
        `Error al consultar disponibilidad de despachos: ${error.message}`,
      );
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Error al consultar disponibilidad: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post()
  async create(
    @Body() body: { despacho: CreateDespachoDto; idUsuario?: number },
  ) {
    try {
      const { despacho, idUsuario } = body;
      if (!idUsuario) {
        throw new HttpException(
          'idUsuario es requerido',
          HttpStatus.BAD_REQUEST,
        );
      }

      const data = await this.despachosService.create(despacho, idUsuario);
      return { success: true, data };
    } catch (error) {
      this.logger.error(`Error al crear despacho: ${error.message}`);
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Error al crear despacho: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get()
  async findAll(@Query() query: ListDespachosQueryDto) {
    try {
      const { data, meta } = await this.despachosService.findAll(query);
      return { success: true, data, meta };
    } catch (error) {
      this.logger.error(`Error al listar despachos: ${error.message}`);
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Error al listar despachos: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    try {
      const data = await this.despachosService.findOne(id);
      return { success: true, data };
    } catch (error) {
      this.logger.error(`Error al obtener despacho ${id}: ${error.message}`);
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Error al obtener despacho: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
