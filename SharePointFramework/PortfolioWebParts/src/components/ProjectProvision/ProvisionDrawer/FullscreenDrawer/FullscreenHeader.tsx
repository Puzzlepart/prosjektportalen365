import React, { FC, useContext } from 'react'
import { ToolbarGroup, ToolbarButton, Toolbar } from '@fluentui/react-components'
import strings from 'PortfolioWebPartsStrings'
import { getFluentIcon } from 'pp365-shared-library'
import { ProjectProvisionContext } from '../../context'
import styles from './FullscreenDrawer.module.scss'

export interface IFullscreenHeaderProps {
  onBack?: () => void
  showBack?: boolean
  onClose?: () => void
  onViewRequests?: () => void
  onViewSettings?: () => void
}

export const FullscreenHeader: FC<IFullscreenHeaderProps> = ({
  onBack,
  showBack,
  onClose,
  onViewRequests,
  onViewSettings
}) => {
  const context = useContext(ProjectProvisionContext)

  return (
    <div className={styles.header}>
      <Toolbar className={styles.headerToolbar}>
        <ToolbarGroup>
          {showBack && (
            <ToolbarButton
              appearance='subtle'
              icon={getFluentIcon('ArrowLeft', { color: 'white' })}
              onClick={onBack}
              className={styles.headerButton}
            />
          )}
          <span className={styles.headerTitle}>
            {getFluentIcon('BotSparkle', { filled: true, size: '24px', color: 'white' })}
            <span>{strings.Provision.FullscreenHeaderTitle ?? strings.Provision.WebPartDescription}</span>
          </span>
        </ToolbarGroup>
        <ToolbarGroup>
          {onViewRequests && (
            <ToolbarButton
              appearance='subtle'
              icon={getFluentIcon('ClipboardTask', { color: 'white' })}
              onClick={onViewRequests}
              className={styles.headerButton}
            >
              <span className={styles.headerButtonText}>{strings.Provision.ViewRequestsButton}</span>
            </ToolbarButton>
          )}
          {context.state.isProvisionSiteAdmin && onViewSettings && (
            <ToolbarButton
              appearance='subtle'
              icon={getFluentIcon('Settings', { color: 'white' })}
              onClick={onViewSettings}
              className={styles.headerButton}
            >
              <span className={styles.headerButtonText}>{strings.Provision.SettingsMenuLabel}</span>
            </ToolbarButton>
          )}
          {context.props.isTeamsContext && context.state.isProvisionSiteAdmin && (
            <ToolbarButton
              appearance='subtle'
              icon={getFluentIcon('ContentSettings', { color: 'white' })}
              onClick={() => {
                context.setState({
                  showProvisionDrawer: false,
                  showConfigEditor: true
                })
              }}
              className={styles.headerButton}
            >
              <span className={styles.headerButtonText}>{strings.Provision.ConfigEditorButton}</span>
            </ToolbarButton>
          )}
          {onClose && (
            <ToolbarButton
              appearance='subtle'
              icon={getFluentIcon('Dismiss', { color: 'white' })}
              onClick={onClose}
              className={styles.headerButton}
            />
          )}
        </ToolbarGroup>
      </Toolbar>
    </div>
  )
}
