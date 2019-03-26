declare interface IRiskOverviewWebPartStrings {
  Title: string;
  LoadingText: string;
  SearchBoxLabelText: string;
  ProbabilityLabel: string;
  ConsequenceLabel: string;
  ProbabilityPostActionLabel: string;
  ConsequencePostActionLabel: string;
  RiskActionLabel: string;
}

declare module 'RiskOverviewWebPartStrings' {
  const strings: IRiskOverviewWebPartStrings;
  export = strings;
}
