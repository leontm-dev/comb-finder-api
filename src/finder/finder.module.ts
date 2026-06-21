import { Module } from '@nestjs/common';
import { EventsModule } from 'src/events/events.module';
import { MapsModule } from 'src/maps/maps.module';

import { FinderController } from './controller/finder/finder.controller';
import { FinderService } from './services/finder/finder.service';

@Module({
  imports: [EventsModule, MapsModule],
  providers: [FinderService],
  controllers: [FinderController],
})
export class FinderModule {}
