import { DetailsList, DetailsListLayoutMode, ConstrainMode, SelectionMode } from 'office-ui-fabric-react/lib/DetailsList';
import { MarqueeSelection } from 'office-ui-fabric-react/lib/MarqueeSelection';
import * as React from 'react';
import { IDocumentTemplateDialogScreenSelectProps, DocumentTemplateDialogScreenSelectDefaultProps } from './IDocumentTemplateDialogScreenSelectProps';

export class DocumentTemplateDialogScreenSelect extends React.Component<IDocumentTemplateDialogScreenSelectProps, {}> {
    public static defaultProps = DocumentTemplateDialogScreenSelectDefaultProps;

    public render(): React.ReactElement<IDocumentTemplateDialogScreenSelectProps> {
        return (
            <MarqueeSelection selection={this.props.selection}>
                <DetailsList
                    items={this.props.templates}
                    columns={this.props.columns}
                    selection={this.props.selection}
                    selectionMode={SelectionMode.multiple}
                    layoutMode={DetailsListLayoutMode.justified}
                    constrainMode={ConstrainMode.unconstrained} />
            </MarqueeSelection>
        );
    }
}
