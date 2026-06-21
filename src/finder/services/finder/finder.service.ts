import { Injectable } from '@nestjs/common';
import { EventsService } from 'src/events/services/events/events.service';
import { MapsService } from 'src/maps/services/maps/maps.service';

type CombResult = {
  agents: string[];
  map: string;
  team: {
    iconUrl: string;
    name: string;
  };
  vod: string | null;
  event: {
    iconUrl: string | null;
    title: string | null;
  };
  patch: number | null;
  url: string;
};
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
    if (!eventIds || eventIds.length === 0) return [];

    const events =
      await this.eventsService.getManyByVlrIds(eventIds);
    if (!events || events.length === 0) return [];

    const maps = await this.mapsService.getManyWithFilters({
      hasVod: needsToHaveVod,
      patch,
      patchBehavior,
      winningState,
      map,
      agents,
      eventIds: events.map((event) => event.vlrId),
    });

    console.log(maps);
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
    }));
  }
}
