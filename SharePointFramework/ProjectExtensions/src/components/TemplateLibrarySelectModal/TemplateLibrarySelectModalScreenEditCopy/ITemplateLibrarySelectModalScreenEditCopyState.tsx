import { TemplateFile } from "../../../models";

export interface ITemplateLibrarySelectModalScreenEditCopyState {
    templates: TemplateFile[];
    expandState: { [key: string]: boolean };
}
