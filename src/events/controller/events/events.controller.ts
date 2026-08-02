import { Controller, Get } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { EventsService } from 'src/events/services/events/events.service';

@ApiExcludeController()
@Controller('events')
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
  ) {}

  @Get('')
  async getEvents() {
    return await this.eventsService.getAll();
  }
}
