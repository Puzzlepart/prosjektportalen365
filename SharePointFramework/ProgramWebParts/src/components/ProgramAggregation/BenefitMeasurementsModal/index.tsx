import { get, isEmpty } from '@microsoft/sp-lodash-subset'
import { DetailsList, IColumn, SelectionMode } from 'office-ui-fabric-react/lib/DetailsList'
import { Modal } from 'office-ui-fabric-react/lib/Modal'
import strings from 'ProgramWebPartsStrings'
import React, { PureComponent } from 'react'
import { columns } from './columns'
import styles from './BenefitMeasurementsModal.module.scss'
import { IItemModalProps, IItemModalState } from './types'

export default class BenefitMeasurementsModal extends PureComponent<IItemModalProps, IItemModalState> {
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
          containerClassName={styles.root}
          onDismiss={this._onCloseModal.bind(this)}
          isBlocking={false}>
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
