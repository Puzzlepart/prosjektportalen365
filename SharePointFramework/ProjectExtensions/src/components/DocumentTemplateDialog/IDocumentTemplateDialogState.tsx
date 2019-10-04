import { FileAddResult } from '@pnp/sp';
import { IProgressIndicatorProps } from 'office-ui-fabric-react/lib/ProgressIndicator';
import { TemplateFile } from '../../models/index';
import { DocumentTemplateDialogScreen } from './DocumentTemplateDialogScreen';

export interface IDocumentTemplateDialogState {

    /**
     * @todo Describe property
     */
    isBlocking: boolean;

    /**
     * @todo Describe property
     */
    selection: TemplateFile[];

    /**
     * @todo Describe property
     */
    screen: DocumentTemplateDialogScreen;

    /**
     * @todo Describe property
     */
    templatesAdded?: FileAddResult[];

    /**
     * @todo Describe property
     */
    progress?: IProgressIndicatorProps;
}
