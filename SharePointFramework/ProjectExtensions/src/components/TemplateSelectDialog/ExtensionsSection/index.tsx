import { Icon, Toggle } from '@fluentui/react'
import { stringIsNullOrEmpty } from '@pnp/common'
import React, { FC, useContext } from 'react'
import { ProjectExtension } from '../../../models'
import { TemplateSelectDialogContext } from '../context'
import styles from './ExtensionsSection.module.scss'

export const ExtensionsSection: FC = () => {
  const context = useContext(TemplateSelectDialogContext)

  /**
   * On item toggle
   *
   * @param extension Extension
   * @param checked Checked
   */
  function onChange(extension: ProjectExtension, checked: boolean): void {
    let selectedExtensions = []
    if (checked) selectedExtensions = [extension, ...context.state.selectedExtensions]
    else
      selectedExtensions = context.state.selectedExtensions.filter(
        (ext) => extension.text !== ext.text
      )
    context.setState({ selectedExtensions })
  }

  const selectedKeys = context.state.selectedExtensions.map((ext) => ext.key)

  return (
    <div className={styles.root}>
      {context.props.data.extensions.map((ext) => (
        <div key={ext.key} className={styles.item}>
          <div className={styles.toggle}>
            <Toggle
              label={ext.text}
              defaultChecked={selectedKeys.indexOf(ext.key) !== -1}
              disabled={context.state.selectedTemplate?.isDefaultExtensionsLocked && ext.isDefault}
              inlineLabel={true}
              onChange={(_event, checked) => onChange(ext, checked)}
            />
            {context.state.selectedTemplate?.isDefaultExtensionsLocked && ext.isDefault && (
              <Icon iconName='Lock' className={styles.icon} />
            )}
          </div>
          <div className={styles.subText} hidden={stringIsNullOrEmpty(ext.subText)}>
            <span>{ext.subText}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
