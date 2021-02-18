import React, { PureComponent } from 'react'
import * as strings from 'PortfolioWebPartsStrings'
import styles from './BenefitMeasurementsModal.module.scss'
import { Modal, IModalProps } from 'office-ui-fabric-react/lib/Modal'
import { DetailsList, IColumn, SelectionMode } from 'office-ui-fabric-react/lib/DetailsList'
import { BENEFIT_MEASUREMENTS_MODAL_COLUMNS } from './BenefitMeasurementsModalColumns'
import { BenefitMeasurementIndicator, BenefitMeasurement } from 'models'
import { get } from '@microsoft/sp-lodash-subset'

export interface IBenefitMeasurementsModalProps extends IModalProps {
  indicator: BenefitMeasurementIndicator
  columns?: IColumn[]
}

export interface IBenefitMeasurementsModalState {
  isOpen?: boolean
}

export default class BenefitMeasurementsModal extends PureComponent<
  IBenefitMeasurementsModalProps,
  IBenefitMeasurementsModalState
> {
  public static defaultProps: Partial<IBenefitMeasurementsModalProps> = {
    columns: BENEFIT_MEASUREMENTS_MODAL_COLUMNS
  }

  constructor(props: IBenefitMeasurementsModalProps) {
    super(props)
    this.state = {}
  }

  public render(): React.ReactElement<IBenefitMeasurementsModalProps> {
    if (this.props.indicator.Measurements.length === 0) {
      return null
    }
    return (
      <div>
        <a href='#' onClick={this._onOpenModal.bind(this)}>
          {strings.ShowAllMeasurementsLinkText}
        </a>
        <Modal
          isOpen={this.state.isOpen}
          isDarkOverlay={true}
          containerClassName={styles.benefitMeasurementsModal}
          onDismiss={this._onCloseModal.bind(this)}
          isBlocking={false}>
          <div className={styles.header}>
            <div className={styles.title}>{this.props.indicator.Title}</div>
          </div>
          <DetailsList
            items={this.props.indicator.Measurements}
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

  private _onRenderItemColumn = (item: BenefitMeasurement, index: number, column: IColumn) => {
    const fieldNameDisplay: string = get(column, 'data.fieldNameDisplay')
    return column.onRender
      ? column.onRender(item, index, column)
      : get(item, fieldNameDisplay || column.fieldName)
  }
}
