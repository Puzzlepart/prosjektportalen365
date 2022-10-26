import { IColumn, Icon } from '@fluentui/react'
import strings from 'ProjectExtensionsStrings'
import React, { useContext } from 'react'
import { TemplateSelectDialogContext } from '../context'
import styles from './ExtensionsSection.module.scss'

/**
 * Columns hook for `ExtensionsSection`
 */
export function useColumns(): IColumn[] {
    const context = useContext(TemplateSelectDialogContext)
    return [
        {
            key: 'text',
            fieldName: 'text',
            name: strings.TitleLabel,
            minWidth: 150,
            maxWidth: 150,
            onRender: (item) => {
                const isLocked =
                    context.state.selectedTemplate?.isDefaultExtensionsLocked &&
                    context.state.selectedTemplate?.extensionIds.includes(item.id)
                return (
                    <div className={styles.titleColumn}>
                        {isLocked && <Icon iconName='Lock' className={styles.lockIcon} />}
                        <span>{item.text}</span>
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