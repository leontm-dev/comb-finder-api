import { createMock } from '@golevelup/ts-jest';
import { getModelToken } from '@nestjs/mongoose';
import { Test, type TestingModule } from '@nestjs/testing';
import type { Model } from 'mongoose';
import { VlrMap } from 'src/maps/schemas/map.schema';

import { MapsService } from './maps.service';

describe('MapsService', () => {
  let service: MapsService;

  beforeEach(async () => {
    const module: TestingModule =
      await Test.createTestingModule({
        providers: [
          MapsService,
          {
            provide: getModelToken(VlrMap.name),
            useValue: createMock<Model<VlrMap>>(),
          },
        ],
      }).compile();

    service = module.get<MapsService>(MapsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
