import {
  ConstrainMode,
  DetailsList,
  DetailsListLayoutMode,
  SelectionMode
} from 'office-ui-fabric-react/lib/DetailsList'
import { MarqueeSelection } from 'office-ui-fabric-react/lib/MarqueeSelection'
import { format } from 'office-ui-fabric-react/lib/Utilities'
import * as strings from 'ProjectExtensionsStrings'
import React, { Component, ReactElement } from 'react'
import { InfoMessage } from '../../InfoMessage'
import {
  DocumentTemplateDialogScreenSelectDefaultProps,
  IDocumentTemplateDialogScreenSelectProps
} from './types'

export class DocumentTemplateDialogScreenSelect extends Component<
  IDocumentTemplateDialogScreenSelectProps,
  {}
  > {
  public static defaultProps = DocumentTemplateDialogScreenSelectDefaultProps

  public render(): ReactElement<IDocumentTemplateDialogScreenSelectProps> {
    return (
      <>
        <InfoMessage
          text={format(
            strings.DocumentTemplateDialogScreenSelectInfoText,
            this.props.templateLibrary.url,
            this.props.templateLibrary.title
          )}
        />
        <MarqueeSelection selection={this.props.selection}>
          <DetailsList
            items={this.props.templates}
            columns={this.props.columns}
            selection={this.props.selection}
            selectionMode={SelectionMode.multiple}
            layoutMode={DetailsListLayoutMode.justified}
            constrainMode={ConstrainMode.horizontalConstrained}
          />
        </MarqueeSelection>
      </>
    )
  }
}
