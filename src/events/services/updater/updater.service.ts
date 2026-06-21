import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

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
  constructor(
    private readonly eventsService: EventsService,
  ) {}

  @Cron('0 30 0 * * *')
  async updateLastEvents() {
    const events = await fetch(
      `https://vlr.orlandomm.net/api/v1/events?tier=vct&page=1`,
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

    const alreadySavedEvents =
      await this.eventsService.getAll();
    const createEvents: VlrEventSegment[] = [];
    eventsData.data.map((event) => {
      if (
        alreadySavedEvents.find((e) => e.vlrId === event.id)
      )
        return;

      createEvents.push(event);
    });

    await this.eventsService.createBulk(
      createEvents.map((event) => ({
        dates: event.dates,
        vlrId: event.id,
        title: event.name,
        region: event.country,
        icon: event.img,
      })),
    );
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
