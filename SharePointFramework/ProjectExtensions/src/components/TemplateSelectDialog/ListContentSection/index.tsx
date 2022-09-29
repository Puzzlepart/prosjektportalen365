import { Toggle } from 'office-ui-fabric-react/lib/Toggle'
import { Icon } from 'office-ui-fabric-react/lib/Icon'
import { stringIsNullOrEmpty } from '@pnp/common'
import * as React from 'react'
import { ListContentConfig } from '../../../models'
import { IListContentSectionProps } from './types'
import styles from './ListContentSection.module.scss'
import { ScrollablePane } from 'office-ui-fabric-react'

export const ListContentSection: React.FunctionComponent<IListContentSectionProps> = (props) => {
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
    <div className={styles.listContentSection}>
      <ScrollablePane className={styles.container}>
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
      </ScrollablePane>
    </div>
  )
}
