import { ListContentConfig, ProjectTemplate } from '../../models/index';
import { IHubSite } from 'sp-hubsite-service';
import { ITemplateSelectDialogState } from '../../components/TemplateSelectDialog/ITemplateSelectDialogState';

export interface IProjectSetupData extends ITemplateSelectDialogState {
    /**
     * Templates
     */
    templates?: ProjectTemplate[];

    /**
     * Extensions
     */
    extensions?: ProjectTemplate[];

    /**
     * List content config
     */
    listContentConfig?: ListContentConfig[];

    /**
     * Hub site
     */
    hub?: IHubSite;
}