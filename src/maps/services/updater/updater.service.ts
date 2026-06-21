import { writeFile } from 'fs';
import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import Bottleneck from 'bottleneck';
import { EventsService } from 'src/events/services/events/events.service';
import type { VlrMap } from 'src/maps/schemas/map.schema';
import type { TMaps } from 'src/types/maps.types';

import { MapsService } from '../maps/maps.service';

type EventMapsResponse = {
  status: string;
  data: {
    status: number;
    segments: {
      match_id: string;
      status: 'Completed' | 'Upcoming';
    }[];
  };
};
type MapTeamResponse = {
  agent: string;
  name: string;
};
type MapResponse = {
  status: string;
  data: {
    status: number;
    segments: {
      match_id: string;
      date: string;
      teams: {
        name: string;
        is_winner: boolean;
        logo: string;
      }[];
      vods: { name: string; url: string }[];
      maps: {
        map_name: string;
        players: {
          team1: MapTeamResponse[];
          team2: MapTeamResponse[];
        };
      }[];
    }[];
  };
};
@Injectable()
export class UpdaterService {
  private readonly reqLimiter = new Bottleneck({
    minTime: 3050,
    maxConcurrent: 1, // Stellt sicher, dass nicht zwei Requests exakt zeitgleich loslaufen
  });
  constructor(
    private readonly mapsService: MapsService,
    private readonly eventsService: EventsService,
  ) {}

  // @Cron("0 0 1 * * *")
  async updateMapsForLast10Events() {
    try {
      await fetch(
        'https://vlrgg-scraping-api.onrender.com//health',
        {
          method: 'GET',
        },
      );
    } catch (error) {
      console.error(error);
      return console.log('Health check failed!');
    }
    const events =
      await this.eventsService.getAllWithPagination(10, 0);

    const data: Record<
      string,
      {
        eventId: string;
        mapsCreated: number;
        totalNumberOfGames: number;
        totalNumberOfMaps: number;
        failedCount: number;
        failedIds: string[];
      }
    > = {};
    await Promise.all(
      events.map(async (event) => {
        const eventMaps = (await this.reqLimiter.schedule(
          () =>
            fetch(
              `https://vlrgg-scraping-api.onrender.com/v2/events/matches?event_id=${event.vlrId}`,
              {
                method: 'GET',
              },
            ).then((res) => res.json()),
        )) as EventMapsResponse;

        // const alreadySavedEventMaps = maps.filter(
        //   (map) => map.eventId === event.vlrId,
        // );
        const matchIds = eventMaps.data.segments
          .filter(
            (segment) => segment.status === 'Completed',
          )
          .map((segment) => segment.match_id);

        const toBeCreated: Partial<VlrMap>[] = [];
        let failed = 0;
        const failedIds: string[] = [];
        await Promise.all(
          matchIds.map(async (matchId) => {
            const response =
              (await this.reqLimiter.schedule(() =>
                fetch(
                  `https://vlrgg-scraping-api.onrender.com/v2/match/details?match_id=${matchId}`,
                  { method: 'GET' },
                ).then((res) => {
                  if (!res.ok) {
                    console.log(
                      res.status,
                      res.statusText,
                      res.ok,
                      res.headers,
                    );
                    return null;
                  }

                  return res.json();
                }),
              )) as MapResponse | null;

            if (!response || !response.data.segments[0]) {
              failed++;
              failedIds.push(matchId);
              return;
            }

            response.data.segments[0].maps.map(
              (map, index) => {
                toBeCreated.push({
                  name: map.map_name.toLowerCase() as TMaps,
                  agents: map.players.team1.map(
                    (team) => team.agent,
                  ),
                  vlrId: matchId,
                  eventId: event.vlrId,
                  team: response.data.segments[0].teams[0]
                    .name,
                  teamLogoUrl:
                    response.data.segments[0].teams[0].logo,
                  won: response.data.segments[0].teams[0]
                    .is_winner,
                  vodUrl:
                    response.data.segments[0].vods[
                      index + 1
                    ]?.url || null,
                  patch: parseFloat(
                    response.data.segments[0].date
                      .split('Patch')[1]
                      .trim(),
                  ),
                  customId: `${response.data.segments[0].teams[0].name}_${matchId}_${map.map_name}`,
                });
                toBeCreated.push({
                  name: map.map_name.toLowerCase() as TMaps,
                  agents: map.players.team2
                    .map((team) => team.agent)
                    .map((agent) =>
                      agent.toLowerCase().trim(),
                    ),
                  vlrId: matchId,
                  eventId: event.vlrId,
                  team: response.data.segments[0].teams[1]
                    .name,
                  teamLogoUrl:
                    response.data.segments[0].teams[1].logo,
                  won: response.data.segments[0].teams[1]
                    .is_winner,
                  vodUrl:
                    response.data.segments[0].vods[
                      index + 1
                    ]?.url || null,
                  patch: parseInt(
                    response.data.segments[0].date
                      .split('Patch')[1]
                      .trim(),
                  ),
                  customId: `${response.data.segments[0].teams[1].name}_${matchId}_${map.map_name}`,
                });
              },
            );
          }),
        );

        const result =
          await this.mapsService.createBulk(toBeCreated);

        const dataObject: {
          eventId: string;
          mapsCreated: number;
          totalNumberOfGames: number;
          totalNumberOfMaps: number;
          failedCount: number;
          failedIds: string[];
        } = {
          eventId: event.vlrId,
          mapsCreated: result.length,
          totalNumberOfGames:
            eventMaps.data.segments.length,
          totalNumberOfMaps: toBeCreated.length,
          failedCount: failed,
          failedIds,
        };
        console.log(event.title, dataObject);
        data[event.title] = dataObject;
      }),
    );

    console.log('Ended');
  }

