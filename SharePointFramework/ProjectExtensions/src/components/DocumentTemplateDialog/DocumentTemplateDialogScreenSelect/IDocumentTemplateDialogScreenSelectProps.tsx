import { getId } from '@uifabric/utilities';
import { IColumn, Selection } from 'office-ui-fabric-react/lib/DetailsList';
import * as ProjectExtensionsStrings from 'ProjectExtensionsStrings';
import { TemplateFile } from '../../../models';

export interface IDocumentTemplateDialogScreenSelectProps {
    /**
     * Templates
     */
    templates: TemplateFile[];

    /**
     * Selection
     */
    selection: Selection;

    /**
     * Columns
     */
    columns?: IColumn[];

    /**
     * Selected items
     */
    selectedItems: any[];

    /**
     * Template library
     */
    templateLibrary: { title: string, url: string };
}

// tslint:disable-next-line: naming-convention
export const DocumentTemplateDialogScreenSelectDefaultProps: Partial<IDocumentTemplateDialogScreenSelectProps> = {
    columns: [
        {
            key: getId('name'),
            fieldName: 'name',
            name: ProjectExtensionsStrings.NameLabel,
            minWidth: 200,
        },
        {
            key: getId('phase'),
            fieldName: 'phase',
            name: ProjectExtensionsStrings.PhaseLabel,
            minWidth: 100,
        },
        {
            key: getId('modified'),
            fieldName: 'modified',
            name: ProjectExtensionsStrings.ModifiedLabel,
            minWidth: 150,
        }
    ],
};