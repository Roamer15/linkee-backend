import { Test, TestingModule } from '@nestjs/testing';
import { RedirectionController } from './redirection.controller';
import { RedirectionService } from './redirection.service';

describe('RedirectionController', () => {
  let controller: RedirectionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RedirectionController],
      providers: [RedirectionService],
    }).compile();

    controller = module.get<RedirectionController>(RedirectionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
