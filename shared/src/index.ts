/**
 * @enghabit/shared — code dùng chung cho be / fe / mobile.
 *
 * Chỉ chứa: enum nghiệp vụ, Zod schema validate, domain logic độc lập platform (srs, streak, date).
 * KHÔNG đặt UI component hay code đặc thù một platform vào đây (xem CLAUDE.md).
 */

export * from './constants/index.js';
export * from './date/local-date.js';
export * from './encoding/base64.js';
export * from './streak/streak.js';
export * from './level/level.js';
export * from './srs/sm2.js';
export * from './study/study.js';
export * from './study/multiple-choice.js';
export * from './study/card-import.js';
export * from './rewards/rewards.js';
export * from './shop/shop.js';
export * from './report/report.js';
export * from './goal/goal-deadline.js';
export * from './avatar/avatar.js';
export * from './attachment/attachment.js';
export * from './mention/mention.js';
export * from './schemas/index.js';
