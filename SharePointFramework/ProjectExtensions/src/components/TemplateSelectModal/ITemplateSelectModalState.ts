import { ListContentConfig, ProjectTemplate } from '../../models';

export interface ITemplateSelectModalState {
    selectedTemplate: ProjectTemplate;
    selectedExtensions: ProjectTemplate[];
    selectedListConfig: ListContentConfig[];
    listContentHidden: boolean;
    extensionsHidden: boolean;
}
