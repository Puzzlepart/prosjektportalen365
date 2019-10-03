import { ListContentConfig, ProjectTemplate } from '../../models/index';
import { ISettings } from './SettingsSection/ISettingsSectionProps';

export interface ITemplateSelectDialogState {
    /**
     * Currently selected project templates
     */
    selectedTemplate?: ProjectTemplate;

    /**
     * Currently selected extensions
     */
    selectedExtensions?: ProjectTemplate[];

    /**
     * Currently selected list content config
     */
    selectedListContentConfig?: ListContentConfig[];

    /**
     * Settings
     */
    settings?: ISettings;
}
