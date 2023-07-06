import { DetailsList, IColumn, Link, Modal, SelectionMode } from '@fluentui/react'
import { getObjectValue as get } from 'pp365-shared-library'
import React, { FC, useState } from 'react'
import styles from './ItemModal.module.scss'
import { columns } from './columns'
import { IModalColumnProps } from './types'
import strings from 'PortfolioWebPartsStrings'
import { useInfoText } from './useInfoText'
import { stringIsNullOrEmpty } from '@pnp/common'

export const ModalColumn: FC<IModalColumnProps> = (props) => {
  const [isOpen, setIsOpen] = useState(false)
  const infoText = useInfoText(props)

  const onRenderItemColumn = (item: any, index: number, column: IColumn) => {
    const fieldNameDisplay: string = get(column, 'data.fieldNameDisplay', null)
    return column.onRender
      ? column.onRender(item, index, column)
      : get(item, fieldNameDisplay ?? column.fieldName, null)
  }

  return (
    <div>
      <Link onClick={() => setIsOpen(true)}>{props.linkText}</Link>
      <Modal
        isOpen={isOpen}
        isDarkOverlay={props.isDarkOverlay}
        isBlocking={props.isBlocking}
        containerClassName={styles.root}
        onDismiss={() => setIsOpen(false)}
      >
        <div className={styles.header} hidden={stringIsNullOrEmpty(props.header?.title)}>
          <div className={styles.title}>{props.header?.title}</div>
          <div className={styles.subTitle}>{props.header?.subTitle}</div>
        </div>
        {infoText && <p className={styles.infoText}>{infoText}</p>}
        <DetailsList
          items={props.items}
          columns={props.columns}
          onRenderItemColumn={onRenderItemColumn}
          selectionMode={props.selectionMode}
        />
      </Modal>
    </div>
  )
}

ModalColumn.defaultProps = {
  linkText: strings.ShowAllMeasurementsLinkText,
  isDarkOverlay: true,
  isBlocking: false,
  columns,
  selectionMode: SelectionMode.none,
  infoTextTemplate: strings.ShowAllMeasurementsInfoTextFormat
}
