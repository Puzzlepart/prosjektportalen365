import { Icon, Toggle } from '@fluentui/react'
import { stringIsNullOrEmpty } from '@pnp/common'
import React, { FC, useContext } from 'react'
import { ListContentConfig } from '../../../models'
import { TemplateSelectDialogContext } from '../context'
import styles from './ListContentSection.module.scss'

export const ListContentSection: FC = () => {
  const context = useContext(TemplateSelectDialogContext)

  /**
   * On item toggle
   *
   * @param listContentConfig List content config
   * @param checked Checked
   */
  function onChanged(listContentConfig: ListContentConfig, checked: boolean): void {
    let selectedListContentConfig = []
    if (checked) {
      selectedListContentConfig = [listContentConfig, ...context.state.selectedListContentConfig]
    } else {
      selectedListContentConfig = context.state.selectedListContentConfig.filter(
        (lcc) => listContentConfig.text !== lcc.text
      )
    }
    context.setState({ selectedListContentConfig })
  }

  const selectedKeys = context.state.selectedListContentConfig.map((lc) => lc.key)

  return (
    <div className={styles.root}>
      {context.props.data.listContentConfig
        .filter((lcc) => !lcc.hidden)
        .map((lcc) => (
          <div key={lcc.key} className={styles.item}>
            <div className={styles.toggle}>
              <Toggle
                label={lcc.text}
                defaultChecked={selectedKeys.indexOf(lcc.key) !== -1}
                disabled={
                  context.state.selectedTemplate?.isDefaultListContentLocked && lcc.isDefault
                }
                inlineLabel={true}
                onChanged={(checked) => onChanged(lcc, checked)}
              />
              {context.state.selectedTemplate?.isDefaultListContentLocked && lcc.isDefault && (
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
