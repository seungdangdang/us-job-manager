import { Module } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { JobsController } from './jobs.controller';
import { SchedulerService } from './scheduler.service';

@Module({
  controllers: [JobsController],
  providers: [JobsService, SchedulerService],
})
export class JobsModule {}
