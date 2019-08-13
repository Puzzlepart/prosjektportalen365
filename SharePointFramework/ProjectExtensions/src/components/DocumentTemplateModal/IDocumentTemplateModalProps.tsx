import { IModalProps } from 'office-ui-fabric-react/lib/Modal';
import { TemplateFile, IDocumentLibrary } from '../../models/index';

export interface IDocumentTemplateModalProps extends IModalProps {
    title: string;
    templates: TemplateFile[];
    libraries: IDocumentLibrary[];
}
