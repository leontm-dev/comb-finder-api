import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model, Types } from 'mongoose';
import { VlrEvent } from 'src/events/schemas/event.schema';

@Injectable()
export class EventsService {
  constructor(
    @InjectModel(VlrEvent.name)
    private readonly model: Model<VlrEvent>,
  ) {}

  async create(doc: Partial<VlrEvent>) {
    return await this.model.create(doc);
  }
  async createBulk(docs: Partial<VlrEvent>[]) {
    return await this.model.insertMany(docs, {
      throwOnValidationError: false,
    });
  }

  async getAll() {
    return await this.model.find().exec();
  }

  async getAllWithPagination(
    skip: number = 0,
    limit?: number,
  ) {
    const query = this.model.find().skip(skip);
    if (limit) {
      query.limit(limit);
    }

    return await query
      .sort({
        vlrId: 'desc',
      })
      .collation({ locale: 'en_US', numericOrdering: true })
      .exec();
  }

  async getOneById(id: Types.ObjectId) {
    const event = await this.model.findById(id).exec();
    if (!event) return null;

    return event;
  }

  async getOneByVlrId(vlrId: string) {
    const event = await this.model
      .findOne({ vlrId })
      .exec();
    if (!event) return null;

    return event;
  }

  async getManyByVlrIds(vlrIds: string[]) {
    return await this.model
      .find({ vlrId: { $in: vlrIds } })
      .exec();
  }
}
