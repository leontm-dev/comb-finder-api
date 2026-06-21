import { createMock } from '@golevelup/ts-jest';
import { Test, type TestingModule } from '@nestjs/testing';
import { FinderService } from 'src/finder/services/finder/finder.service';

import { FinderController } from './finder.controller';

describe('FinderController', () => {
  let controller: FinderController;

  beforeEach(async () => {
    const module: TestingModule =
      await Test.createTestingModule({
        controllers: [FinderController],
        providers: [
          {
            provide: FinderService,
            useValue: createMock<FinderService>(),
          },
        ],
      }).compile();

    controller = module.get<FinderController>(
      FinderController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
