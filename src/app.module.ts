import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';

import { EventsModule } from './events/events.module';
import { ExceptionsFilter } from './filters/exception/exception.filter';
import { FinderModule } from './finder/finder.module';
import { ResponseInterceptor } from './interceptors/response/response.interceptor';
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
  providers: [
    { provide: APP_FILTER, useClass: ExceptionsFilter },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
  ],
})
export class AppModule {}
