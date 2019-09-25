import { ListContentConfig, ProjectTemplate } from '../../models/index';

export interface ITemplateSelectDialogState {    /**
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

    /**
     * @todo Describe property
     */
    includeStandardFolders?: boolean;

    /**
     * @todo Describe property
     */
    copyPlannerTasks?: boolean;
}
