import { IColumn, Selection } from 'office-ui-fabric-react/lib/DetailsList';
import * as ProjectExtensionsStrings from 'ProjectExtensionsStrings';
import { TemplateFile } from '../../../models';

export interface IDocumentTemplateDialogScreenSelectProps {
    /**
     * @todo Describe property
     */
    templates: TemplateFile[];

    /**
     * @todo Describe property
     */
    selection: Selection;

    /**
     * @todo Describe property
     */
    columns?: IColumn[];

    /**
     * @todo Describe property
     */
    selectedItems: any[];

    /**
     * @todo Describe property
     */
    templateLibrary: { title: string, url: string };
}

// tslint:disable-next-line: naming-convention
export const DocumentTemplateDialogScreenSelectDefaultProps: Partial<IDocumentTemplateDialogScreenSelectProps> = {
    columns: [
        {
            key: 'name',
            fieldName: 'name',
            name: ProjectExtensionsStrings.NameLabel,
            minWidth: 200,
        },
        {
            key: 'title',
            fieldName: 'title',
            name: ProjectExtensionsStrings.TitleLabel,
            minWidth: 150,
        },
        {
            key: 'modified',
            fieldName: 'modified',
            name: ProjectExtensionsStrings.ModifiedLabel,
            minWidth: 150,
        }
    ],
};