import { Icon, Toggle } from '@fluentui/react'
import { stringIsNullOrEmpty } from '@pnp/common'
import React, { FunctionComponent } from 'react'
import { ListContentConfig } from '../../../models'
import styles from './ListContentSection.module.scss'
import { IListContentSectionProps } from './types'

export const ListContentSection: FunctionComponent<IListContentSectionProps> = (props) => {
  /**
   * On item toggle
   *
   * @param listContentConfig List content config
   * @param checked Checked
   */
  const onChanged = (listContentConfig: ListContentConfig, checked: boolean): void => {
    let selectedListContentConfig = []
    if (checked) {
      selectedListContentConfig = [listContentConfig, ...props.selectedListContentConfig]
    } else {
      selectedListContentConfig = props.selectedListContentConfig.filter(
        (lcc) => listContentConfig.text !== lcc.text
      )
    }
    props.onChange(selectedListContentConfig)
  }

  const selectedKeys = props.selectedListContentConfig.map((lc) => lc.key)

  return (
    <div className={styles.root}>
      {props.listContentConfig
        .filter((lcc) => !lcc.hidden)
        .map((lcc) => (
          <div key={lcc.key} className={styles.item}>
            <div className={styles.toggle}>
              <Toggle
                label={lcc.text}
                defaultChecked={selectedKeys.indexOf(lcc.key) !== -1}
                disabled={props.lockDefault && lcc.isDefault}
                inlineLabel={true}
                onChanged={(checked) => onChanged(lcc, checked)}
              />
              {props.lockDefault && lcc.isDefault && (
                <Icon iconName={'Lock'} className={styles.icon} />
              )}
            </div>
            <div className={styles.subText} hidden={stringIsNullOrEmpty(lcc.subText)}>
              <span>{lcc.subText}</span>
            </div>
          </div>
        ))}
    </div>
  )
}
