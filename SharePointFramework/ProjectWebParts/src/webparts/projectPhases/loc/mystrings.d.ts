declare interface IProjectPhasesWebPartStrings {
  SettingsGroupName: string;
  ViewsGroupName: string;
  LookAndFeelGroupName: string;
  PersistedPhasePropertyBagKey: string;
  PhaseFieldFieldLabel: string;
  AutomaticReloadFieldLabel: string;
  ReloadTimeoutFieldLabel: string;
  FontSizeFieldLabel: string;
  GutterFieldLabel: string;
  UpdateViewsDocumentsFieldLabel: string;
  UpdateViewsRisksFieldLabel: string;
  UpdateViewNameFieldLabel: string;
  ConfirmPhaseChangeFieldLabel: string;
  PhaseSubTextPropertyFieldLabel: string;
  ConfirmPhaseDialogTitle: string;
  ConfirmPhaseDialogSubText: string;
  PageReloadMessage: string;
  WebPartNotConfiguredMessage: string;
  DocumentsListName: string;
  RiskRegisterListName: string;
  TasksListName: string;
  PhaseChecklistName: string;
  Yes: string;
  No: string;
  MoveOn: string;
  Close: string;
  Skip: string;
  CheckPointsMarkedAsText: string;
  GoToPhaseChecklist: string;
  ChangePhaseText: string;
  ConfirmChangePhase: string;
  PhaseChecklistViewUrl: string;
  CheckpointNotRelevantTooltipCommentEmpty: string;
  CheckpointNotRelevantTooltip: string;
  CheckpointStillOpenTooltipCommentEmpty: string;
  CheckpointStillOpenTooltip: string;
  CheckpointDoneTooltip: string;
  StatusNotRelevant: string;
  StatusOpen: string;
  StatusStillOpen: string;
  StatusClosed: string;
  CommentLabel: string;
  ChangingPhaseLabel: string;
  ChangingPhaseDescription: string;
  LoadingText: string;
}

declare module 'ProjectPhasesWebPartStrings' {
  const strings: IProjectPhasesWebPartStrings;
  export = strings;
}
