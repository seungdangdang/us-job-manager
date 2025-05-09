import { Module } from '@nestjs/common';
import { JobsService } from './service/jobs.service';
import { JobsController } from './controller/jobs.controller';
import { SchedulerService } from './service/scheduler.service';

@Module({
  controllers: [JobsController],
  providers: [JobsService, SchedulerService],
})
export class JobsModule {}
