import { DisplayMode } from '@microsoft/sp-core-library'
import { DefaultButton, IButtonProps } from 'office-ui-fabric-react/lib/Button'
import * as strings from 'ProjectWebPartsStrings'
import React, { useContext } from 'react'
import { ProjectInformationContext } from '../context'
import styles from './Actions.module.scss'
import { IActionsProps, ActionType } from './types'

export const Actions = (props: IActionsProps) => {
  const context = useContext(ProjectInformationContext)
  const actions: ActionType[] = [
    [strings.ViewVersionHistoryText, context.state.data.versionHistoryUrl, 'History', false, !context.state.userHasAdminPermission],
    [strings.EditPropertiesText, context.state.data.editFormUrl, 'Edit', false, !context.state.userHasAdminPermission],
    [
      strings.EditSiteInformationText,
      window['_spLaunchSiteSettings'],
      'Info',
      false,
      !window['_spLaunchSiteSettings'] || !context.state.userHasAdminPermission
    ],
    ...(props.customActions || [])
  ]

  return (
    <div className={styles.actions} hidden={context.props.hideActions || context.props.displayMode === DisplayMode.Edit}>
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
