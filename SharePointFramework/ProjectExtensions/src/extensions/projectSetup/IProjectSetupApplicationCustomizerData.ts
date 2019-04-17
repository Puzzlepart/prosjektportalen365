import { ListContentConfig, ProjectTemplate } from "../../models";
import { IHubSite } from 'sp-hubsite-service';
import { ITemplateSelectModalState } from "../../components/TemplateSelectModal/ITemplateSelectModalState";

export default interface IProjectSetupApplicationCustomizerData extends ITemplateSelectModalState {
    templates?: ProjectTemplate[];
    extensions?: ProjectTemplate[];
    listContentConfig?: ListContentConfig[];
    hub?: IHubSite;
}