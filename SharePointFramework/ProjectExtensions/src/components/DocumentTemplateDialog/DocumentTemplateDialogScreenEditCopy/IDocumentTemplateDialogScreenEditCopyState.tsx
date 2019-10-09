import { TemplateFile } from '../../../models';

export interface IDocumentTemplateDialogScreenEditCopyState {
    /**
     * Templates
     */
    templates: TemplateFile[];

    /**
     * Selected folder server relative URL
     */
    selectedFolderServerRelativeUrl: string;
}
