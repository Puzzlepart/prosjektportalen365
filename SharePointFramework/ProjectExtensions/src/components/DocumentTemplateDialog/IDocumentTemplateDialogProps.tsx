import { TemplateFile, IDocumentLibrary } from '../../models';
import { IDocumentTemplateDialogDismissProps } from './IDocumentTemplateDialogDismissProps';

export interface IDocumentTemplateDialogProps {
    /**
     * Title
     */
    title: string;

    /**
     * Templates
     */
    templates: TemplateFile[];

    /**
     * Libraries
     */
    libraries: IDocumentLibrary[];

    /**
     * Template library
     */
    templateLibrary: { title: string, url: string };

    /**
     * On dismiss callback
     */
    onDismiss: (props: IDocumentTemplateDialogDismissProps) => void;
}
