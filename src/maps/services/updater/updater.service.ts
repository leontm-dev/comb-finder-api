import { writeFile } from 'node:fs';
import { Injectable, Logger } from '@nestjs/common';
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

  private readonly logger = new Logger(
    'MapsUpdaterService',
  );
  constructor(
    private readonly mapsService: MapsService,
    private readonly eventsService: EventsService,
  ) {}

  async updateMapsForLast15Events() {
    this.logger.log('Started');
    try {
      await fetch(
        'https://scraper.comp-finder.leontm.me/health',
        {
          method: 'GET',
        },
      );
    } catch (error) {
      this.logger.error(error);
      this.logger.log('Health check failed!');
      return;
    }

    const events =
      await this.eventsService.getAllWithPagination(0, 15);

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
              `https://scraper.comp-finder.leontm.me/v2/events/matches?event_id=${event.vlrId}`,
              {
                method: 'GET',
              },
            )
              .then((res) => res.json())
              .catch((err) => {
                this.logger.error(
                  `Fetch failed for event: ${event.vlrId}`,
                  err,
                );
              }),
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
                  `https://scraper.comp-finder.leontm.me/v2/match/details?match_id=${matchId}`,
                  { method: 'GET' },
                )
                  .then((res) => {
                    if (!res.ok) {
                      this.logger.log(
                        res.status,
                        res.statusText,
                        res.ok,
                        res.headers,
                      );
                      return null;
                    }

                    return res.json();
                  })
                  .catch((err) => {
                    this.logger.error(
                      `Match details fetch for ${matchId} failed`,
                      err,
                    );
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
                  name: map.map_name
                    .toLowerCase()
                    .replace('pick', '') as TMaps,
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
                  patch: isNaN(
                    parseInt(
                      String(
                        response.data.segments[0].date.split(
                          'Patch',
                        )[1],
                      ).trim(),
                    ),
                  )
                    ? null
                    : parseInt(
                        String(
                          response.data.segments[0].date.split(
                            'Patch',
                          )[1],
                        ).trim(),
                      ),
                  customId: `${response.data.segments[0].teams[0].name}_${matchId}_${map.map_name.replace('PICK', '')}`,
                });
                toBeCreated.push({
                  name: map.map_name
                    .toLowerCase()
                    .replace('pick', '') as TMaps,
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
                  patch: isNaN(
                    parseInt(
                      String(
                        response.data.segments[0].date.split(
                          'Patch',
                        )[1],
                      ).trim(),
                    ),
                  )
                    ? null
                    : parseInt(
                        String(
                          response.data.segments[0].date.split(
                            'Patch',
                          )[1],
                        ).trim(),
                      ),
                  customId: `${response.data.segments[0].teams[1].name}_${matchId}_${map.map_name.replace('PICK', '')}`,
                });
              },
            );
          }),
        );

        const chunkArray = <T>(
          array: T[],
          size: number,
        ): T[][] => {
          const chunks: T[][] = [];
          for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
          }
          return chunks;
        };
        const chunks = chunkArray(toBeCreated, 200);
        let mapsCreatedCount = 0;

        for (const chunk of chunks) {
          try {
            const result =
              await this.mapsService.createBulk(chunk);
            mapsCreatedCount += result.length;
          } catch (error) {
            failedIds.push(
              ...chunk.map((c) => c.customId || ''),
            );
            console.log(error);
          }
        }

        const dataObject: {
          eventId: string;
          mapsCreated: number;
          totalNumberOfGames: number;
          totalNumberOfMaps: number;
          failedCount: number;
          failedIds: string[];
        } = {
          eventId: event.vlrId,
          mapsCreated: mapsCreatedCount,
          totalNumberOfGames:
            eventMaps.data.segments.length,
          totalNumberOfMaps: toBeCreated.length,
          failedCount: failed,
          failedIds,
        };
        this.logger.log(event.title, dataObject);
        data[event.title] = dataObject;
      }),
    );

    // writeFile(
    //   'results.json',
    //   JSON.stringify(data),
    //   (err) => {
    //     if (err) {
    //       console.error(err);
    //     }
    //   },
    // );
    this.logger.log('Ended');
  }

  async updateMapsForAllEvents() {
    this.logger.log('Started');
    try {
      await fetch(
        'https://scraper.comp-finder.leontm.me/health',
        {
          method: 'GET',
        },
      );
    } catch (error) {
      this.logger.error(error);
      this.logger.log('Health check failed!');
      return;
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

    // ÄNDERUNG: 'for...of' statt 'Promise.all(events.map(...))' für sequentielle Verarbeitung
    for (const event of events) {
      console.log(event.title);
      const eventMaps = (await this.reqLimiter.schedule(
        () =>
          fetch(
            `https://scraper.comp-finder.leontm.me/v2/events/matches?event_id=${event.vlrId}`,
            {
              method: 'GET',
            },
          ).then((res) => res.json()),
      )) as EventMapsResponse;
      console.log(
        'Games found',
        eventMaps.data.segments.length,
      );

      const matchIds = eventMaps.data.segments
        .filter((segment) => segment.status === 'Completed')
        .map((segment) => segment.match_id);

      console.log('Completed games left', matchIds.length);

      const toBeCreated: Partial<VlrMap>[] = [];
      let failed = 0;
      const failedIds: string[] = [];

      // Hinweis: Die Matches innerhalb EINES Events werden hier weiterhin parallel geladen.
      // Wenn auch die Matches strikt nacheinander geladen werden sollen,
      // ersetze auch dieses Promise.all durch ein 'for (const matchId of matchIds)'
      await Promise.all(
        matchIds.map(async (matchId, index) => {
          const response = (await this.reqLimiter.schedule(
            () =>
              fetch(
                `https://scraper.comp-finder.leontm.me/v2/match/details?match_id=${matchId}`,
                { method: 'GET' },
              ).then((res) => {
                if (!res.ok) {
                  this.logger.log(
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

          console.log(
            'Checked game #',
            index + 1,
            'Failed',
            failed,
          );

          response.data.segments[0].maps.map(
            (map, index) => {
              toBeCreated.push({
                name: map.map_name
                  .toLowerCase()
                  .replace('pick', '') as TMaps,
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
                  response.data.segments[0].vods[index + 1]
                    ?.url || null,
                patch: isNaN(
                  parseInt(
                    String(
                      response.data.segments[0].date.split(
                        'Patch',
                      )[1],
                    ).trim(),
                  ),
                )
                  ? null
                  : parseInt(
                      String(
                        response.data.segments[0].date.split(
                          'Patch',
                        )[1],
                      ).trim(),
                    ),
                customId: `${response.data.segments[0].teams[0].name}_${matchId}_${map.map_name.replace('PICK', '')}`,
              });
              toBeCreated.push({
                name: map.map_name
                  .toLowerCase()
                  .replace('pick', '') as TMaps,
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
                  response.data.segments[0].vods[index + 1]
                    ?.url || null,
                patch: isNaN(
                  parseInt(
                    String(
                      response.data.segments[0].date.split(
                        'Patch',
                      )[1],
                    ).trim(),
                  ),
                )
                  ? null
                  : parseInt(
                      String(
                        response.data.segments[0].date.split(
                          'Patch',
                        )[1],
                      ).trim(),
                    ),
                customId: `${response.data.segments[0].teams[1].name}_${matchId}_${map.map_name.replace('PICK', '')}`,
              });
            },
          );
        }),
      );

      console.log(
        'Matches ready to be created',
        toBeCreated.length,
      );

      // Erst wenn alle Maps für dieses Event gesammelt wurden, wird Bulk-Create ausgeführt
      const chunkArray = <T>(
        array: T[],
        size: number,
      ): T[][] => {
        const chunks: T[][] = [];
        for (let i = 0; i < array.length; i += size) {
          chunks.push(array.slice(i, i + size));
        }
        return chunks;
      };
      const chunks = chunkArray(toBeCreated, 200);
      let mapsCreatedCount = 0;

      for (const chunk of chunks) {
        try {
          const result =
            await this.mapsService.createBulk(chunk);
          mapsCreatedCount += result.length;
        } catch (error) {
          failedIds.push(
            ...chunk.map((c) => c.customId || ''),
          );
          console.log(error);
        }
      }

      const dataObject: {
        eventId: string;
        mapsCreated: number;
        totalNumberOfGames: number;
        totalNumberOfMaps: number;
        failedCount: number;
        failedIds: string[];
      } = {
        eventId: event.vlrId,
        mapsCreated: mapsCreatedCount,
        totalNumberOfGames: eventMaps.data.segments.length,
        totalNumberOfMaps: toBeCreated.length,
        failedCount: failed,
        failedIds,
      };
      console.log(event.title, dataObject);
      data[event.title] = dataObject;
    } // Ende der for...of Schleife

    writeFile(
      'results.json',
      JSON.stringify(data),
      (err) => {
        if (err) {
          console.error(err);
        }
      },
    );
    this.logger.log('Ended');
  }
}
