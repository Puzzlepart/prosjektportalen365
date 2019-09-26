import { TemplateFile, IDocumentLibrary } from '../../models/index';
import { IBaseDialogProps } from '../@BaseDialog/IBaseDialogProps';

export interface IDocumentTemplateDialogProps extends IBaseDialogProps {
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
}
