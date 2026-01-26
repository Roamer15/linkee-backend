import { Controller, Get, Param, Req, Res, Query } from '@nestjs/common';
import { RedirectService } from './redirect.service';
import { Request, Response } from 'express';

@Controller('redirect')
export class RedirectController {
  constructor(private readonly redirectService: RedirectService) {}

  @Get(':shortCode')
  async handleRedirect(
    @Param('shortCode') shortCode: string,
    @Query('password') password: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const context = {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        referer: req.headers['referer'],
      };

      const targetUrl = await this.redirectService.redirect(
        shortCode,
        password,
        context,
      );

      return res.redirect(301, targetUrl);
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (error.status === 401) {
        return res
          .status(401)
          .json({ message: 'Password required', requiresPassword: true });
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      return res.status(404).json({ message: error.message });
    }
  }
}
