import {
  Button,
  Caption1,
  Caption2Strong,
  Popover,
  PopoverSurface,
  PopoverTrigger
} from '@fluentui/react-components'
import strings from 'ProjectExtensionsStrings'
import React, { FC, HTMLProps } from 'react'
import { useRiskActionFieldCustomizerContext } from '../../../context'
import { NewRiskActionPanel } from './NewRiskActionPanel'
import styles from './RiskActionPopover.module.scss'
import { useRiskActionPopover } from './useRiskActionPopover'


export const RiskActionPopover: FC<HTMLProps<any>> = (props) => {
  const {
    updateTasks,
    isPanelOpen,
    openPanel,
    closePanel,
    infoText
  } = useRiskActionPopover()
  return (
    <>
      <Popover>
        <PopoverTrigger disableButtonEnhancement>
          <div>{props.children}</div>
        </PopoverTrigger>
        <PopoverSurface>
          <div className={styles.newRiskActionPanel}>
            <Caption1 block>{infoText} </Caption1>
            <Caption2Strong block>Oppgavene ble sist oppdatert 1. januar 2021 kl 12:33.</Caption2Strong>
            <div className={styles.links}>
              <Button appearance='transparent' onClick={openPanel}>
                {strings.NewRiskActionPanelAddNewRiskAction}
              </Button>
              <Button appearance='transparent' onClick={updateTasks}>
                {strings.NewRiskActionPanelUpdateTaskStatus}
              </Button>
            </div>
          </div>
        </PopoverSurface>
      </Popover>
      <NewRiskActionPanel
        isOpen={isPanelOpen}
        onDismiss={closePanel} />
    </>
  )
}

RiskActionPopover.displayName = 'RiskActionPopover'