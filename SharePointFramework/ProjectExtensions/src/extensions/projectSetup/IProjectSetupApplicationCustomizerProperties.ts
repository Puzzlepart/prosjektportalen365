export interface IProjectSetupApplicationCustomizerProperties {
    templatesLibrary: string;
    extensionsLibrary: string;
    projectsList: string;
    contentConfigList: string;
    termSetIds: { [key: string]: string };
    tasks: string[];
}