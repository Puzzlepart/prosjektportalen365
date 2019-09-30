import { ListContentConfig, ProjectTemplate } from '../../models/index';
import { ISettings } from './SettingsSection/ISettingsSectionProps';

export interface ITemplateSelectDialogState extends ISettings {    /**
     * @todo Describe property
     */
    selectedTemplate?: ProjectTemplate;

    /**
     * @todo Describe property
     */
    selectedExtensions?: ProjectTemplate[];

    /**
     * @todo Describe property
     */
    selectedListConfig?: ListContentConfig[];
}
