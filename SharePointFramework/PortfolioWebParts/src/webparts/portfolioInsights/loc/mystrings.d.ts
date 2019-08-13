declare interface IPortfolioInsightsWebPartStrings {
  Title: string;
  LoadingText: string;
  EmptyText: string;
  ErrorText: string;
  ChartErrorText: string;
  SPChartConfigurationList: string;
  SPColumnConfigurationList: string;
}

declare module 'PortfolioInsightsWebPartStrings' {
  const strings: IPortfolioInsightsWebPartStrings;
  export = strings;
}
