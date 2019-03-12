declare interface IProjectStatusWebPartStrings {
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
