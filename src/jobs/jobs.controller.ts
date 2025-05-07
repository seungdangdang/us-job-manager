import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';
import { Job } from './entities/job.entity';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  /**
   * 새로운 작업을 생성한다.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createJobDto: CreateJobDto): Job {
    return this.jobsService.create(createJobDto);
  }

  /**
   * 모든 작업 목록을 조회한다.
   */
  @Get()
  async findAll(): Promise<Job[]> {
    return await this.jobsService.findAll();
  }

  /**
   * status / title 으로 작업을 검색한다.
   */
  @Get('search')
  async search(
    @Query('title') title?: string,
    @Query('status') status?: string,
  ): Promise<Job[]> {
    return await this.jobsService.search(title, status);
  }

  /**
   * 특정 작업의 상세 정보를 조회한다.
   */
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Job> {
    return await this.jobsService.findOne(id);
  }
}
