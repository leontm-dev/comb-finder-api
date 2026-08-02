import { Injectable } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { EventsService } from 'src/events/services/events/events.service';
import { MapsService } from 'src/maps/services/maps/maps.service';

export type CombResult = {
  agents: string[];
  map: string;
  team: {
    iconUrl: string;
    name: string;
  };
  won: boolean;
  vod: string | null;
  event: {
    iconUrl: string | null;
    title: string | null;
  };
  patch: number | null;
  url: string;
};

export type TrendingResult = Record<string, TrendingEvent>;
class TrendingCompResponseTeams {
  name: string;
  icon: string;
  playedCombCount: number;
}
class TrendingCompResponse implements TrendingComb {
  teams: TrendingCompResponseTeams[];
  patches: number[];
  winsCount: number;
  lossesCount: number;
  mapsCount: number;
}
class TrendingMapResponse {
  [x: string]: TrendingCompResponse;
}
class TrendingEventResponseResult {
  [x: string]: TrendingMapResponse;
}
class TrendingResultResponse {
  [x: string]: TrendingEventResponseResult;
}

type TrendingEvent = Record<string, TrendingMap>;
type TrendingMap = Record<string, TrendingComb>;
type TrendingComb = {
  teams: {
    name: string;
    icon: string;
    playedCombCount: number;
  }[];
  patches: number[];
  winsCount: number;
  lossesCount: number;
  mapsCount: number;
};

class CompResultTeam {
  @ApiProperty({
    name: 'iconUrl',
    description: 'A url to the team logo (please check)',
    nullable: false,
    type: String,
  })
  iconUrl: string;
  @ApiProperty({
    name: 'name',
    description: 'The name of the team',
    nullable: false,
    type: String,
    example: 'LOUD',
  })
  name: string;
}
class CompResultEvent {
  @ApiProperty({
    name: 'iconUrl',
    type: String,
    nullable: true,
  })
  iconUrl: string | null;
  @ApiProperty({
    name: 'title',
    type: String,
    nullable: true,
  })
  title: string | null;
}
export class CompResult implements CombResult {
  @ApiProperty({
    name: 'agents',
    type: [String],
    maxItems: 5,
    uniqueItems: true,
    minItems: 5,
    example: ['killjoy', 'fade', 'raze', 'omen', 'phoenix'],
    nullable: false,
  })
  agents: string[];
  @ApiProperty({
    name: 'map',
    type: String,
    nullable: false,
    example: 'summit',
  })
  map: string;
  @ApiProperty({ name: 'team', nullable: false })
  team: CompResultTeam;
  @ApiProperty({
    name: 'won',
    type: Boolean,
    nullable: false,
    example: true,
  })
  won: boolean;
  @ApiProperty({
    name: 'vod',
    description: 'Url to a vod, not pre-checked!',
    nullable: true,
    type: String,
  })
  vod: string | null;
  @ApiProperty({ name: 'event', nullable: false })
  event: CompResultEvent;
  @ApiProperty({
    name: 'patch',
    type: Number,
    nullable: false,
  })
  patch: number | null;
  @ApiProperty({
    name: 'url',
    description: 'Url to the vlr page (map not selected)',
    nullable: false,
    type: String,
  })
  url: string;
}

class TrendingEventResponse {
  @ApiProperty({
    name: 'name',
    type: String,
    nullable: false,
  })
  name: string;
  @ApiProperty({
    name: 'icon',
    type: String,
    nullable: true,
  })
  icon: string | null;
  @ApiProperty({
    name: 'id',
    type: String,
    description: 'vlr id of the event',
    nullable: false,
  })
  id: string;
}
export class Trending {
  @ApiProperty({ type: TrendingResultResponse })
  result: TrendingResult;
  @ApiProperty({
    name: 'events',
    nullable: false,
    default: [],
    type: [TrendingEventResponse],
  })
  events: TrendingEventResponse[];
}

@Injectable()
export class FinderService {
  constructor(
    private readonly eventsService: EventsService,
    private readonly mapsService: MapsService,
  ) {}

