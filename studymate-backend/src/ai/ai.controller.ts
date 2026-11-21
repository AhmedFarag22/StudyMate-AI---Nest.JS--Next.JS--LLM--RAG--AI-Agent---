import { Controller, Post, Body } from '@nestjs/common';
import { AiService } from './ai.service.js';
import { AgentService } from './agent.service.js';

@Controller('ai')
export class AiController {
    constructor(private readonly aiService: AiService,
                private readonly agentService: AgentService) {}

    @Post('chat')
    async chat(@Body('message') message: string) {
        return this.aiService.chat(message);
    }

    @Post('agent')
    runAgent(@Body('message') message: string) {
        return this.agentService.run(message);
    }
}
