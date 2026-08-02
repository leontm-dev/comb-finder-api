import { createMock } from '@golevelup/ts-jest';
import { Test, type TestingModule } from '@nestjs/testing';
import { EventsService } from 'src/events/services/events/events.service';

import { EventsController } from './events.controller';

describe('EventsController', () => {
  let controller: EventsController;

  beforeEach(async () => {
    const module: TestingModule =
      await Test.createTestingModule({
        controllers: [EventsController],
        providers: [
          {
            provide: EventsService,
            useValue: createMock<EventsService>(),
          },
        ],
      }).compile();

    controller = module.get<EventsController>(
      EventsController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should have getEvents function', () => {
    expect(controller.getEvents).toBeDefined();
  });
});
