import { createMock } from '@golevelup/ts-jest';
import { Test, type TestingModule } from '@nestjs/testing';
import { EventsService } from 'src/events/services/events/events.service';

import { MapsService } from '../maps/maps.service';
import { UpdaterService } from './updater.service';

describe('UpdaterService', () => {
  let service: UpdaterService;

  beforeEach(async () => {
    const module: TestingModule =
      await Test.createTestingModule({
        providers: [
          UpdaterService,
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

    service = module.get<UpdaterService>(UpdaterService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
