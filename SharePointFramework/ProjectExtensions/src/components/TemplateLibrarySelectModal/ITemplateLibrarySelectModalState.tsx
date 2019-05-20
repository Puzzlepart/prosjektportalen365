import { FileAddResult } from '@pnp/sp';
import { IProgressIndicatorProps } from 'office-ui-fabric-react/lib/ProgressIndicator';
import { TemplateFile } from '../../models';
import { TemplateLibrarySelectModalScreen } from './TemplateLibrarySelectModalScreen';

export interface ITemplateLibrarySelectModalState {
    isBlocking: boolean;
    selection: TemplateFile[];
    screen: TemplateLibrarySelectModalScreen;
    templatesAdded?: FileAddResult[];
    progress?: IProgressIndicatorProps;
}
