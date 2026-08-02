import {
  BadRequestException,
  Controller,
  Get,
  Req,
} from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import {
  CompResult,
  FinderService,
  Trending,
} from 'src/finder/services/finder/finder.service';

@ApiTags('Finder')
@ApiSecurity('basic-rate-limits')
@Controller('finder')
export class FinderController {
  constructor(
    private readonly finderService: FinderService,
  ) {}

  @Get('')
  @ApiOperation({
    description: 'Find comps with filters',
    operationId: 'find-comps',
  })
  @ApiQuery({
    name: 'agents',
    description:
      'Agents that should included in the composition you are looking for. The array should be handle as followed: [].join(",")',
    type: [String],
    required: true,
    example: 'jett,fade,raze',
    minItems: 1,
    maxItems: 2,
  })
  @ApiQuery({
    name: 'eventIds',
    description:
      'Select from some specific events by their id on vlr. List should be modified as follows: [].join(",")',
    type: [String],
    required: false,
    example: '1,2,121',
  })
  @ApiQuery({
    name: 'map',
    description: 'Lowercase map name',
    required: false,
    type: String,
    example: 'summit',
  })
  @ApiQuery({
    name: 'winningState',
    description:
      'Define a specific outcome that the result should have',
    required: false,
    enum: ['won', 'lost'],
    example: 'won',
  })
  @ApiQuery({
    name: 'needsToHaveVod',
    required: false,
    type: Boolean,
    example: 'true',
  })
  @ApiQuery({
    name: 'patch',
    type: Number,
    example: 13.1,
    required: false,
  })
  @ApiQuery({
    name: 'patchBehavior',
    description: 'How should patches be handled?',
    required: false,
    example: 'above',
    enum: ['above', 'on', 'below'],
  })
  @ApiOkResponse({ type: CompResult })
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
  @ApiOperation({
    description: 'Find trending comps',
    operationId: 'trending',
  })
  @ApiQuery({
    name: 'patch',
    required: false,
    example: 12.0,
    type: Number,
  })
  @ApiQuery({
    name: 'patchRange',
    required: false,
    example: 0.1,
    type: Number,
    description:
      'Example: patchRange 0.10 includes games played on patches from 11.02 up to 12.10. (uses the patch value 12.00)',
  })
  @ApiOkResponse({
    type: Trending,
  })
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
