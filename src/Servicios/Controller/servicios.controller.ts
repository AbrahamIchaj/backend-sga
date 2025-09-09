import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Put,
  Param,
  Delete,
  Logger,
  HttpException,
  HttpStatus,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ServiciosService } from '../Services/servicios.service';
import { CreateServicioDto } from '../dto/create-servicio.dto';
import { UpdateServicioDto } from '../dto/update-servicio.dto';

@Controller('servicios')
export class ServiciosController {
  private readonly logger = new Logger(ServiciosController.name);

  constructor(private readonly serviciosService: ServiciosService) {}

  @Post()
  async create(@Body() createServicioDto: CreateServicioDto) {
    try {
      if (!createServicioDto.nombre?.trim()) {
        throw new HttpException('El nombre del servicio es requerido', HttpStatus.BAD_REQUEST);
      }

      const servicio = await this.serviciosService.create(createServicioDto);
      
      return {
        success: true,
        message: 'Servicio creado exitosamente',
        data: servicio,
      };
    } catch (error) {
      this.logger.error(`Error al crear servicio: ${error.message}`);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        `Error al crear servicio: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get()
  async findAll() {
    try {
      const servicios = await this.serviciosService.findAll();
      
      return {
        success: true,
        message: `Se encontraron ${servicios.length} servicios`,
        data: servicios,
      };
    } catch (error) {
      this.logger.error(`Error al obtener servicios: ${error.message}`);
      
      throw new HttpException(
        `Error al obtener servicios: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('search')
  async search(@Query('query') query: string) {
    try {
      if (!query) {
        throw new HttpException('El parámetro query es requerido', HttpStatus.BAD_REQUEST);
      }

      const servicios = await this.serviciosService.search(query);
      
      return {
        success: true,
        message: `Búsqueda "${query}" encontró ${servicios.length} resultados`,
        data: servicios,
      };
    } catch (error) {
      this.logger.error(`Error en búsqueda: ${error.message}`);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        `Error en búsqueda: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    try {
      const servicio = await this.serviciosService.findOne(id);
      
      if (!servicio) {
        throw new HttpException(`Servicio con ID ${id} no encontrado`, HttpStatus.NOT_FOUND);
      }
      
      return {
        success: true,
        message: 'Servicio encontrado',
        data: servicio,
      };
    } catch (error) {
      this.logger.error(`Error al obtener servicio con ID ${id}: ${error.message}`);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        `Error al obtener servicio: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateServicioDto: UpdateServicioDto,
  ) {
    try {
      const servicio = await this.serviciosService.update(id, updateServicioDto);
      
      return {
        success: true,
        message: 'Servicio actualizado exitosamente',
        data: servicio,
      };
    } catch (error) {
      this.logger.error(`Error al actualizar servicio con ID ${id}: ${error.message}`);
      
      if (error.code === 'P2025') {
        throw new HttpException(`Servicio con ID ${id} no encontrado`, HttpStatus.NOT_FOUND);
      }
      
      throw new HttpException(
        `Error al actualizar servicio: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':id')
  async replace(
    @Param('id', ParseIntPipe) id: number,
    @Body() createServicioDto: CreateServicioDto,
  ) {
    try {
      if (!createServicioDto.nombre?.trim()) {
        throw new HttpException('El nombre del servicio es requerido para PUT', HttpStatus.BAD_REQUEST);
      }

      // PUT reemplaza completamente el recurso
      const servicio = await this.serviciosService.update(id, {
        nombre: createServicioDto.nombre.trim(),
        observaciones: createServicioDto.observaciones?.trim() || undefined,
      });
      
      return {
        success: true,
        message: 'Servicio reemplazado exitosamente',
        data: servicio,
      };
    } catch (error) {
      this.logger.error(`Error al reemplazar servicio con ID ${id}: ${error.message}`);
      
      if (error.code === 'P2025') {
        throw new HttpException(`Servicio con ID ${id} no encontrado`, HttpStatus.NOT_FOUND);
      }
      
      throw new HttpException(
        `Error al reemplazar servicio: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    try {
      await this.serviciosService.remove(id);
      
      return {
        success: true,
        message: 'Servicio eliminado exitosamente',
      };
    } catch (error) {
      this.logger.error(`Error al eliminar servicio con ID ${id}: ${error.message}`);
      
      if (error.code === 'P2025') {
        throw new HttpException(`Servicio con ID ${id} no encontrado`, HttpStatus.NOT_FOUND);
      }
      
      if (error.code === 'P2003') {
        throw new HttpException(
          'No se puede eliminar el servicio porque tiene despachos asociados',
          HttpStatus.CONFLICT,
        );
      }
      
      throw new HttpException(
        `Error al eliminar servicio: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
