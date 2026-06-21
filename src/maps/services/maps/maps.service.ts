import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { _QueryFilter, Model, Types } from 'mongoose';
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
    const queryObj: _QueryFilter<{
      won: boolean;
      _id: Types.ObjectId;
      createdAt: Date;
      updatedAt: Date;
      vlrId: string;
      customId: string;
      name: NonNullable<TMaps>;
      agents: string[];
      team: string;
      teamLogoUrl: string;
      vodUrl: string;
      patch: number;
      eventId: string;
    }> = {};
    if (filters.winningState)
      queryObj.won = filters.winningState === 'won';

    if (filters.hasVod)
      queryObj.vodUrl = filters.hasVod
        ? { $not: { $eq: null } }
        : null;

    if (filters.patch && filters.patchBehavior) {
      switch (filters.patchBehavior) {
        case 'above':
          queryObj.patch = { $gte: filters.patch };
        case 'below':
          queryObj.patch = { $lte: filters.patch };
        case 'on':
          queryObj.patch = filters.patch;
      }
    }

    if (filters.eventIds && filters.eventIds.length > 0) {
      queryObj.eventId = { $in: filters.eventIds };
    }

    if (filters.agents) {
      queryObj.agents = {
        $all: filters.agents.map(
          (agent) =>
            new RegExp(
              `^${decodeURIComponent(agent.toLowerCase())}$`,
              'i',
            ),
        ),
      };
    }

    if (filters.map) {
      queryObj.name = filters.map
        .toString()
        .toLowerCase() as TMaps;
    }

    return await this.mapModel.find(queryObj).exec();
  }

  async create(map: Partial<VlrMap>) {
    return await this.mapModel.create(map);
  }

  async createBulk(maps: Partial<VlrMap>[]) {
    const customIds = maps
      .map((map) => map.customId)
      .filter((map) => !!map) as string[];
    const checkedMaps = await this.mapModel.find({
      customId: { $in: customIds },
    });
    const newMaps = maps.filter(
      (map) =>
        !checkedMaps.find(
          (cm) => cm.customId === map.customId,
        ),
    );
    if (newMaps.length === 0) return [];
    return await this.mapModel.insertMany(newMaps, {
      throwOnValidationError: false,
    });
  }
}
