import {
  Button,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Popover,
  PopoverSurface,
  mergeClasses
} from '@fluentui/react-components'
import { stringIsNullOrEmpty } from '@pnp/core'
import strings from 'ProjectExtensionsStrings'
import { getFluentIcon, format } from 'pp365-shared-library'
import React, { FC, HTMLProps } from 'react'
import { MigrateRiskActionsDialog } from './MigrateRiskActionsDialog'
import { NewRiskActionPanel } from './NewRiskActionPanel'
import styles from './RiskActionPopover.module.scss'
import { useRiskActionPopover } from './useRiskActionPopover'

/**
 * Provides task-management actions in a named, focus-trapping popover.
 * Children share its popover context so they can supply the trigger.
 */
export const RiskActionPopover: FC<HTMLProps<any>> = (props) => {
  const {
    focusContent,
    titleId,
    syncError,
    infoText,
    isPopoverOpen,
    onPopoverOpenChange,
    onSyncTasks,
    onOpenPanel,
    onClosePanel,
    isPanelOpen,
    lastUpdated,
    itemContext,
    showLastSyncTime
  } = useRiskActionPopover()
  return (
    <>
      <Popover
        withArrow
        closeOnIframeFocus
        closeOnScroll
        trapFocus
        open={isPopoverOpen}
        onOpenChange={onPopoverOpenChange}
      >
        <div>{props.children}</div>
        <PopoverSurface
          tabIndex={focusContent.tabIndex}
          className={mergeClasses(styles.riskActionPopover, focusContent.className)}
          aria-labelledby={titleId}
        >
          <div className={styles.title} id={titleId}>
            {format(strings.RiskActionPopoverTitle, itemContext.title)}
          </div>
          <MessageBar intent='info' className={mergeClasses(styles.alert, styles.infoText)}>
            <MessageBarBody>{infoText}</MessageBarBody>
          </MessageBar>
          {/* Rendered only when shown: a message bar announces itself, hidden or not. */}
          {lastUpdated && showLastSyncTime && (
            <MessageBar
              className={mergeClasses(styles.alert, styles.lastUpdated)}
              icon={getFluentIcon('ArrowSync', { color: 'green' })}
            >
              <MessageBarBody>
                {format(strings.RiskActionPopoverLastUpdated, lastUpdated)}
              </MessageBarBody>
            </MessageBar>
          )}
          {syncError !== undefined && (
            <MessageBar intent='error' className={styles.alert}>
              <MessageBarBody>
                <MessageBarTitle>{strings.RiskActionSyncFailed}</MessageBarTitle>
                {syncError}
              </MessageBarBody>
            </MessageBar>
          )}
          <div className={styles.actions}>
            <div>
              <Button
                appearance='transparent'
                icon={getFluentIcon('Add')}
                size='small'
                onClick={onOpenPanel}
              >
                {strings.NewRiskActionPanelAddNewRiskAction}
              </Button>
            </div>
            <div hidden={stringIsNullOrEmpty(itemContext.hiddenFieldValues?.data)}>
              <Button
                appearance='transparent'
                icon={getFluentIcon('ArrowSync', { color: 'green' })}
                size='small'
                onClick={onSyncTasks}
              >
                {strings.NewRiskActionPanelUpdateTaskStatus}
              </Button>
            </div>
            <div hidden={!stringIsNullOrEmpty(itemContext.hiddenFieldValues?.data)}>
              <MigrateRiskActionsDialog>
                <Button
                  appearance='transparent'
                  icon={getFluentIcon('ConvertRange')}
                  size='small'
                  disabled={stringIsNullOrEmpty(itemContext.fieldValue)}
                >
                  {strings.NewRiskActionPanelMigrateRiskActions}
                </Button>
              </MigrateRiskActionsDialog>
            </div>
          </div>
        </PopoverSurface>
      </Popover>
      <NewRiskActionPanel open={isPanelOpen} onClose={onClosePanel} />
    </>
  )
}

RiskActionPopover.displayName = 'RiskActionPopover'
