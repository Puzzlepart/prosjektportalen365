/* eslint-disable @typescript-eslint/no-empty-interface */
declare interface ISharedLibraryStrings {
  ProjectTimelineInfoText: string
  SiteTitleLabel: string
  DiamondLabel: string
  BarLabel: string
  ProjectTimelineItemInfo: string
  ProjectTimelineErrorTransformItemText: string
  GroupByLabel: string
  CategoryFieldLabel: string
  FilterText: string
  MilestoneLabel: string
  MilestoneDateLabel: string
  PhaseLabel: string
  SubPhaseLabel: string
  StartDateLabel: string
  EndDateLabel: string
  ProjectLabel: string
  LastPublishedStatusreport: string
  CurrentPhaseLabel: string
  NameLabel: string
  TriangleLabel: any
  ColumnRenderOptionDate: string
  TagFieldLabel: string
  BudgetTotalLabel: string
  CostsTotalLabel: string
  DescriptionFieldLabel: string
  TypeLabel: string
  LoadingText: string
}

declare module 'SharedLibraryStrings' {
  const strings: ISharedLibraryStrings
  export = strings
}
