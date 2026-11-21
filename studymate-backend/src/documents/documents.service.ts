
import {
    Injectable,
    Inject,
    BadRequestException, forwardRef,
} from '@nestjs/common';
import { Pool } from 'pg';
import { randomUUID } from 'crypto';
import pdf from 'pdf-parse';
import { EmbeddingService } from '../ai/embedding.service.js';
import { splitIntoChunks } from './chunking.js';
import { UploadedPdf } from './uploaded-pdf.interface.js';
import { AiService } from '../ai/ai.service.js';

@Injectable()
export class DocumentsService {
    constructor(
        @Inject('PG_POOL') private pool: Pool,
        private embeddingService: EmbeddingService,
        @Inject(forwardRef(() => AiService))
        private aiService: AiService,

    ) {}

    async uploadFile(file: UploadedPdf) {
        if (!file || file.mimetype !== 'application/pdf') {
            throw new BadRequestException('Only PDF files are supported');
        }

        const parsed = await pdf(file.buffer);
        const text = parsed.text.trim();

        if (!text) {
            throw new BadRequestException('No readable text found in PDF');
        }

        const documentId = randomUUID();

        await this.pool.query(
            `INSERT INTO documents (id, filename)
       VALUES ($1, $2)`,
            [documentId, file.originalname],
        );

        const chunks = splitIntoChunks(text);

        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];

            const embedding =
                await this.embeddingService.generateEmbedding(chunk);

            await this.pool.query(
                `INSERT INTO document_chunks
         (id, document_id, content, chunk_index, embedding)
         VALUES ($1, $2, $3, $4, $5::vector)`,
                [
                    randomUUID(),
                    documentId,
                    chunk,
                    i,
                    JSON.stringify(embedding),
                ],
            );
        }

        return {
            documentId,
            filename: file.originalname,
            chunksCreated: chunks.length,
        };
    }

    async searchSimilarChunks(question: string, limit = 5) {
        const embedding =
            await this.embeddingService.generateEmbedding(question);

        const result = await this.pool.query(
            `SELECT
       dc.content,
       dc.chunk_index,
       d.filename,
       dc.embedding <=> $1::vector AS distance
     FROM document_chunks dc
     JOIN documents d ON d.id = dc.document_id
     ORDER BY dc.embedding <=> $1::vector
     LIMIT $2`,
            [JSON.stringify(embedding), limit],
        );

        return result.rows;
    }

    async askQuestion(question: string) {
        const chunks = await this.searchSimilarChunks(question, 5);

        const context = chunks
            .map((chunk, index) =>
                `Source ${index + 1}: ${chunk.filename}\n${chunk.content}`,
            )
            .join('\n\n');

        const answer = await this.aiService.answerWithContext(
            question,
            context,
        );

        return {
            answer,
            sources: chunks.map((chunk) => ({
                filename: chunk.filename,
                chunkIndex: chunk.chunk_index,
            })),
        };
    }

}
