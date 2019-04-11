declare interface IProjectListWebPartStrings {
  PropertyPaneDescription: string;
  BasicGroupName: string;
  DescriptionFieldLabel: string;
  NotSet: string;
  ProjectOwner: string;
  ProjectManager: string;
  SearchBoxPlaceholderText: string;
  NoSearchResults: string;
  MissingProperties: string;
  NoProperties: string;
  ProjectLinkText: string;
  ProjectStatusLinkText: string;
  LoadingText: string;
  ErrorText: string;
  ShowAsListText: string;
  ShowAsTilesText: string;
  GeneralGroupName: string;
  SortByFieldLabel: string;
  PhaseTermSetIdFieldLabel: string;
  TileViewGroupName: string;
  ShowProjectOwnerFieldLabel: string;
  ShowProjectManagerFieldLabel: string;
}

declare module 'ProjectListWebPartStrings' {
  const strings: IProjectListWebPartStrings;
  export = strings;
}
