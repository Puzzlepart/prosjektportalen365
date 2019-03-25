declare interface IExperienceLogWebPartStrings {
  LoadingText: string;
  ExcelExportFileNamePrefix: string;
  ExcelExportButtonLabel: string;
  TitleColumnDisplayName: string;
  SiteTitleColumnDisplayName: string;
  DescriptionColumnDisplayName: string;
  ResponsibleColumnDisplayName: string;
  ConsequenceColumnDisplayName: string;
  RecommendationColumnDisplayName: string;
  ActorsColumnDisplayName: string;
  NoGroupingText: string;
  SearchBoxLabelText: string;
}

declare module 'ExperienceLogWebPartStrings' {
  const strings: IExperienceLogWebPartStrings;
  export = strings;
}
