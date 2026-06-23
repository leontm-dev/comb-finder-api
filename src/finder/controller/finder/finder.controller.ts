import {
  BadRequestException,
  Controller,
  Get,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { FinderService } from 'src/finder/services/finder/finder.service';

@Controller('finder')
export class FinderController {
  constructor(
    private readonly finderService: FinderService,
  ) {}

  @Get('')
  async findComb(@Req() req: Request) {
    const {
      eventIds,
      agents,
      map,
      winningState,
      needsToHaveVod,
      patch,
      patchBehavior,
    } = req.query;

    if (!agents || typeof agents !== 'string')
      throw new BadRequestException(
        'QueryError',
        'You forgot to provide the agents query parameter.',
      );
    if (!map || typeof map !== 'string')
      throw new BadRequestException(
        'QueryError',
        'You forgot to provide the map query parameter.',
      );

    return await this.finderService.findComb(
      typeof eventIds !== 'string'
        ? []
        : eventIds.split(','),
      agents.split(','),
      map,
      winningState
        ? typeof winningState === 'string'
          ? winningState === 'won'
            ? 'won'
            : winningState === 'lost'
              ? 'lost'
              : undefined
          : undefined
        : undefined,
      needsToHaveVod
        ? typeof needsToHaveVod === 'string'
          ? needsToHaveVod === 'true'
            ? true
            : undefined
          : undefined
        : undefined,
      patch
        ? typeof patch === 'string'
          ? !isNaN(parseFloat(patch))
            ? parseFloat(patch)
            : undefined
          : undefined
        : undefined,
      patchBehavior
        ? typeof patchBehavior === 'string'
          ? patchBehavior === 'above'
            ? 'above'
            : patchBehavior === 'on'
              ? 'on'
              : patchBehavior === 'below'
                ? 'below'
                : undefined
          : undefined
        : undefined,
    );
  }

  @Get('trending')
  async findTrendingCombs(@Req() req: Request) {
    const { patch, patchRange } = req.query;
    let modPatchRange = undefined;

    if (typeof patchRange !== 'string') {
      modPatchRange = undefined;
    } else if (isNaN(parseFloat(patchRange))) {
      modPatchRange = undefined;
    } else {
      modPatchRange = parseFloat(patchRange);
    }

    let modPatch = undefined;

    if (typeof patch !== 'string') {
      modPatch = undefined;
    } else if (isNaN(parseFloat(patch))) {
      modPatch = undefined;
    } else {
      modPatch = parseFloat(patch);
    }
    return await this.finderService.getTrendingMaps(
      modPatch,
      modPatchRange,
    );
  }
}
