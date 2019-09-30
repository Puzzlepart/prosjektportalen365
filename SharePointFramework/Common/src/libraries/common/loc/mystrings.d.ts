declare interface ICommonLibraryStrings {
  PropertyPaneDescription: string;
  BasicGroupName: string;
  DescriptionFieldLabel: string;
}

declare module 'CommonLibraryStrings' {
  const strings: ICommonLibraryStrings;
  export = strings;
}
