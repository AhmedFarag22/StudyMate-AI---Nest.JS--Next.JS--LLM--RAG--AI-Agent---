import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmbeddingService {
    private openai: OpenAI;

    constructor(config: ConfigService) {
        this.openai = new OpenAI({
            apiKey: config.get<string>('OPENAI_API_KEY'),
        });
    }

    async generateEmbedding(text: string): Promise<number[]> {
        const response = await this.openai.embeddings.create({
            model: 'text-embedding-3-small',
            input: text,
        });

        return response.data[0].embedding;
    }
}