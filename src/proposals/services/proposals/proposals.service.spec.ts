import { createMock } from '@golevelup/ts-jest';
import { getModelToken } from '@nestjs/mongoose';
import { Test, type TestingModule } from '@nestjs/testing';
import type { Model } from 'mongoose';
import { EventsService } from 'src/events/services/events/events.service';
import { EventProposal } from 'src/proposals/schemas/proposal.schema';

import { ProposalsService } from './proposals.service';

describe('ProposalsService', () => {
  let service: ProposalsService;

  beforeEach(async () => {
    const module: TestingModule =
      await Test.createTestingModule({
        providers: [
          ProposalsService,
          {
            provide: EventsService,
            useValue: createMock<EventsService>(),
          },
          {
            provide: getModelToken(EventProposal.name),
            useValue: createMock<Model<EventProposal>>(),
          },
        ],
      }).compile();

    service = module.get<ProposalsService>(
      ProposalsService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
