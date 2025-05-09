import { Injectable, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { JsonDB, Config } from 'node-json-db';
import { CreateJobDto } from '../dto/create-job.dto';
import { Job } from '../entities/job.entity';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';

@Injectable()
export class JobsService {
  private db: JsonDB;

  constructor(private readonly configService: ConfigService) {
    const dbFile = this.configService.get<string>('JOBS_DB_PATH');
    if (!dbFile) {
      throw new Error('JOBS_DB_PATH 환경변수가 설정되지 않았습니다.');
    }

    const dbPath = path.join(process.cwd(), dbFile);
    this.db = new JsonDB(new Config(dbPath, true, true, '/'));
  }

  /**
   * 새로운 작업 생성
   */
  async create(createJobDto: CreateJobDto): Promise<Job> {
    const { title, description } = createJobDto;
    const id = uuidv4();
    const newJob: Job = { id, title, description, status: 'pending' };

    await this.enqueueWrite(async () => {
      await Promise.resolve(this.db.push(`/jobs/${id}`, newJob));
    });

    return newJob;
  }

  /**
   * 모든 작업 목록 조회
   */
  async findAll(): Promise<Job[]> {
    try {
      const jobsObj = (await this.db.getData('/jobs')) as Record<string, Job>;
      return Object.values(jobsObj);
    } catch {
      return [];
    }
  }

  /**
   * ID로 작업 조회
   */
  async findOne(id: string): Promise<Job> {
    try {
      return (await this.db.getData(`/jobs/${id}`)) as Job;
    } catch {
      throw new NotFoundException(`ID ${id}에 해당하는 작업이 없습니다.`);
    }
  }

  /**
   * 작업 검색 (status / title)
   */
  async search(title?: string, status?: string): Promise<Job[]> {
    const allJobs = await this.findAll();
    return allJobs.filter((job) => {
      const matchesTitle = title ? job.title.includes(title) : true;
      const matchesStatus = status ? job.status === status : true;
      return matchesTitle && matchesStatus;
    });
  }

  /**
   * 상태 일괄 업데이트 (pending → completed)
   */
  async completePendingJobs(): Promise<Job[]> {
    const jobsObj = (await this.db.getData('/jobs')) as Record<string, Job>;
    const updatedJobs: Job[] = [];

    for (const [id, job] of Object.entries(jobsObj)) {
      if (job.status === 'pending') {
        const updatedJob: Job = { ...job, status: 'completed' };

        await this.enqueueWrite(async () => {
          await Promise.resolve(this.db.push(`/jobs/${id}`, updatedJob, true));
        });

        updatedJobs.push(updatedJob);
      }
    }

    return updatedJobs;
  }

  private writeQueue: (() => Promise<void>)[] = [];
  private isWriting = false;

  private async enqueueWrite(task: () => Promise<void>): Promise<void> {
    return new Promise((resolve, reject) => {
      this.writeQueue.push(async () => {
        try {
          await task();
          resolve();
        } catch (e) {
          reject(e instanceof Error ? e : new Error(String(e)));
        }
      });

      if (!this.isWriting) {
        void this.processQueue();
      }
    });
  }

  private async processQueue() {
    this.isWriting = true;

    try {
      while (this.writeQueue.length > 0) {
        const task = this.writeQueue.shift();
        if (task) {
          try {
            await task();
          } catch (e) {
            console.error('작업 실행 중 에러:', e);
          }
        }
      }
    } finally {
      this.isWriting = false;
    }
  }
}
