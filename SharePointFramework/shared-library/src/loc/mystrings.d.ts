declare interface ISharedLibraryStrings {
  NoAccessToPortfolioErrorTitle: string
  NoAccessToPortfolioErrorText: string
  BooleanYes: string
  BooleanNo: string
  GtModerationStatus_Choice_Draft: string
  GtModerationStatus_Choice_Published: string
  SaveText: string
  CloseText: string
  Aria: {
    InfoLabelTitle: string
    MenuOverflowCount: string
    ProjectTitle: string
    SaveTitle: string
    SaveDisabledTitle: string
  }
  Placeholder: {
    DatePicker: string
    TextField: string
    UrlField: string
    UrlFieldAlternative: string
    TaxonomyPicker: string
    PeoplePicker: string
    NumberField: string
    ChoiceField: string
    MultiChoiceField: string
  },
  AllocationPercetageLabel: string
  AllocationStatusLabel: string
  BudgetTotalLabel: string
  CategoryFieldLabel: string
  ColumnRenderOptionDate: string
  CommentLabel: string
  CostsTotalLabel: string
  CurrentPhaseLabel: string
  DescriptionFieldLabel: string
  EndDateLabel: string
  ErrorTitle: string
  FiltersString: string
  FilterText: string
  FilterPanelEmptyTitle: string
  FilterPanelEmptyMessage: string
  GroupByLabel: string
  LastPublishedStatusreport: string
  LoadingText: string
  MilestoneDateLabel: string
  NameLabel: string
  ProjectTimelineErrorTransformItemText: string
  ProjectTimelineInfoText: string
  ProjectTimelineTitle: string
  ProjectTimelineItemInfo: string
  ProgramTimelineTitle: string
  ResourceLabel: string
  RoleLabel: string
  SiteTitleLabel: string
  StartDateLabel: string
  TagFieldLabel: string
  TimelineGroupDescription: string
  TypeLabel: string
  SyncListAddingField: string
}

declare module 'SharedLibraryStrings' {
  const strings: ISharedLibraryStrings
  export = strings
}
