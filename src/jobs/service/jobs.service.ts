import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { JsonDB, Config } from 'node-json-db';
import { CreateJobDto } from '../dto/create-job.dto';
import { Job } from '../entities/job.entity';
import * as path from 'path';

@Injectable()
export class JobsService {
  private db: JsonDB;

  constructor() {
    const dbPath = path.join(process.cwd(), 'src', 'db', 'jobs');
    this.db = new JsonDB(new Config(dbPath, true, true, '/'));
  }

  /**
   * 새로운 작업 생성
   */
  create(createJobDto: CreateJobDto): Job {
    const { title, description } = createJobDto;

    const id = uuidv4();
    const newJob: Job = { id, title, description, status: 'pending' };

    this.db.push(`/jobs/${id}`, newJob);
    return newJob;
  }

  /**
   * 모든 작업 목록 조회
   */
  async findAll(): Promise<Job[]> {
    try {
      const jobsObj = (await this.db.getData('/jobs')) as Promise<Job[]>;
      return Object.values(jobsObj) as Job[];
    } catch (e) {
      return [];
    }
  }

  /**
   * ID로 작업 조회
   */
  async findOne(id: string): Promise<Job> {
    try {
      return (await this.db.getData(`/jobs/${id}`)) as Promise<Job>;
    } catch (e) {
      throw new NotFoundException(`ID ${id}에 해당하는 작업이 없습니다.`);
    }
  }

  /**
   * status / title 으로 작업을 검색한다.
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
   * 상태를 일괄 업데이트 (pending → completed)
   */
  async completePendingJobs(): Promise<Job[]> {
    const jobsObj = (await this.db.getData('/jobs')) as Record<string, Job>;
    const updatedJobs: Job[] = [];

    for (const [id, job] of Object.entries(jobsObj)) {
      if (job.status === 'pending') {
        const updatedJob: Job = {
          ...job,
          status: 'completed',
        };
        this.db.push(`/jobs/${id}`, updatedJob, true);
        updatedJobs.push(updatedJob);
      }
    }

    return updatedJobs;
  }
}
