import { TemplateFile, IDocumentLibrary } from "../../../models/";

export interface IDocumentTemplateModalScreenEditCopyState {
    templates: TemplateFile[];
    selectedLibrary: IDocumentLibrary;
    expandState: { [key: string]: boolean };
}
