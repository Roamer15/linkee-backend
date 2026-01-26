import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { LinksService } from './links.service';
import { CreateLinkDto } from './dto/create-link.dto';
import { AuthenticatedRequest } from 'src/common/type';
import { AuthGuard } from '@nestjs/passport';

@Controller('links')
@UseGuards(AuthGuard('jwt'))
export class LinksController {
  constructor(private readonly linksService: LinksService) {}

  @Post()
  async createShortUrl(
    @Body() dto: CreateLinkDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user.id;
    return this.linksService.createLink(dto, userId);
  }
}
