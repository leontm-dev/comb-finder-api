import { createMock } from '@golevelup/ts-jest';
import { Test, type TestingModule } from '@nestjs/testing';
import { UpdaterService } from 'src/events/services/updater/updater.service';

import { UpdaterController } from './updater.controller';

describe('UpdaterController', () => {
  let controller: UpdaterController;

  beforeEach(async () => {
    const module: TestingModule =
      await Test.createTestingModule({
        controllers: [UpdaterController],
        providers: [
          {
            provide: UpdaterService,
            useValue: createMock<UpdaterService>(),
          },
        ],
      }).compile();

    controller = module.get<UpdaterController>(
      UpdaterController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should have run function', () => {
    expect(controller.runCronJob).toBeDefined();
  });
});
