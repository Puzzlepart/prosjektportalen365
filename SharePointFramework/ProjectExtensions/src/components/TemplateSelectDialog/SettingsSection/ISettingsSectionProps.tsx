export interface ISettingsSectionProps {
    defaultChecked: { includeStandardFolders: boolean, copyPlannerTasks: boolean };
    onChange: (obj: { includeStandardFolders?: boolean, copyPlannerTasks?: boolean }) => void;
}
