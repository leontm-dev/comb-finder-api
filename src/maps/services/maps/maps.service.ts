import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { VlrMap } from 'src/maps/schemas/map.schema';
import type { TMaps } from 'src/types/maps.types';

type Filters = {
  winningState?: 'won' | 'lost';
  patch?: number;
  patchBehavior?: 'above' | 'below' | 'on';
  hasVod?: boolean;
  eventIds?: string[];
  agents?: string[];
  map?: string;
};
@Injectable()
export class MapsService {
  constructor(
    @InjectModel(VlrMap.name)
    private readonly mapModel: Model<VlrMap>,
  ) {}

  async getAll() {
    return await this.mapModel.find().exec();
  }

  async getManyByEventIds(eventIds: string[]) {
    return await this.mapModel
      .find({ eventId: { $in: eventIds } })
      .exec();
  }

  async getManyWithFilters(
    filters: Filters = {
      patch: undefined,
      patchBehavior: undefined,
      winningState: undefined,
      hasVod: undefined,
    },
  ) {
    console.log({
      won:
        filters.winningState === undefined
          ? undefined
          : filters.winningState === 'won',
      vodUrl:
        filters.hasVod === undefined
          ? undefined
          : filters.hasVod
            ? { $not: { $eq: null } }
            : null,
      patch:
        filters.patchBehavior === undefined
          ? undefined
          : filters.patch === undefined
            ? undefined
            : filters.patchBehavior === 'on'
              ? filters.patch
              : filters.patchBehavior === 'above'
                ? { $gte: filters.patch }
                : { $lte: filters.patch },

      eventId: filters.eventIds?.length
        ? { $in: filters.eventIds }
        : undefined,
      name: filters.map as TMaps | undefined,
      agents: filters.agents
        ? {
            $all: filters.agents.map((agent) =>
              agent.toLowerCase(),
            ),
          }
        : undefined,
    });
    return await this.mapModel
      .find({
        won:
          filters.winningState === undefined
            ? undefined
            : filters.winningState === 'won',
        vodUrl:
          filters.hasVod === undefined
            ? undefined
            : filters.hasVod
              ? { $not: { $eq: null } }
              : null,
        patch:
          filters.patchBehavior === undefined
            ? undefined
            : filters.patch === undefined
              ? undefined
              : filters.patchBehavior === 'on'
                ? filters.patch
                : filters.patchBehavior === 'above'
                  ? { $gte: filters.patch }
                  : { $lte: filters.patch },

        eventId: filters.eventIds?.length
          ? { $in: filters.eventIds }
          : undefined,
        name: filters.map as TMaps | undefined,
        agents: filters.agents
          ? {
              $all: filters.agents.map((agent) =>
                agent.toLowerCase(),
              ),
            }
          : undefined,
      })
      .exec();
  }

  async create(map: Partial<VlrMap>) {
    return await this.mapModel.create(map);
  }

  async createBulk(maps: Partial<VlrMap>[]) {
    return await this.mapModel.insertMany(maps, {
      throwOnValidationError: false,
    });
  }
}
