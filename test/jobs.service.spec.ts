import { Test, TestingModule } from '@nestjs/testing';
import { JobsService } from '../src/jobs/service/jobs.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

describe('JobsService', () => {
  let service: JobsService;
  let dbFilePath: string;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        await ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
      ],
      providers: [JobsService],
    }).compile();

    service = module.get(JobsService);
    const configService = module.get(ConfigService);
    const dbRelativePath = configService.get<string>('JOBS_DB_PATH');
    dbFilePath = path.join(process.cwd(), dbRelativePath!);

    fs.writeFileSync(dbFilePath, JSON.stringify({ jobs: {} }, null, 2));
  });

  it('동시에 여러 작업을 생성해도 데이터 손실이 없어야 한다', async () => {
    const tasks = Array.from({ length: 2000 }).map((_, i) => ({
      title: 'Job-${i}',
      description: `Desc-${i}`,
    }));

    await Promise.all(tasks.map((dto) => service.create(dto)));
    await new Promise((resolve) => setTimeout(resolve, 100));

    const fileData = fs.readFileSync(dbFilePath, 'utf-8');

    type StoredJob = {
      id: string;
      title: string;
      description: string;
      status: string;
    };

    type StoredFile = {
      jobs: Record<string, StoredJob>;
    };

    const parsed = JSON.parse(fileData) as StoredFile;
    const jobsObj = parsed.jobs ?? {};

    const created = Object.values(jobsObj).filter((job) =>
      job.title.startsWith('Job-'),
    );

    expect(created.length).toBe(2000);
  });
});
