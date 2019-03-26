declare interface IExperienceLogWebPartStrings {
  Title: string;
  ExcelExportFileNamePrefix: string;
  ExcelExportButtonLabel: string;
  TitleLabel: string;
  DescriptionLabel: string;
  ResponsibleLabel: string;
  ConsequenceLabel: string;
  RecommendationLabel: string;
  ActorsLabel: string;
}

declare module 'ExperienceLogWebPartStrings' {
  const strings: IExperienceLogWebPartStrings;
  export = strings;
}
