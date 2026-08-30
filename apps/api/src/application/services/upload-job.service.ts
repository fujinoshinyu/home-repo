import { Injectable } from '@nestjs/common';
import { Document } from '../../domain/entities';

export type UploadJobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface UploadJob {
  id: string;
  status: UploadJobStatus;
  totalChunks: number;
  completedChunks: number;
  document: Document | null;
  error: string | null;
}

@Injectable()
export class UploadJobService {
  private readonly jobs = new Map<string, UploadJob>();

  create(jobId: string, totalChunks: number): UploadJob {
    const job: UploadJob = {
      id: jobId,
      status: 'pending',
      totalChunks,
      completedChunks: 0,
      document: null,
      error: null,
    };
    this.jobs.set(jobId, job);
    return job;
  }

  get(jobId: string): UploadJob | null {
    return this.jobs.get(jobId) ?? null;
  }

  markProcessing(jobId: string, totalChunks: number): void {
    const job = this.jobs.get(jobId);
    if (job) {
      job.status = 'processing';
      job.totalChunks = totalChunks;
    }
  }

  incrementProgress(jobId: string): void {
    const job = this.jobs.get(jobId);
    if (job) job.completedChunks++;
  }

  markCompleted(jobId: string, document: Document): void {
    const job = this.jobs.get(jobId);
    if (job) {
      job.status = 'completed';
      job.document = document;
    }
  }

  markFailed(jobId: string, error: string): void {
    const job = this.jobs.get(jobId);
    if (job) {
      job.status = 'failed';
      job.error = error;
    }
  }
}
