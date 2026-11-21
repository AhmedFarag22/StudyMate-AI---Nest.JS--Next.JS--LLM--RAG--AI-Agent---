import {forwardRef, Module} from '@nestjs/common';
import { AiService } from './ai.service.js';
import { AiController } from './ai.controller.js';
import {EmbeddingService} from "./embedding.service.js";
import {TasksModule} from "../tasks/tasks.module.js";
import {AgentService} from "./agent.service.js";
import {DocumentsModule} from "../documents/documents.module.js";

@Module({
  imports: [TasksModule, forwardRef(() => DocumentsModule)],
  providers: [AiService, EmbeddingService, AgentService],
  controllers: [AiController],
  exports: [EmbeddingService, AiService, AgentService],
})
export class AiModule {}
