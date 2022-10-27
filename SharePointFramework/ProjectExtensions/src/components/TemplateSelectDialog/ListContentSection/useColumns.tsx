import { IColumn, Icon } from '@fluentui/react'
import { ListContentConfig } from 'models'
import strings from 'ProjectExtensionsStrings'
import React, { useContext } from 'react'
import { TemplateSelectDialogContext } from '../context'
import styles from './ListContentSection.module.scss'

/**
 * Columns hook for `ListContentSection`
 */
export function useColumns(): IColumn[] {
  const context = useContext(TemplateSelectDialogContext)
  return [
    {
      key: 'text',
      fieldName: 'text',
      name: strings.TitleLabel,
      minWidth: 150,
      maxWidth: 180,
      onRender: (lcc: ListContentConfig) => {
        const isLocked = lcc.isLocked(context.state.selectedTemplate)
        return (
          <div className={styles.titleColumn}>
            {isLocked && <Icon iconName='Lock' className={styles.lockIcon} />}
            <span>{lcc.text}</span>
          </div>
        )
      }
    },
    {
      key: 'subText',
      fieldName: 'subText',
      name: strings.DescriptionLabel,
      minWidth: 250
    }
  ]
}
