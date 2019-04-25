import { Selection } from 'office-ui-fabric-react/lib/DetailsList';
import { TemplateFile } from '../../../models';

export interface ITemplateLibrarySelectModalScreenSelectProps {
    templates: TemplateFile[];
    selection: Selection;
    selectedItems: any[];
    onSubmitSelection: () => void;
}
