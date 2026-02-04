import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { LinksService } from './links.service';
import { CreateLinkDto } from './dto/create-link.dto';
import { UpdateLinkDto } from './dto/update-link.dto';
import { AuthenticatedRequest } from 'src/common/type';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';

@Controller('api/links')
@UseGuards(AuthGuard('jwt'))
export class LinksController {
  constructor(private readonly linksService: LinksService) {}

  @Post()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async createShortUrl(
    @Body() dto: CreateLinkDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user.id;
    return this.linksService.createLink(dto, userId);
  }

  @Get()
  async getAllLinks(@Req() req: AuthenticatedRequest) {
    const userId = req.user.id;
    return this.linksService.getLinksByUser(userId);
  }

  @Patch(':id')
  async updateLink(
    @Param('id') id: string,
    @Body() dto: UpdateLinkDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user.id;
    return this.linksService.updateLink(id, userId, dto);
  }
}
