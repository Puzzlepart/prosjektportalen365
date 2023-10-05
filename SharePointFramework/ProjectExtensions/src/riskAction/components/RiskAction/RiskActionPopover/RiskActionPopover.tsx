import { format } from '@fluentui/react'
import { Button, Popover, PopoverSurface, mergeClasses } from '@fluentui/react-components'
import { Alert } from '@fluentui/react-components/unstable'
import { stringIsNullOrEmpty } from '@pnp/core'
import strings from 'ProjectExtensionsStrings'
import { getFluentIcon } from 'pp365-shared-library'
import React, { FC, HTMLProps } from 'react'
import { MigrateRiskActionsDialog } from './MigrateRiskActionsDialog'
import { NewRiskActionPanel } from './NewRiskActionPanel'
import styles from './RiskActionPopover.module.scss'
import { useRiskActionPopover } from './useRiskActionPopover'

/**
 * Risk action popover. This popover is used to handle actions for risk actions. Children
 * are rendered inside the popover, so the `PopoverTrigger` component can be used anywhere
 * within the children component(s).
 */
export const RiskActionPopover: FC<HTMLProps<any>> = (props) => {
  const {
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
        open={isPopoverOpen}
        onOpenChange={onPopoverOpenChange}
      >
        <div>{props.children}</div>
        <PopoverSurface className={styles.riskActionPopover}>
          <div className={styles.title}>
            {format(strings.RiskActionPopoverTitle, itemContext.title)}
          </div>
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
            <div hidden={stringIsNullOrEmpty(itemContext.hiddenFieldValues?.data)}>
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
      <NewRiskActionPanel isOpen={isPanelOpen} onDismiss={onClosePanel} />
    </>
  )
}

RiskActionPopover.displayName = 'RiskActionPopover'
