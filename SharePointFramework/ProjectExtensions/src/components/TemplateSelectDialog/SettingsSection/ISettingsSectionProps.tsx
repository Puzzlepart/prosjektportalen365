import { ProjectSetupSettings } from '../../../extensions/projectSetup/ProjectSetupSettings'

export interface ISettingsSectionProps {
    /**
     * Settings
     */
    settings: ProjectSetupSettings;

    /**
     * On setting change
     * 
     * @param {string} key Key
     * @param {string} bool Bool
     */
    onChange: (key: string, bool: boolean) => void;
}
