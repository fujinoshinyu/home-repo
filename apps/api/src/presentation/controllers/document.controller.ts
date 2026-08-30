import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UploadedFile,
  UseInterceptors,
  Res,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { DocumentUploadUseCase } from '../../application/usecases/document-upload.usecase';
import { DocumentQueryUseCase } from '../../application/usecases/document-query.usecase';
import { UploadJobService } from '../../application/services/upload-job.service';

@Controller('documents')
export class DocumentController {
  constructor(
    private readonly documentUploadUseCase: DocumentUploadUseCase,
    private readonly documentQueryUseCase: DocumentQueryUseCase,
    private readonly uploadJobService: UploadJobService,
  ) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(@UploadedFile() file: Express.Multer.File) {
    const jobId = this.documentUploadUseCase.createJob(file.buffer, file.originalname, file.mimetype);
    return { jobId };
  }

  @Get('jobs/:id')
  async getJobStatus(@Param('id') id: string) {
    const job = this.uploadJobService.get(id);
    if (!job) {
      throw new NotFoundException(`Job not found: ${id}`);
    }
    return {
      id: job.id,
      status: job.status,
      totalChunks: job.totalChunks,
      completedChunks: job.completedChunks,
      document: job.document,
      error: job.error,
    };
  }

  @Get()
  async list() {
    const documents = await this.documentQueryUseCase.list();
    return { documents, total: documents.length };
  }

  @Get(':id')
  async getById(@Param('id') id: string, @Res() res: Response) {
    const doc = await this.documentQueryUseCase.getById(id);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${doc.filename}"`);
    res.send(doc);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return { message: `Document ${id} deleted` };
  }

  @Get(':id/chunks')
  async getChunks(@Param('id') id: string) {
    const chunks = await this.documentQueryUseCase.getChunks(id);
    return { chunks, total: chunks.length };
  }
}
