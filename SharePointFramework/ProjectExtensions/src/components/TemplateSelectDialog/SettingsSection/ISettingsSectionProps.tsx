export interface ISettings {
    includeStandardFolders?: boolean;
    copyPlannerTasks?: boolean;
    localProjectPropertiesList?: boolean;
}

export interface ISettingsSectionProps {
    defaultChecked: ISettings;
    onChange: (obj: ISettings) => void;
}
