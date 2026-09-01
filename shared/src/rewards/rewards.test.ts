import { describe, expect, it } from 'vitest';
import { ActivityType, MissionId } from '../constants/enums.js';
import { DAILY_MISSIONS, checkInDedupeKey, evaluateMissions, findMission, missionDedupeKey } from './rewards.js';

describe('evaluateMissions', () => {
  it('chưa làm gì thì cả ba nhiệm vụ đều ở 0 và chưa hoàn thành', () => {
    const states = evaluateMissions({});
    expect(states).toHaveLength(DAILY_MISSIONS.length);
    expect(states.every((m) => m.progress === 0 && !m.isCompleted && !m.isClaimed)).toBe(true);
  });

  it('đếm đúng theo từng loại hoạt động, không lẫn sang nhiệm vụ khác', () => {
    const states = evaluateMissions({ [ActivityType.VOCAB_LEARNED]: 5 });
    const vocab = states.find((m) => m.id === MissionId.LEARN_VOCAB);
    const cards = states.find((m) => m.id === MissionId.REVIEW_FLASHCARDS);

    expect(vocab?.isCompleted).toBe(true);
    expect(cards?.progress).toBe(0);
  });

  it('làm vượt chỉ tiêu thì tiến độ cắt trần ở target, không vượt 100%', () => {
    const states = evaluateMissions({ [ActivityType.FLASHCARD_REVIEWED]: 999 });
    const cards = states.find((m) => m.id === MissionId.REVIEW_FLASHCARDS);

    expect(cards?.progress).toBe(cards?.target);
    expect(cards?.isCompleted).toBe(true);
  });

  it('nhiệm vụ đã nhận thưởng được đánh dấu isClaimed', () => {
    const states = evaluateMissions({ [ActivityType.HABIT_CHECKIN]: 1 }, [MissionId.DO_HABIT]);
    const habit = states.find((m) => m.id === MissionId.DO_HABIT);

    expect(habit?.isCompleted).toBe(true);
    expect(habit?.isClaimed).toBe(true);
  });
});

describe('khoá chống trùng', () => {
  it('mỗi ngày một khoá điểm danh khác nhau', () => {
    expect(checkInDedupeKey('2026-09-01')).not.toBe(checkInDedupeKey('2026-09-02'));
  });

  it('khoá nhiệm vụ gắn cả mã nhiệm vụ lẫn ngày', () => {
    const key = missionDedupeKey(MissionId.LEARN_VOCAB, '2026-09-01');
    expect(key).toContain(MissionId.LEARN_VOCAB);
    expect(key).toContain('2026-09-01');
    expect(key).not.toBe(missionDedupeKey(MissionId.DO_HABIT, '2026-09-01'));
  });
});

describe('findMission', () => {
  it('trả về undefined với mã lạ thay vì ném lỗi', () => {
    expect(findMission('KHONG_TON_TAI')).toBeUndefined();
  });
});