  async findComb(
    eventIds: string[],
    agents: string[],
    map: string,
    winningState?: 'won' | 'lost',
    needsToHaveVod?: boolean,
    patch?: number,
    patchBehavior?: 'above' | 'on' | 'below',
  ): Promise<CombResult[]> {
    const maps = await this.mapsService.getManyWithFilters({
      hasVod: needsToHaveVod,
      patch,
      patchBehavior,
      winningState,
      map,
      agents,
      eventIds: eventIds,
    });

    const events = await this.eventsService.getManyByVlrIds(
      maps.map((map) => map.eventId),
    );
    return maps.map((map) => ({
      agents: map.agents,
      patch: map.patch,
      url: `https://vlr.gg/${map.vlrId}`,
      team: {
        iconUrl: map.teamLogoUrl,
        name: map.team,
      },
      event: {
        iconUrl:
          events.find(
            (event) => event.vlrId === map.eventId,
          )?.icon || null,
        title:
          events.find(
            (event) => event.vlrId === map.eventId,
          )?.title || null,
      },
      map: map.name,
      vod: map.vodUrl,
      won: map.won,
    }));
  }

  async getTrendingMaps(
    patch?: number,
    patchRange?: number,
  ): Promise<{
    result: TrendingResult;
    events: {
      name: string;
      icon: string | null;
      id: string;
    }[];
  }> {
    if (!patch) {
      const version = (
        await fetch(
          'https://valorant-api.com/v1/version',
        ).then((res) => res.json())
      ).data.version as string;

      patch = parseFloat(
        `${version.split('.')[0]}.${version.split('.')[1]}`,
      );
    }

    const maps =
      await this.mapsService.getManyWithPatchRange(
        patch,
        patchRange,
      );
    const events = await this.eventsService.getManyByVlrIds(
      Array.from(new Set(maps.map((map) => map.eventId))),
    );

    const result: TrendingResult = {};
    events.map((event) => {
      const eventMaps = maps.filter(
        (map) => map.eventId === event.vlrId,
      );

      const eventResult: TrendingEvent = {};

      const individualMaps = Array.from(
        new Set(
          eventMaps.map((map) => map.name.toLowerCase()),
        ),
      );
      individualMaps.map((map) => {
        const identicalMaps = eventMaps.filter(
          (m) => m.name.toLowerCase() === map,
        );

        const mapResult: TrendingMap = {};

        const individualTeamCombs = Array.from(
          new Set(
            identicalMaps.map((im) =>
              im.agents
                .map((agent) => agent.toLowerCase().trim())
                .sort()
                .join(','),
            ),
          ),
        );

        individualTeamCombs.map((comb) => {
          const gamesWithSameComb = identicalMaps.filter(
            (im) =>
              im.agents
                .map((agent) => agent.toLowerCase().trim())
                .sort()
                .join(',') === comb,
          );

          const teamCounts: Record<
            string,
            { count: number; logo: string }
          > = {};

          gamesWithSameComb.map((game) => {
            teamCounts[game.team] = {
              count:
                (teamCounts[game.team]?.count || 0) + 1,
              logo: game.teamLogoUrl,
            };
          });

          mapResult[comb] = {
            mapsCount: gamesWithSameComb.length,
            winsCount: gamesWithSameComb.filter(
              (game) => game.won,
            ).length,
            lossesCount: gamesWithSameComb.filter(
              (game) => !game.won,
            ).length,
            patches: Array.from(
              new Set(
                gamesWithSameComb
                  .filter((game) => game.patch !== null)
                  .map((game) => game.patch) as number[],
              ),
            ),
            teams: Object.entries(teamCounts).map(
              (teamCount) => ({
                name: teamCount[0],
                icon: teamCount[1].logo,
                playedCombCount: teamCount[1].count,
              }),
            ),
          };
        });

        eventResult[map] = mapResult;
      });

      result[event.vlrId] = eventResult;
    });

    return {
      events: events.map((event) => ({
        name: event.title,
        id: event.vlrId,
        icon: event.icon,
      })),
      result,
    };
  }
}
