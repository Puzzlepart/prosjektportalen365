import { get, isEmpty } from '@microsoft/sp-lodash-subset'
import { DetailsList, IColumn, SelectionMode } from 'office-ui-fabric-react/lib/DetailsList'
import { Modal } from 'office-ui-fabric-react/lib/Modal'
import strings from 'ProgramWebPartsStrings'
import React, { FunctionComponent, useState } from 'react'
import styles from './BenefitMeasurementsModal.module.scss'
import { columns } from './columns'
import { IItemModalProps } from './types'

export const BenefitMeasurementsModal: FunctionComponent<IItemModalProps> = (props) => {
  const [isOpen, setIsOpen] = useState(false)

  const onRenderItemColumn = (item: any, index: number, column: IColumn) => {
    const fieldNameDisplay: string = get(column, 'data.fieldNameDisplay')
    return column.onRender
      ? column.onRender(item, index, column)
      : get(item, fieldNameDisplay || column.fieldName)
  }

  if (isEmpty(props.value)) return null

  return (
    <div>
      <a href='#' onClick={() => setIsOpen(true)}>
        {strings.ShowAllMeasurementsLinkText}
      </a>
      <Modal
        isOpen={isOpen}
        isDarkOverlay={true}
        containerClassName={styles.root}
        onDismiss={() => setIsOpen(false)}
        isBlocking={false}>
        <div className={styles.header}>
          <div className={styles.title}>{props.title}</div>
        </div>
        <DetailsList
          items={props.value}
          columns={props.columns}
          onRenderItemColumn={onRenderItemColumn}
          selectionMode={SelectionMode.none}
        />
      </Modal>
    </div>
  )
}

BenefitMeasurementsModal.defaultProps = {
  columns
}
