import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { randomUUID } from 'crypto';

@Injectable()
export class TasksService {
    constructor(@Inject('PG_POOL') private pool: Pool) {}

    async createTask(title: string, dueDate: string) {
        const result = await this.pool.query(
            `INSERT INTO study_tasks (id, title, due_date)
       VALUES ($1, $2, $3)
       RETURNING *`,
            [randomUUID(), title, dueDate],
        );

        return result.rows[0];
    }

    async getTasks() {
        const result = await this.pool.query(
            `SELECT * FROM study_tasks ORDER BY due_date ASC`,
        );

        return result.rows;
    }
}