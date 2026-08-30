import { useState, type FormEvent } from 'react';
import {
  GoalPeriod,
  GoalStatus,
  GoalType,
  createGoalSchema,
  todayLocalDate,
  type GoalProgress,
} from '@enghabit/shared';
import { getErrorMessage } from '../../../shared/lib/api-client';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorMessage,
  Field,
  Input,
  SkeletonList,
  PageHeader,
  Select,
} from '../../../shared/components/ui';
import { GOAL_TYPE_LABELS } from '../../../shared/lib/labels';
import { useCurrentUser } from '../../auth/auth.store';
import { useCreateGoal, useDeleteGoal, useGoalProgress, useGoals } from '../goal.hooks';

export function GoalsPage(): JSX.Element {
  const goals = useGoals();
  const progress = useGoalProgress();
  const deleteGoal = useDeleteGoal();
  const [showForm, setShowForm] = useState(false);

  const progressByGoal = new Map(progress.data?.map((p) => [p.goalId, p]) ?? []);

  return (
    <div>
      <PageHeader
        title="Mục tiêu học tập"
        description="Đặt mục tiêu cụ thể để theo dõi tiến độ mỗi ngày"
        action={<Button onClick={() => setShowForm((v) => !v)}>{showForm ? 'Đóng' : '+ Thêm mục tiêu'}</Button>}
      />

      {showForm && (
        <div className="mb-6">
          <GoalForm onCreated={() => setShowForm(false)} />
        </div>
      )}

      {goals.isLoading && <SkeletonList rows={3} />}
      {goals.isError && <ErrorMessage>{getErrorMessage(goals.error)}</ErrorMessage>}

      {goals.data?.length === 0 && (
        <EmptyState title="Chưa có mục tiêu nào" description="Ví dụ: học 20 từ vựng mỗi ngày" />
      )}

      <div className="space-y-3">
        {goals.data?.map((goal) => (
          <Card key={goal.id}>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-slate-900">{GOAL_TYPE_LABELS[goal.type]}</h3>
                  <Badge tone={goal.status === GoalStatus.ACTIVE ? 'brand' : 'slate'}>
                    {goal.period === GoalPeriod.DAILY ? 'Mỗi ngày' : 'Mỗi tuần'}
                  </Badge>
                </div>

                <ProgressBar target={goal.targetValue} progress={progressByGoal.get(goal.id)} />
              </div>

              <Button
                variant="ghost"
                onClick={() => {
                  if (confirm('Xoá mục tiêu này?')) deleteGoal.mutate(goal.id);
                }}
              >
                Xoá
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ProgressBar({ target, progress }: { target: number; progress?: GoalProgress }): JSX.Element {
  const current = progress?.currentValue ?? 0;
  const rate = progress?.completionRate ?? 0;

  return (
    <div className="mt-3">
      <div className="mb-1 flex justify-between text-sm">
        <span className="text-slate-600">
          {current} / {target}
        </span>
        <span className={progress?.isCompleted ? 'font-medium text-green-600' : 'text-slate-500'}>
          {progress?.isCompleted ? '✓ Hoàn thành' : `${rate}%`}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all ${progress?.isCompleted ? 'bg-green-500' : 'bg-indigo-500'}`}
          style={{ width: `${rate}%` }}
        />
      </div>
    </div>
  );
}

function GoalForm({ onCreated }: { onCreated: () => void }): JSX.Element {
  const user = useCurrentUser();
  const createGoal = useCreateGoal();
  const [type, setType] = useState<GoalType>(GoalType.VOCAB_PER_DAY);
  const [targetValue, setTargetValue] = useState('20');
  const [period, setPeriod] = useState<GoalPeriod>(GoalPeriod.DAILY);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent): void => {
    event.preventDefault();
    setValidationError(null);

    const parsed = createGoalSchema.safeParse({
      type,
      targetValue: Number(targetValue),
      period,
      startDate: todayLocalDate(user?.timezone ?? 'Asia/Ho_Chi_Minh'),
    });

    if (!parsed.success) {
      setValidationError(parsed.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ');
      return;
    }

    createGoal.mutate(parsed.data, { onSuccess: onCreated });
  };

  const errorMessage = validationError ?? (createGoal.error ? getErrorMessage(createGoal.error) : null);

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-4">
        <ErrorMessage>{errorMessage}</ErrorMessage>

        <Field label="Loại mục tiêu">
          <Select value={type} onChange={(e) => setType(e.target.value as GoalType)}>
            {Object.entries(GOAL_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Chỉ tiêu">
            <Input
              type="number"
              min={1}
              value={targetValue}
              onChange={(e) => setTargetValue(e.target.value)}
            />
          </Field>

          <Field label="Chu kỳ">
            <Select value={period} onChange={(e) => setPeriod(e.target.value as GoalPeriod)}>
              <option value={GoalPeriod.DAILY}>Mỗi ngày</option>
              <option value={GoalPeriod.WEEKLY}>Mỗi tuần</option>
            </Select>
          </Field>
        </div>

        <Button type="submit" disabled={createGoal.isPending}>
          {createGoal.isPending ? 'Đang tạo...' : 'Tạo mục tiêu'}
        </Button>
      </form>
    </Card>
  );
}
