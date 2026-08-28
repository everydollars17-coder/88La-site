import { DEMO_PHONE_PREVIEW_GENERATED } from "./demoPhonePreviewGenerated.js";

export const DEMO_PHONE_PREVIEW = DEMO_PHONE_PREVIEW_GENERATED;

export const deriveDemoPhonePreview = state => {
  const source = DEMO_PHONE_PREVIEW[state] || DEMO_PHONE_PREVIEW.progress;
  const budgetAlerts = source.budgetAlerts.map(item => ({
    ...item,
    over: Math.max(0, item.actual - item.budget),
  }));
  const goals = source.goals.map(item => ({
    ...item,
    remaining: Math.max(0, item.planned - item.actual),
    completed: item.actual >= item.planned,
  }));
  const unfinishedGoalCount = goals.filter(item => !item.completed).length;
  const goalGap = state === "complete"
    ? goals.find(item => item.label === source.goalGapLabel && !item.completed) || null
    : null;
  const topDiagnosis = source.topDiagnosis || null;
  const monthOutcome = source.monthOutcome
    ? {
        ...source.monthOutcome,
        title: source.monthOutcome.title || (source.monthOutcome.hasCashGap
          ? "本月出現現金缺口。"
          : source.monthOutcome.arrangementsComplete
            ? "本月沒有現金缺口，原訂安排也已完成。"
            : "本月沒有現金缺口，但原訂安排沒有全部完成。"),
      }
    : null;

  return {
    ...source,
    budgetAlerts,
    goals,
    goalGap,
    topDiagnosis,
    monthOutcome,
    unfinishedGoalCount,
    summaryItems: [
      `${source.activityItems.length} 項${state === "complete" ? "完成事項" : "待處理"}`,
      `${source.budgetAlertCount ?? budgetAlerts.length} 項預算提醒`,
      `${unfinishedGoalCount} 個目標未完成`,
    ],
  };
};
