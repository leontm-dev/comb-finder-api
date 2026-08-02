import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventsController } from './controller/events/events.controller';
import { VlrEvent, VlrEventSchema } from './schemas/event.schema';
import { EventsService } from './services/events/events.service';
import { UpdaterService } from './services/updater/updater.service';
import { UpdaterController } from './controller/updater/updater.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { schema: VlrEventSchema, name: VlrEvent.name },
    ]),
  ],
  providers: [UpdaterService, EventsService],
  controllers: [EventsController, UpdaterController],
  exports: [EventsService],
})
export class EventsModule {}
