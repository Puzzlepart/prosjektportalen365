declare interface ITemplateSelectorCommandSetStrings {
  TemplateLibrarySelectModalTitle: string;
  CopyProgressLabel: string;
  CloseModalText: string;
  OnSubmitSelectionText: string;
  OnStartCopyText: string;
  OnGoBackText: string;
  NameLabel: string;
  TitleLabel: string;
  ModifiedLabel: string;
  SummaryText: string;
  GetMoreText: string;
  LibraryDropdownLabel: string;
}

declare module 'TemplateSelectorCommandSetStrings' {
  const strings: ITemplateSelectorCommandSetStrings;
  export = strings;
}
