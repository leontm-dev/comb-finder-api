import { createMock } from '@golevelup/ts-jest';
import { Test, type TestingModule } from '@nestjs/testing';
import { EventsService } from 'src/events/services/events/events.service';
import { MapsService } from 'src/maps/services/maps/maps.service';

import { FinderService } from './finder.service';

describe('FinderService', () => {
  let service: FinderService;

  beforeEach(async () => {
    const module: TestingModule =
      await Test.createTestingModule({
        providers: [
          FinderService,
          {
            provide: EventsService,
            useValue: createMock<EventsService>(),
          },
          {
            provide: MapsService,
            useValue: createMock<MapsService>(),
          },
        ],
      }).compile();

    service = module.get<FinderService>(FinderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
