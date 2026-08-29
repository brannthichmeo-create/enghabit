import pino from 'pino';
import { env, isProduction } from '../config/env.js';

/**
 * Logger dùng chung. Mọi request có request-id để trace xuyên suốt
 * routes → controller → service (xem CLAUDE.md > Quy tắc debug).
 */
export const logger = pino({
  level: isProduction ? 'info' : 'debug',
  // Dev đọc log dạng dễ nhìn; production giữ JSON để công cụ log phân tích được.
  transport: isProduction ? undefined : { target: 'pino-pretty', options: { colorize: true } },
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', '*.password', '*.passwordHash'],
    censor: '***',
  },
  base: { env: env.NODE_ENV },
});

/** Logger riêng cho cron job — tách khỏi log request để debug notification không bị lẫn. */
export const jobLogger = logger.child({ scope: 'job' });
