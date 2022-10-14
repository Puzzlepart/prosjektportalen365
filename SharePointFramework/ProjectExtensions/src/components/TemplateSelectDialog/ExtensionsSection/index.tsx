import { Icon, Toggle } from '@fluentui/react'
import { stringIsNullOrEmpty } from '@pnp/common'
import React, { FunctionComponent } from 'react'
import { ProjectExtension } from '../../../models'
import styles from './ExtensionsSection.module.scss'
import { IExtensionsSectionProps } from './types'

export const ExtensionsSection: FunctionComponent<IExtensionsSectionProps> = (props) => {
  /**
   * On item toggle
   *
   * @param extension Extension
   * @param checked Checked
   */
  const onChange = (extension: ProjectExtension, checked: boolean): void => {
    let selectedExtensions = []
    if (checked) selectedExtensions = [extension, ...props.selectedExtensions]
    else selectedExtensions = props.selectedExtensions.filter((ext) => extension.text !== ext.text)
    props.onChange(selectedExtensions)
  }

  const selectedKeys = props.selectedExtensions.map((ext) => ext.key)

  return (
    <div className={styles.root}>
      {props.extensions.map((ext) => (
        <div key={ext.key} className={styles.item}>
          <div className={styles.toggle}>
            <Toggle
              label={ext.text}
              defaultChecked={selectedKeys.indexOf(ext.key) !== -1}
              disabled={props.lockDefault && ext.isDefault}
              inlineLabel={true}
              onChange={(_event, checked) => onChange(ext, checked)}
            />
            {props.lockDefault && ext.isDefault && <Icon iconName='Lock' className={styles.icon} />}
          </div>
          <div className={styles.subText} hidden={stringIsNullOrEmpty(ext.subText)}>
            <span>{ext.subText}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
