import { ListContentConfig, ProjectTemplate } from "../../models";
import { IHubSite } from 'sp-hubsite-service';

export default interface IProjectSetupApplicationCustomizerData {
    templates?: ProjectTemplate[];
    extensions?: ProjectTemplate[];
    listContentConfig?: ListContentConfig[];
    selectedTemplate?: ProjectTemplate;
    selectedExtensions?: ProjectTemplate[];
    selectedListConfig?: ListContentConfig[];
    hub?: IHubSite;
}