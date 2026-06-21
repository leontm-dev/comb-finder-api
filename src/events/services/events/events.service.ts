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
    limit: number = 100,
    page: number = 0,
  ) {
    return await this.model
      .find()
      .limit(limit)
      .skip(page * limit)
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
