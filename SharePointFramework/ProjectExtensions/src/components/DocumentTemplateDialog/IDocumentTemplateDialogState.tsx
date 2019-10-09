import { FileAddResult } from '@pnp/sp';
import { IProgressIndicatorProps } from 'office-ui-fabric-react/lib/ProgressIndicator';
import { TemplateFile } from '../../models/index';
import { DocumentTemplateDialogScreen } from './DocumentTemplateDialogScreen';

export interface IDocumentTemplateDialogState {

    /**
     * Is blocking
     */
    isBlocking: boolean;

    /**
     * Selection
     */
    selection: TemplateFile[];

    /**
     * Current screen
     */
    screen: DocumentTemplateDialogScreen;

    /**
     * Templates added
     */
    templatesAdded?: FileAddResult[];

    /**
     * Progress
     */
    progress?: IProgressIndicatorProps;
}
