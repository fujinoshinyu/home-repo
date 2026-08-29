import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UploadedFile,
  UseInterceptors,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { DocumentUploadUseCase } from '../../application/usecases/document-upload.usecase';
import { DocumentQueryUseCase } from '../../application/usecases/document-query.usecase';

@Controller('documents')
export class DocumentController {
  constructor(
    private readonly documentUploadUseCase: DocumentUploadUseCase,
    private readonly documentQueryUseCase: DocumentQueryUseCase,
  ) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(@UploadedFile() file: Express.Multer.File) {
    return this.documentUploadUseCase.execute(file.buffer, file.originalname, file.mimetype);
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
    // TODO: DocumentUploadUseCase に delete を追加するか、別 UseCase を作成する
    return { message: `Document ${id} deleted` };
  }

  @Get(':id/chunks')
  async getChunks(@Param('id') id: string) {
    const chunks = await this.documentQueryUseCase.getChunks(id);
    return { chunks, total: chunks.length };
  }
}
