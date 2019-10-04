import { ListContentConfig, ProjectTemplate, ProjectExtension } from '../../models/index';
import { ProjectSetupSettings } from '../../extensions/projectSetup/ProjectSetupSettings';

export interface ITemplateSelectDialogState {
    /**
     * Currently selected project templates
     */
    selectedTemplate?: ProjectTemplate;

    /**
     * Currently selected extensions
     */
    selectedExtensions?: ProjectExtension[];

    /**
     * Currently selected list content config
     */
    selectedListContentConfig?: ListContentConfig[];

    /**
     * Settings
     */
    settings?: ProjectSetupSettings;
}
