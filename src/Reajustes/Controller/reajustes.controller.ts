import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Param,
  ParseIntPipe,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ReajustesService } from '../Services/reajustes.service';
import { CreateReajusteDto } from '../dto/create-reajuste.dto';
import { ListReajustesQueryDto } from '../dto/reajuste-query.dto';

@Controller('reajustes')
export class ReajustesController {
  private readonly logger = new Logger(ReajustesController.name);

  constructor(private readonly reajustesService: ReajustesService) {}

  @Post()
  async create(
    @Body() body: { reajuste: CreateReajusteDto; idUsuario: number },
  ) {
    try {
      const { reajuste, idUsuario } = body;
      if (!idUsuario) {
        throw new HttpException(
          'idUsuario es requerido',
          HttpStatus.BAD_REQUEST,
        );
      }

      const data = await this.reajustesService.create(reajuste, idUsuario);
      return { success: true, data };
    } catch (error) {
      this.logger.error(`Error al crear reajuste: ${error.message}`);
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Error al crear reajuste: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get()
  async findAll(@Query() query: ListReajustesQueryDto) {
    try {
      const data = await this.reajustesService.findAll(query);
      return { success: true, ...data };
    } catch (error) {
      this.logger.error(`Error al listar reajustes: ${error.message}`);
      throw new HttpException(
        `Error al listar reajustes: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    try {
      const data = await this.reajustesService.findOne(id);
      return { success: true, data };
    } catch (error) {
      this.logger.error(`Error al obtener reajuste ${id}: ${error.message}`);
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Error al obtener reajuste: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('catalogo/buscar')
  async buscarCatalogo(@Query('q') q: string) {
    try {
      const data = await this.reajustesService.buscarCatalogo(q);
      return { success: true, data };
    } catch (error) {
      this.logger.error(
        `Error al buscar catálogo para reajustes: ${error.message}`,
      );
      throw new HttpException(
        `Error al buscar catálogo: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
