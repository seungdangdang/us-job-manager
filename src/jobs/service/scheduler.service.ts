import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { JobsService } from './jobs.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(private readonly jobsService: JobsService) {}

  @Cron('*/60 * * * * *') // 매 60초마다
  async handleCron() {
    const updatedJobs = await this.jobsService.completePendingJobs();

    if (updatedJobs.length > 0) {
      const timestamp = new Date().toISOString();
      const messages = updatedJobs.map(
        (job) => `[${timestamp}] Job ${job.id} marked as completed.`,
      );

      // 콘솔 출력
      messages.forEach((msg) => this.logger.log(msg));

      // logs.txt 기록
      const logPath = path.join(process.cwd(), 'src', 'logs', 'logs.txt');
      fs.appendFileSync(logPath, messages.join('\n') + '\n');
    }
  }
}
