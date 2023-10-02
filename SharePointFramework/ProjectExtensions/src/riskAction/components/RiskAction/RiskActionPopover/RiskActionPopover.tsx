import {
  Button,
  Popover,
  PopoverSurface,
  PopoverTrigger,
  mergeClasses
} from '@fluentui/react-components'
import { Alert } from '@fluentui/react-components/unstable'
import {
  AddFilled,
  AddRegular,
  ArrowSyncFilled,
  ArrowSyncRegular,
  bundleIcon
} from '@fluentui/react-icons'
import strings from 'ProjectExtensionsStrings'
import React, { FC, HTMLProps } from 'react'
import { NewRiskActionPanel } from './NewRiskActionPanel'
import styles from './RiskActionPopover.module.scss'
import { useRiskActionPopover } from './useRiskActionPopover'
import { format } from '@fluentui/react'

const Icons = {
  Add: bundleIcon(AddRegular, AddFilled),
  ArrowSync: bundleIcon(ArrowSyncRegular, ArrowSyncFilled)
}

export const RiskActionPopover: FC<HTMLProps<any>> = (props) => {
  const {
    updateTasks,
    isPanelOpen,
    openPanel,
    closePanel,
    infoText,
    isPopoverOpen,
    onPopoverOpenChange,
    lastUpdated
  } = useRiskActionPopover()
  return (
    <>
      <Popover withArrow open={isPopoverOpen} onOpenChange={onPopoverOpenChange}>
        <PopoverTrigger disableButtonEnhancement>
          <div>{props.children}</div>
        </PopoverTrigger>
        <PopoverSurface className={styles.riskActionPopover}>
          <Alert intent='info' className={mergeClasses(styles.alert, styles.infoText)}>
            {infoText}
          </Alert>
          {lastUpdated && (
            <Alert className={mergeClasses(styles.alert, styles.lastUpdated)}>
              {format(strings.RiskActionPopoverLastUpdated, lastUpdated)}
            </Alert>
          )}
          <div className={styles.actions}>
            <Button appearance='transparent' icon={Icons.Add({})} size='small' onClick={openPanel}>
              {strings.NewRiskActionPanelAddNewRiskAction}
            </Button>
            <Button
              appearance='transparent'
              icon={Icons.ArrowSync({})}
              size='small'
              onClick={updateTasks}
            >
              {strings.NewRiskActionPanelUpdateTaskStatus}
            </Button>
          </div>
        </PopoverSurface>
      </Popover>
      <NewRiskActionPanel isOpen={isPanelOpen} onDismiss={closePanel} />
    </>
  )
}

RiskActionPopover.displayName = 'RiskActionPopover'
