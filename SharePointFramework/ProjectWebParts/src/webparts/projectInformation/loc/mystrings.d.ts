declare interface IProjectInformationWebPartStrings { 
  LoadingText: string;
  ErrorText: string;
  MissingPropertiesMessage: string;
  NoPropertiesMessage: string;
  EditPropertiesText: string;
  EditSiteInformationText: string;
  ViewVersionHistoryText: string;
}

declare module 'ProjectInformationWebPartStrings' {
  const strings: IProjectInformationWebPartStrings;
  export = strings;
}
