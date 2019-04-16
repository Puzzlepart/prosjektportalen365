import { ListContentConfig, ProjectTemplate } from '../../models';

export interface ITemplateSelectModalState {
    selectedTemplate?: ProjectTemplate;
    selectedExtensions?: ProjectTemplate[];
    selectedListConfig?: ListContentConfig[];
    includeStandardFolders?: boolean;
    copyPlannerTasks?: boolean;
}
