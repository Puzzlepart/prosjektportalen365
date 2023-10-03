import { format } from '@fluentui/react'
import {
  Button,
  Popover,
  PopoverSurface,
  PopoverTrigger,
  mergeClasses
} from '@fluentui/react-components'
import { Alert } from '@fluentui/react-components/unstable'
import strings from 'ProjectExtensionsStrings'
import React, { FC, HTMLProps } from 'react'
import { NewRiskActionPanel } from './NewRiskActionPanel'
import styles from './RiskActionPopover.module.scss'
import { useRiskActionPopover } from './useRiskActionPopover'
import { getFluentIcon } from 'pp365-shared-library'
import { MigrateRiskActionsDialog } from './MigrateRiskActionsDialog'
import { stringIsNullOrEmpty } from '@pnp/core'

export const RiskActionPopover: FC<HTMLProps<any>> = (props) => {
  const {
    updateTasks,
    isPanelOpen,
    openPanel,
    closePanel,
    infoText,
    isPopoverOpen,
    onPopoverOpenChange,
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
        open={isPopoverOpen}
        onOpenChange={onPopoverOpenChange}
      >
        <PopoverTrigger disableButtonEnhancement>
          <div>{props.children}</div>
        </PopoverTrigger>
        <PopoverSurface className={styles.riskActionPopover}>
          <div className={styles.title}>{itemContext.title}</div>
          <Alert intent='info' className={mergeClasses(styles.alert, styles.infoText)}>
            {infoText}
          </Alert>
          <div hidden={!lastUpdated || !showLastSyncTime}>
            <Alert
              className={mergeClasses(styles.alert, styles.lastUpdated)}
              icon={getFluentIcon('ArrowSync', { color: 'green' })}
            >
              {format(strings.RiskActionPopoverLastUpdated, lastUpdated)}
            </Alert>
          </div>
          <div className={styles.actions}>
            <Button
              appearance='transparent'
              icon={getFluentIcon('Add')}
              size='small'
              onClick={openPanel}
            >
              {strings.NewRiskActionPanelAddNewRiskAction}
            </Button>
            {itemContext.hiddenFieldValue?.data ? (
              <Button
                appearance='transparent'
                icon={getFluentIcon('ArrowSync', { color: 'green' })}
                size='small'
                onClick={updateTasks}
              >
                {strings.NewRiskActionPanelUpdateTaskStatus}
              </Button>
            ) : (
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
            )}
          </div>
        </PopoverSurface>
      </Popover>
      <NewRiskActionPanel isOpen={isPanelOpen} onDismiss={closePanel} />
    </>
  )
}

RiskActionPopover.displayName = 'RiskActionPopover'
