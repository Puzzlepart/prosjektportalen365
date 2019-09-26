import { Folder } from '@pnp/sp';
import { IDocumentLibrary, TemplateFile } from '../../../models';

export interface IDocumentTemplateDialogScreenEditCopyProps {
    /**
     * @todo Describe property
     */
    selectedTemplates: TemplateFile[];

    /**
     * @todo Describe property
     */
    libraries: IDocumentLibrary[];

    /**
     * @todo Describe property
     */
    onStartCopy: (templates: TemplateFile[], selectedFolderServerRelativeUrl: string) => void;
}
