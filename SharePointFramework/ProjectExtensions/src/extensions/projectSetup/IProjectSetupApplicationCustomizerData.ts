import { ListContentConfig, ProjectTemplate } from '../../models';
import { IHubSite } from 'sp-hubsite-service';
import { ITemplateSelectDialogState } from '../../components/TemplateSelectDialog/ITemplateSelectDialogState';

export default interface IProjectSetupApplicationCustomizerData extends ITemplateSelectDialogState {
    templates?: ProjectTemplate[];
    extensions?: ProjectTemplate[];
    listContentConfig?: ListContentConfig[];
    hub?: IHubSite;
}