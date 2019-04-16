declare interface IProjectPhasesWebPartStrings {
  SettingsGroupName: string;
  ViewsGroupName: string;
  PersistedPhasePropertyBagKey: string;
  AutomaticReloadFieldLabel: string;
  ReloadTimeoutFieldLabel: string;
  UpdateViewsDocumentsFieldLabel: string;
  UpdateViewsRisksFieldLabel: string;
  CurrentPhaseViewNameFieldLabel: string;
  ConfirmPhaseChangeFieldLabel: string;
  PhaseSubTextPropertyFieldLabel: string;
  ConfirmPhaseDialogTitle: string;
  ConfirmPhaseDialogSubText: string;
  PageReloadMessage: string;
  WebPartNotConfiguredMessage: string;
  DocumentsListName: string;
  PhaseChecklistName: string;
  Yes: string;
  No: string;
  MoveOn: string;
  Close: string;
  Skip: string;
  CheckPointsMarkedAsText: string;
  TasksLinkText: string;
  PhaseChecklistLinkText: string;
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
