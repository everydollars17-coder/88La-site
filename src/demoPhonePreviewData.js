export const DEMO_PHONE_PREVIEW = Object.freeze({
  progress: Object.freeze({
    stateLabel: "本月目前",
    balanceLabel: "可用餘額",
    balance: 2680,
    daysRemaining: 8,
    activityHeading: "月底前還有 1 項待處理",
    activityItems: Object.freeze([
      Object.freeze({
        label: "手機費",
        amount: 699,
        body: "本月目前還沒看到付款紀錄。",
        completed: false,
      }),
    ]),
    budgetAlerts: Object.freeze([
      Object.freeze({ label: "外食", budget: 3500, actual: 3820 }),
    ]),
    goals: Object.freeze([
      Object.freeze({ label: "緊急備用金", planned: 3000, actual: 1500 }),
      Object.freeze({ label: "旅遊基金", planned: 1000, actual: 1200 }),
    ]),
    nextMonthCardDue: 2480,
  }),
  complete: Object.freeze({
    stateLabel: "本月已結束",
    balanceLabel: "本月剩餘",
    balance: 3260,
    daysRemaining: null,
    activityHeading: "本月已完成 1 項處理",
    activityItems: Object.freeze([
      Object.freeze({
        label: "手機費",
        amount: 699,
        body: "已在本月留下付款紀錄。",
        completed: true,
      }),
    ]),
    budgetAlerts: Object.freeze([
      Object.freeze({ label: "外食", budget: 4500, actual: 5350 }),
    ]),
    goals: Object.freeze([
      Object.freeze({ label: "緊急備用金", planned: 4000, actual: 4000 }),
      Object.freeze({ label: "旅遊基金", planned: 3000, actual: 2000 }),
    ]),
    nextMonthCardDue: 2480,
  }),
});

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

  return {
    ...source,
    budgetAlerts,
    goals,
    unfinishedGoalCount,
    summaryItems: [
      `${source.activityItems.length} 項${state === "complete" ? "完成事項" : "待處理"}`,
      `${budgetAlerts.length} 項預算提醒`,
      `${unfinishedGoalCount} 個目標未完成`,
    ],
  };
};
