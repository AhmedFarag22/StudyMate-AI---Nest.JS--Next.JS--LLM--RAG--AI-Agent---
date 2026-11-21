import { Module } from '@nestjs/common';
import { createObserveModule } from '@nestjs/observe';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import {ConfigModule} from "@nestjs/config";
import { AiModule } from './ai/ai.module.js';
import {DatabaseModule} from "./database/database.module.js";
import { DocumentsModule } from './documents/documents.module.js';
import { TasksModule } from './tasks/tasks.module.js';


export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    // Distributed tracing, auto-correlated logs, request/job metrics, error
    // telemetry, alarms, and more — out of the box. Sign up at https://observe.nestjs.com,
    // then run `npx @nestjs/observe link` to write your key pair into .env.
    ObserveModule.forRoot({
      appKey: process.env.OBSERVE_APP_KEY ?? 'YOUR_APP_KEY',
      appSecret: process.env.OBSERVE_APP_SECRET ?? 'YOUR_APP_SECRET',
      serviceId: 'studymate-backend',
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    AiModule,
    DocumentsModule,
    TasksModule

  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
