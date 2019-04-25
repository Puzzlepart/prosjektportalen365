import { IModalProps } from 'office-ui-fabric-react/lib/Modal';
import { TemplateFile } from '../../models';

export interface ITemplateLibrarySelectModalProps extends IModalProps {
    title: string;
    templates: TemplateFile[];
    libraryServerRelativeUrl: string;
}
