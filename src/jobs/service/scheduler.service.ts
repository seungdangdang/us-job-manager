import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class SchedulerService implements OnModuleInit {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private readonly jobsService: JobsService,
    private readonly configService: ConfigService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {}

  onModuleInit() {
    const cronExpr = this.configService.get<string>('JOB_CRON_EXPRESSION');

    if (!cronExpr) {
      throw new Error('환경 변수 JOB_CRON_EXPRESSION이 설정되지 않았습니다.');
    }

    const job = new CronJob(cronExpr, async () => {
      await this.runScheduledTask();
    });

    this.schedulerRegistry.addCronJob('completePendingJobs', job);
    job.start();
  }

  private async runScheduledTask() {
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
