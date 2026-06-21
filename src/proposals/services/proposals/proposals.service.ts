import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model, Types } from 'mongoose';
import { EventsService } from 'src/events/services/events/events.service';
import { EventProposal } from 'src/proposals/schemas/proposal.schema';

@Injectable()
export class ProposalsService {
  constructor(
    private readonly eventsService: EventsService,
    @InjectModel(EventProposal.name)
    private readonly proposalModel: Model<EventProposal>,
  ) {}

  async create() {}

  async getAll() {
    return await this.proposalModel.find().exec();
  }

  async getOneById(id: Types.ObjectId) {
    return await this.proposalModel.findById(id).exec();
  }

  async deleteOneById(id: Types.ObjectId) {
    await this.proposalModel.findByIdAndDelete(id).exec();
  }

  async deleteManyByIds(ids: Types.ObjectId[]) {
    await this.proposalModel.deleteMany({
      _id: { $in: ids },
    });
  }
}
