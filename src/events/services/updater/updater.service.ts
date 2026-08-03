import { Injectable, Logger } from '@nestjs/common';

import { EventsService } from '../events/events.service';

type VlrEventSegment = {
  id: string;
  name: string;
  status: string;
  prizepool: string;
  dates: string;
  country: string;
  img: string;
};

@Injectable()
export class UpdaterService {
  private readonly logger = new Logger(UpdaterService.name);
  constructor(
    private readonly eventsService: EventsService,
  ) {}

  async updateLastEvents() {
    this.logger.log('updateLastEvents job started!');
    const events = await fetch(
      `https://vlr.orlandomm.net/api/v1/events?tier=vct&page=1`,
      {
        method: 'GET',
        headers: {
          'user-agent':
            'comp-finder api by leontm (github: leontm-dev)',
        },
      },
    );
    this.logger.log(
      events.ok ? 'Response ok' : 'Response not ok',
    );

    const eventsData = (await events.json()) as {
      status: string;
      data: VlrEventSegment[];
    };

    this.logger.log(
      `EventsData length: ${eventsData.data.length}`,
    );

    const alreadySavedEvents =
      await this.eventsService.getManyByVlrIds(
        eventsData.data.map((e) => e.id),
      );
    this.logger.log(
      `AlreadySavedEvents length: ${alreadySavedEvents.length}`,
    );
    const createEvents: VlrEventSegment[] = [];
    eventsData.data.map((event) => {
      if (
        alreadySavedEvents.find((e) => e.vlrId === event.id)
      )
        return;

      createEvents.push(event);
    });

    const result = await this.eventsService.createBulk(
      createEvents.map((event) => ({
        dates: event.dates,
        vlrId: event.id,
        title: event.name,
        region: event.country,
        icon: event.img,
      })),
    );

    this.logger.log(`Ended with results: ${result.length}`);
  }

  async updateAllEvents() {
    for (let i = 1; i < 8; i++) {
      const events = await fetch(
        `https://vlr.orlandomm.net/api/v1/events?tier=vct&page=${i}`,
        {
          method: 'GET',
          headers: {
            'user-agent': 'testing',
          },
        },
      );

      const eventsData = (await events.json()) as {
        status: string;
        data: VlrEventSegment[];
      };

      await this.eventsService.createBulk(
        (eventsData.data ?? []).map((event) => ({
          dates: event.dates,
          vlrId: event.id,
          title: event.name,
          region: event.country,
          icon: event.img,
        })),
      );
    }
  }
}
