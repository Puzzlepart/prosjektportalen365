import { IColumn, Modal, DetailsList, SelectionMode } from '@fluentui/react'
import { get, isEmpty } from '@microsoft/sp-lodash-subset'
import * as strings from 'PortfolioWebPartsStrings'
import React, { PureComponent } from 'react'
import { columns } from './columns'
import { IItemModalProps, IItemModalState } from './types'
import styles from './ItemModal.module.scss'

export default class ItemModal extends PureComponent<IItemModalProps, IItemModalState> {
  public static defaultProps: Partial<IItemModalProps> = {
    columns
  }

  constructor(props: IItemModalProps) {
    super(props)
    this.state = {}
  }

  public render(): React.ReactElement<IItemModalProps> {
    if (isEmpty(this.props.value)) return null

    return (
      <div>
        <a href='#' onClick={this._onOpenModal.bind(this)}>
          {strings.ShowAllMeasurementsLinkText}
        </a>
        <Modal
          isOpen={this.state.isOpen}
          isDarkOverlay={true}
          containerClassName={styles.itemModal}
          onDismiss={this._onCloseModal.bind(this)}
          isBlocking={false}
        >
          <div className={styles.header}>
            <div className={styles.title}>{this.props.title}</div>
          </div>
          <DetailsList
            items={this.props.value}
            columns={this.props.columns}
            onRenderItemColumn={this._onRenderItemColumn}
            selectionMode={SelectionMode.none}
          />
        </Modal>
      </div>
    )
  }

  private _onOpenModal() {
    this.setState({ isOpen: true })
  }

  private _onCloseModal() {
    this.setState({ isOpen: false })
  }

  private _onRenderItemColumn = (item: any, index: number, column: IColumn) => {
    const fieldNameDisplay: string = get(column, 'data.fieldNameDisplay')
    return column.onRender
      ? column.onRender(item, index, column)
      : get(item, fieldNameDisplay || column.fieldName)
  }
}
