import { DefaultButton, IButtonProps } from 'office-ui-fabric-react/lib/Button'
import * as strings from 'ProjectWebPartsStrings'
import React from 'react'
import styles from './Actions.module.scss'
import { IActionsProps, ActionType } from './types'

export const Actions = (props: IActionsProps) => {
  const actions: ActionType[] = [
    [strings.ViewVersionHistoryText, props.versionHistoryUrl, 'History', false, !props.isSiteAdmin],
    [strings.EditPropertiesText, props.editFormUrl, 'Edit', false, !props.isSiteAdmin],
    [
      strings.SyncProjectPropertiesText,
      props.onSyncProperties,
      'Sync',
      false,
      !props.onSyncProperties || !props.isSiteAdmin
    ],
    [
      strings.EditSiteInformationText,
      window['_spLaunchSiteSettings'],
      'Info',
      !window['_spLaunchSiteSettings'] || !props.isSiteAdmin
    ],
    ...(props.customActions || [])
  ]

  return (
    <div className={styles.actions} hidden={props.hidden}>
      {actions.map(([text, hrefOrOnClick, iconName, disabled, hidden], idx) => {
        const buttonProps: IButtonProps = { text, iconProps: { iconName }, disabled }
        if (typeof hrefOrOnClick === 'string') buttonProps.href = hrefOrOnClick
        else buttonProps.onClick = hrefOrOnClick
        return (
          <div key={idx} hidden={hidden}>
            <DefaultButton {...buttonProps} className={styles.btn} />
          </div>
        )
      })}
    </div>
  )
}
