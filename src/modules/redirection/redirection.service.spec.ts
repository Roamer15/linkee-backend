import { Test, TestingModule } from '@nestjs/testing';
import { RedirectionService } from './redirection.service';

describe('RedirectionService', () => {
  let service: RedirectionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RedirectionService],
    }).compile();

    service = module.get<RedirectionService>(RedirectionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
