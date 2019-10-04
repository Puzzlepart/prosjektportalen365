import { ProjectSetupSettings } from '../../../extensions/projectSetup/ProjectSetupSettings';

export interface ISettingsSectionProps {
    /**
     * Default settings
     */
    defaultSettings: ProjectSetupSettings;

    /**
     * On setting change
     * 
     * @param {string} key Key
     * @param {string} bool Bool
     */
    onChange: (key: string, bool: boolean) => void;
}
