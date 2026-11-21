import {
    Controller,
    Post,
    UploadedFile,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { DocumentsService } from './documents.service.js';
import type { UploadedPdf } from './uploaded-pdf.interface.js';
import { Body } from '@nestjs/common';


@Controller('documents')
export class DocumentsController {
    constructor(private documentsService: DocumentsService) {}

    @Post('upload')
    @UseInterceptors(
        FileInterceptor('file', {
            storage: memoryStorage(),
            limits: { fileSize: 10 * 1024 * 1024 },
        }),
    )
    upload(@UploadedFile() file: UploadedPdf) {
        return this.documentsService.uploadFile(file);
    }

    @Post('ask')
    ask(@Body('question') question: string) {
        return this.documentsService.askQuestion(question);
    }
}