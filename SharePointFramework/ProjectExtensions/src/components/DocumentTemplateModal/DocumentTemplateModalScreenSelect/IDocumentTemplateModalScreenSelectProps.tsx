import { Selection } from 'office-ui-fabric-react/lib/DetailsList';
import { TemplateFile } from '../../../models/index';

export interface IDocumentTemplateModalScreenSelectProps {
    templates: TemplateFile[];
    selection: Selection;
    selectedItems: any[];
    onSubmitSelection: () => void;
}
