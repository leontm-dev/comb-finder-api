import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventsModule } from 'src/events/events.module';

import { ProposalsController } from './controller/proposals/proposals.controller';
import {
  EventProposal,
  EventProposalSchema,
} from './schemas/proposal.schema';
import { ProposalsService } from './services/proposals/proposals.service';

@Module({
  imports: [
    EventsModule,
    MongooseModule.forFeature([
      {
        name: EventProposal.name,
        schema: EventProposalSchema,
      },
    ]),
  ],
  providers: [ProposalsService],
  controllers: [ProposalsController],
})
export class ProposalsModule {}