  @Cron('0 50 10 * * *')
  async updateMapsForAllEvents() {
    try {
      await fetch(
        'https://vlrgg-scraping-api.onrender.com//health',
        {
          method: 'GET',
        },
      );
    } catch (error) {
      console.error(error);
      return console.log('Health check failed!');
    }
    const events = await this.eventsService.getAll();

    const data: Record<
      string,
      {
        eventId: string;
        mapsCreated: number;
        totalNumberOfGames: number;
        totalNumberOfMaps: number;
        failedCount: number;
        failedIds: string[];
      }
    > = {};
    await Promise.all(
      events.map(async (event) => {
        const eventMaps = (await this.reqLimiter.schedule(
          () =>
            fetch(
              `https://vlrgg-scraping-api.onrender.com/v2/events/matches?event_id=${event.vlrId}`,
              {
                method: 'GET',
              },
            ).then((res) => res.json()),
        )) as EventMapsResponse;

        // const alreadySavedEventMaps = maps.filter(
        //   (map) => map.eventId === event.vlrId,
        // );
        const matchIds = eventMaps.data.segments
          .filter(
            (segment) => segment.status === 'Completed',
          )
          .map((segment) => segment.match_id);

        const toBeCreated: Partial<VlrMap>[] = [];
        let failed = 0;
        const failedIds: string[] = [];
        await Promise.all(
          matchIds.map(async (matchId) => {
            const response =
              (await this.reqLimiter.schedule(() =>
                fetch(
                  `https://vlrgg-scraping-api.onrender.com/v2/match/details?match_id=${matchId}`,
                  { method: 'GET' },
                ).then((res) => {
                  if (!res.ok) {
                    console.log(
                      res.status,
                      res.statusText,
                      res.ok,
                      res.headers,
                    );
                    return null;
                  }

                  return res.json();
                }),
              )) as MapResponse | null;

            if (!response || !response.data.segments[0]) {
              failed++;
              failedIds.push(matchId);
              return;
            }

            response.data.segments[0].maps.map(
              (map, index) => {
                toBeCreated.push({
                  name: map.map_name.toLowerCase() as TMaps,
                  agents: map.players.team1.map(
                    (team) => team.agent,
                  ),
                  vlrId: matchId,
                  eventId: event.vlrId,
                  team: response.data.segments[0].teams[0]
                    .name,
                  teamLogoUrl:
                    response.data.segments[0].teams[0].logo,
                  won: response.data.segments[0].teams[0]
                    .is_winner,
                  vodUrl:
                    response.data.segments[0].vods[
                      index + 1
                    ]?.url || null,
                  patch: parseFloat(
                    response.data.segments[0].date
                      .split('Patch')[1]
                      .trim(),
                  ),
                  customId: `${response.data.segments[0].teams[0].name}_${matchId}_${map.map_name}`,
                });
                toBeCreated.push({
                  name: map.map_name.toLowerCase() as TMaps,
                  agents: map.players.team2
                    .map((team) => team.agent)
                    .map((agent) =>
                      agent.toLowerCase().trim(),
                    ),
                  vlrId: matchId,
                  eventId: event.vlrId,
                  team: response.data.segments[0].teams[1]
                    .name,
                  teamLogoUrl:
                    response.data.segments[0].teams[1].logo,
                  won: response.data.segments[0].teams[1]
                    .is_winner,
                  vodUrl:
                    response.data.segments[0].vods[
                      index + 1
                    ]?.url || null,
                  patch: parseInt(
                    response.data.segments[0].date
                      .split('Patch')[1]
                      .trim(),
                  ),
                  customId: `${response.data.segments[0].teams[1].name}_${matchId}_${map.map_name}`,
                });
              },
            );
          }),
        );

        const result =
          await this.mapsService.createBulk(toBeCreated);

        const dataObject: {
          eventId: string;
          mapsCreated: number;
          totalNumberOfGames: number;
          totalNumberOfMaps: number;
          failedCount: number;
          failedIds: string[];
        } = {
          eventId: event.vlrId,
          mapsCreated: result.length,
          totalNumberOfGames:
            eventMaps.data.segments.length,
          totalNumberOfMaps: toBeCreated.length,
          failedCount: failed,
          failedIds,
        };
        console.log(event.title, dataObject);
        data[event.title] = dataObject;
      }),
    );

    writeFile(
      'results.json',
      JSON.stringify(data),
      (err) => {
        if (err) {
          console.error(err);
        }
      },
    );
    console.log('Ended');
  }
}
