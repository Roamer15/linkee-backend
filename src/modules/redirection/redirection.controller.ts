import { Controller } from '@nestjs/common';
import { RedirectionService } from './redirection.service';

@Controller('redirection')
export class RedirectionController {
  constructor(private readonly redirectionService: RedirectionService) {}
}
