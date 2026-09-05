import { BaseTable } from "./base.table";

export type LogLevel = 'info' | 'error';

export interface Log extends BaseTable {
  level: LogLevel;
  source: string;
  message: string;
  metadata: Record<string, any>;
}
