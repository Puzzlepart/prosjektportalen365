import { stringIsNullOrEmpty } from '@pnp/common'
import { Toggle } from 'office-ui-fabric-react/lib/Toggle'
import * as React from 'react'
import { ISettingsSectionProps } from './ISettingsSectionProps'
import styles from './SettingsSection.module.scss'
import { getId } from '@uifabric/utilities'

export const SettingsSection = (props: ISettingsSectionProps) => {
  function onChange(event: React.MouseEvent<HTMLElement, MouseEvent>, checked?: boolean) {
    props.onChange((event.currentTarget as HTMLElement).id, checked)
  }

  return (
    <div className={styles.settingsSection}>
      <div className={styles.container}>
        {props.settings.keys.map((key) => {
          const toggleProps = props.settings.getToggleProps(key)
          return (
            <div id={getId(key)} key={getId(key)} className={styles.item}>
              <Toggle {...toggleProps} inlineLabel={true} onChange={onChange} />
              <div className={styles.description} hidden={stringIsNullOrEmpty(toggleProps.title)}>
                <span>{toggleProps.title}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export * from './ISettingsSectionProps'
