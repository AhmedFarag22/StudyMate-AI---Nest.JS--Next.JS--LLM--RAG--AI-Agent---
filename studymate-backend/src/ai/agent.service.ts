
import {forwardRef, Inject, Injectable} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { TasksService } from '../tasks/tasks.service.js';
import {DocumentsService} from "../documents/documents.service.js";

@Injectable()
export class AgentService {
    private openai: OpenAI;

    constructor(
        config: ConfigService,
        private tasksService: TasksService,
        @Inject(forwardRef(() => DocumentsService))
        private documentsService: DocumentsService,
    ) {
        this.openai = new OpenAI({
            apiKey: config.get<string>('OPENAI_API_KEY'),
        });
    }

    async run(userMessage: string) {
        const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
            {
                type: 'function',
                function: {
                    name: 'createStudyTask',
                    description: 'Create a study task for the user',
                    parameters: {
                        type: 'object',
                        properties: {
                            title: {
                                type: 'string',
                                description: 'The task title',
                            },
                            dueDate: {
                                type: 'string',
                                description: 'Date in YYYY-MM-DD format',
                            },
                        },
                        required: ['title', 'dueDate'],
                        additionalProperties: false,
                    },
                    strict: true,
                },
            },
            {
                type: 'function',
                function: {
                    name: 'searchStudyDocuments',
                    description:
                        'Search uploaded study documents to answer questions about their content.',
                    parameters: {
                        type: 'object',
                        properties: {
                            question: {
                                type: 'string',
                                description: 'The question to search for in uploaded documents',
                            },
                        },
                        required: ['question'],
                        additionalProperties: false,
                    },
                    strict: true,
                },
            },
        ];

        const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
            {
                role: 'system',
                content: `
You are StudyMate, an AI study assistant.

You can:
1. Search uploaded study documents.
2. Create study tasks.

Rules:
- Use searchStudyDocuments when the user asks about uploaded documents.
- Use createStudyTask when the user requests creating a task.
- You can use both tools if necessary.
- Never invent information from documents.
- Never claim a task was created unless the tool succeeds.
`,
            },
            {
                role: 'user',
                content: userMessage,
            },
        ];

        const response = await this.openai.chat.completions.create({
            model: this.configModel(),
            messages,
            tools,
            tool_choice: 'auto',
        });

        const assistantMessage = response.choices[0].message;

        if (assistantMessage.tool_calls?.length) {
            messages.push(assistantMessage);

            for (const toolCall of assistantMessage.tool_calls) {
                if (toolCall.type !== 'function') continue;

                const args = JSON.parse(toolCall.function.arguments);

                let result: unknown;

                if (toolCall.function.name === 'createStudyTask') {
                    result = await this.tasksService.createTask(
                        args.title,
                        args.dueDate,
                    );
                }

                else if (
                    toolCall.function.name === 'searchStudyDocuments'
                ) {
                    result = await this.documentsService.searchSimilarChunks(
                        args.question,
                    );
                }

                else {
                    result = { error: 'Unknown tool' };
                }

                messages.push({
                    role: 'tool',
                    tool_call_id: toolCall.id,
                    content: JSON.stringify(result),
                });
            }

            const finalResponse =
                await this.openai.chat.completions.create({
                    model: this.configModel(),
                    messages,
                });

            return {
                answer: finalResponse.choices[0].message.content,
            };
        }

        return {
            answer: assistantMessage.content,
        };
    }

    private configModel(): string {
        return 'gpt-4.1-mini';
    }
}
