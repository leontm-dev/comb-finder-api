import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventsModule } from 'src/events/events.module';

import { VlrMap, VlrMapSchema } from './schemas/map.schema';
import { MapsService } from './services/maps/maps.service';
import { UpdaterService } from './services/updater/updater.service';

@Module({
  imports: [
    EventsModule,
    MongooseModule.forFeature([
      { name: VlrMap.name, schema: VlrMapSchema },
    ]),
  ],
  providers: [UpdaterService, MapsService],
  exports: [MapsService],
})
export class MapsModule {}
