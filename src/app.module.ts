import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';

import { EventsModule } from './events/events.module';
import { FinderModule } from './finder/finder.module';
import { MapsModule } from './maps/maps.module';
import { ProposalsModule } from './proposals/proposals.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      cache: true,
    }),
    ScheduleModule.forRoot(),
    MongooseModule.forRoot(process.env.DATABASE_URL!),
    EventsModule,
    ProposalsModule,
    FinderModule,
    MapsModule,
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000,
          limit: 30,
        },
      ],
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
