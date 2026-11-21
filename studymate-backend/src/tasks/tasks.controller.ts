import { Controller, Get, Post, Body } from '@nestjs/common';
import { TasksService } from './tasks.service.js';

@Controller('tasks')
export class TasksController {
    constructor(private tasksService: TasksService) {}

    @Get()
    getTasks() {
        return this.tasksService.getTasks();
    }

    @Post()
    createTask(
        @Body('title') title: string,
        @Body('dueDate') dueDate: string,
    ) {
        return this.tasksService.createTask(title, dueDate);
    }
}