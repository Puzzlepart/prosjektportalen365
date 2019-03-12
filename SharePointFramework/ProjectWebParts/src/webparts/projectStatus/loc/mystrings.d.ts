declare interface IProjectStatusWebPartStrings {
  OverallStatusFieldName: string;
  LoadingText: string;
  SaveText: string;
  PickReportText: string;
  NewStatusReportModalHeaderText: string;
  EditReportButtonText: string;
}

declare module 'ProjectStatusWebPartStrings' {
  const strings: IProjectStatusWebPartStrings;
  export = strings;
}
