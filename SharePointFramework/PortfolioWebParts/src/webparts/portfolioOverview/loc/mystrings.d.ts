declare interface IPortfolioOverviewWebPartStrings {
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
}

declare module 'PortfolioOverviewWebPartStrings' {
  const strings: IPortfolioOverviewWebPartStrings;
  export = strings;
}
