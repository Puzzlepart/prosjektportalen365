import { TemplateFile, IDocumentLibrary } from '../../../models';

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
    onStartCopy: (templates: TemplateFile[], serverRelativeUrl: string) => void;
}
