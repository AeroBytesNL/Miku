import chalk from 'chalk';
//import { appendFileSync } from 'fs';

export class Logging {
    private static now(): Date {
        return new Date;
    }

    static info(message: string | number): void {
        console.log(`[${this.formatDate(this.now())}] [${chalk.green('INFO')}]  ${message}`);
    }

    static warn(message: string | number): void {
        console.log(`[${this.formatDate(this.now())}] [${chalk.yellow('WARN')}]  ${message}`);
    }

    static error(message: string | number): void {
        console.log(`[${this.formatDate(this.now())}] [${chalk.red('ERROR')}] ${message}`);
    }

    static debug(message: string | number): void {
        console.log(`[${this.formatDate(this.now())}] [${chalk.blue('DEBUG')}] ${message}`);
    }

    static trace(message: string | number): void {
        console.log(`[${this.formatDate(this.now())}] [${chalk.grey('TRACE')}] ${message}`);
    }

    private static formatDate(now: Date): string {
        return `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getUTCSeconds()).padStart(2, '0')}`;
    }
}
