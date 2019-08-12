import { FileAddResult } from '@pnp/sp';
import { IProgressIndicatorProps } from 'office-ui-fabric-react/lib/ProgressIndicator';
import { TemplateFile } from '../../models/index';
import { DocumentTemplateModalScreen } from './DocumentTemplateModalScreen';

export interface IDocumentTemplateModalState {
    isBlocking: boolean;
    selection: TemplateFile[];
    screen: DocumentTemplateModalScreen;
    templatesAdded?: FileAddResult[];
    progress?: IProgressIndicatorProps;
}
