import {forwardRef, Module} from '@nestjs/common';
import { DocumentsService } from './documents.service.js';
import { DocumentsController } from './documents.controller.js';
import {AiModule} from "../ai/ai.module.js";
import {AiService} from "../ai/ai.service.js";
import {EmbeddingService} from "../ai/embedding.service.js";

@Module({
  imports: [forwardRef(() => AiModule)],
  providers: [DocumentsService],
  controllers: [DocumentsController],
  exports: [DocumentsService],
})
export class DocumentsModule {}

