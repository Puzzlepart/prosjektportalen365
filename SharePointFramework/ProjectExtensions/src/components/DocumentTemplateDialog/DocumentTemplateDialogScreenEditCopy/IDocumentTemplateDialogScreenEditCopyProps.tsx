import { IDocumentLibrary, TemplateFile } from '../../../models';

export interface IDocumentTemplateDialogScreenEditCopyProps {
    /**
     * Selected templates
     */
    selectedTemplates: TemplateFile[];

    /**
     * Libraries
     */
    libraries: IDocumentLibrary[];

    /**
     * On start copy callback
     */
    onStartCopy: (templates: TemplateFile[], selectedFolderServerRelativeUrl: string) => void;
}
