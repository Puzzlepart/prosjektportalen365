import { ListContentConfig, ProjectTemplate } from '../../models';
import { IHubSite } from 'sp-hubsite-service';
import { ITemplateSelectDialogState } from '../../components/TemplateSelectDialog/ITemplateSelectDialogState';

export default interface IProjectSetupApplicationCustomizerData extends ITemplateSelectDialogState {
    /**
     * @todo Describe property
     */
    templates?: ProjectTemplate[];

    /**
     * @todo Describe property
     */
    extensions?: ProjectTemplate[];

    /**
     * @todo Describe property
     */
    listContentConfig?: ListContentConfig[];

    /**
     * @todo Describe property
     */
    hub?: IHubSite;
}