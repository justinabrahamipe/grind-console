export type GoalsStackParamList = {
  GoalsList: undefined;
  GoalDetail: { goalId: number };
  GoalForm: { goalId?: number };
};

export type CyclesStackParamList = {
  CyclesList: undefined;
  CycleDetail: { cycleId: number };
  CycleForm: { cycleId?: number };
};

export type TasksStackParamList = {
  TasksList: undefined;
  TaskForm: { date: string; taskId?: number };
};

export type MoreStackParamList = {
  MoreMenu: undefined;
  Settings: undefined;
};

export type RootTabParamList = {
  Tasks: undefined;
  Dashboard: undefined;
  Log: undefined;
  More: undefined;
};
