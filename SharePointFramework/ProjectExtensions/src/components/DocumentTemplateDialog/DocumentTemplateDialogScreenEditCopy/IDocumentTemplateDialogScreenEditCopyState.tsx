import { TemplateFile, IDocumentLibrary } from '../../../models/index';

export interface IDocumentTemplateDialogScreenEditCopyState {
    /**
     * @todo Describe property
     */
    templates: TemplateFile[];

    /**
     * @todo Describe property
     */
    selectedLibrary: IDocumentLibrary;

    /**
     * @todo Describe property
     */
    expandState: { [key: string]: boolean };
}
