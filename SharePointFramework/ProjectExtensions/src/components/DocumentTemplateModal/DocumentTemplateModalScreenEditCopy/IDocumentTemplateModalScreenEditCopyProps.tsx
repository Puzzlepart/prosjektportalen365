import { TemplateFile, IDocumentLibrary } from '../../../models';

export interface IDocumentTemplateModalScreenEditCopyProps {
    selectedTemplates: TemplateFile[];
    libraries: IDocumentLibrary[];
    onStartCopy: (templates: TemplateFile[], serverRelativeUrl: string) => void;
    onGoBack: () => void;
}
