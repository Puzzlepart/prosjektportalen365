declare interface IPortfolioOverviewWebPartStrings {
  Title: string;
  LoadingText: string;
  SearchBoxPlaceHolder: string;
  NoGrouping: string;
  ViewNotFoundMessage: string;
  NoDefaultViewMessage: string;
  GetConfigErrorMessage: string;
  FetchDataErrorMessage: string;
  FiltersString: string;
  FieldSelectorName: string;
  FieldSelectorEmptyMessage: string;
  NotSet: string;
  PortfolioViewsListName: string;
  ProjectColumnsListName: string;
  ProjectColumnConfigListName: string;
  ExcelExportFileNamePrefix: string;
  NewViewText: string;
}

declare module 'PortfolioOverviewWebPartStrings' {
  const strings: IPortfolioOverviewWebPartStrings;
  export = strings;
}
