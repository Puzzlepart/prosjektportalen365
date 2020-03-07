import { IDocumentLibrary, TemplateFile } from '../../../models';
import { DocumentTemplateDialogScreen } from '../DocumentTemplateDialogScreen';

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

    /**
     * On change screen
     */
    onChangeScreen: (screen: DocumentTemplateDialogScreen) => void;
}
