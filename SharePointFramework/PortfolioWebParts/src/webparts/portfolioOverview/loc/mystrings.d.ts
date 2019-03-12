declare interface IPortfolioOverviewWebPartStrings {
  ProjectLabel: string;
  LoadingText: string;
  SearchBoxPlaceHolder: string;
  NoGrouping: string;
  ShowCount: string;
  ShowCountWithFilters: string;
  PortfolioFieldsListTitle: string;
  PortfolioRefinersListTitle: string;
  PortfolioViewsListTitle: string;
  ViewNotFoundMessage: string;
  NoDefaultViewMessage: string;
  FiltersString: string;
  FieldSelectorName: string;
  FieldSelectorEmptyMessage: string;  
  NotSet: string;
}

declare module 'PortfolioOverviewWebPartStrings' {
  const strings: IPortfolioOverviewWebPartStrings;
  export = strings;
}
