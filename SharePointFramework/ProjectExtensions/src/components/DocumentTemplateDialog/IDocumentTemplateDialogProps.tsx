import { TemplateFile, IDocumentLibrary } from '../../models';
import { IDocumentTemplateDialogDismissProps } from './IDocumentTemplateDialogDismissProps';

export interface IDocumentTemplateDialogProps {
    /**
     * @todo Describe property
     */
    title: string;

    /**
     * @todo Describe property
     */
    templates: TemplateFile[];

    /**
     * @todo Describe property
     */
    libraries: IDocumentLibrary[];

    /**
     * @todo Describe property
     */
    templateLibrary: { title: string, url: string };

    /**
     * @todo Describe property
     */
    onDismiss: (props: IDocumentTemplateDialogDismissProps) => void;
}
