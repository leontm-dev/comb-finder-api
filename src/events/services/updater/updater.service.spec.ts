import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { EventsService } from '../events/events.service';
import { UpdaterService } from './updater.service';

describe('UpdaterService', () => {
  let service: UpdaterService;


  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UpdaterService, { provide: EventsService, useValue: createMock<EventsService>()}],
    }).compile();

    service = module.get<UpdaterService>(UpdaterService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
