/* eslint-disable @typescript-eslint/no-empty-interface */
declare interface ISharedLibraryStrings {
  FiltersString: string
  Aria: {
    ProjectTitle: string
    InfoLabelTitle: string
  }
  AllocationPercetageLabel: string
  AllocationStatusLabel: string
  BarLabel: string
  BudgetTotalLabel: string
  CategoryFieldLabel: string
  ColumnRenderOptionDate: string
  CommentLabel: string
  CostsTotalLabel: string
  CurrentPhaseLabel: string
  DescriptionFieldLabel: string
  DiamondLabel: string
  EndDateLabel: string
  FilterText: string
  GroupByLabel: string
  LastPublishedStatusreport: string
  LoadingText: string
  MilestoneDateLabel: string
  MilestoneLabel: string
  NameLabel: string
  PhaseLabel: string
  ProjectLabel: string
  ProjectTimelineErrorTransformItemText: string
  ProjectTimelineInfoText: string
  ProjectTimelineItemInfo: string
  ResourceLabel: string
  RoleLabel: string
  SiteTitleLabel: string
  StartDateLabel: string
  SubPhaseLabel: string
  TagFieldLabel: string
  TriangleLabel: any
  TypeLabel: string
}

declare module 'SharedLibraryStrings' {
  const strings: ISharedLibraryStrings
  export = strings
}
