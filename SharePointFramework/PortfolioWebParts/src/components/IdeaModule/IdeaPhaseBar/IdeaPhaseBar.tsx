import React, { FC } from 'react'
import styles from './IdeaPhaseBar.module.scss'
import { Tab, TabList } from '@fluentui/react-components'
import * as strings from 'PortfolioWebPartsStrings'
import { getFluentIcon } from 'pp365-shared-library'
import { useIdeaModuleContext } from '../context'
import { IdeaPhase } from '../types'

export const IdeaPhaseBar: FC = () => {
  const context = useIdeaModuleContext()

  const phases = [
    {
      phase: IdeaPhase.Registration,
      name: 'Registrering av idé',
      icon: getFluentIcon('Lightbulb')
    },
    {
      phase: IdeaPhase.Processing,
      name: 'Behandling av idé',
      icon: getFluentIcon('Edit')
    },
    {
      phase: IdeaPhase.ApprovedForConcept,
      name: 'Idé godkjent',
      icon: getFluentIcon('CheckmarkCircle')
    },
    {
      phase: IdeaPhase.Provisioned,
      name: strings.Idea.ProvisionAreaTitle,
      icon: getFluentIcon('BoxToolbox')
    }
  ]
  return (
    <>
      <TabList className={styles.ideaPhases} selectedValue={context.state.phase}>
        {phases.map((phase) => {
          return (
            <>
              <Tab
                key={phase.phase}
                value={phase.phase}
                icon={phase.icon}
                disabled={context.state.phase !== phase.phase}
                style={{ cursor: 'default' }}
              >
                {phase.name}
              </Tab>
              <Tab
                icon={getFluentIcon('ChevronRight')}
                value={null}
                disabled
                style={{ cursor: 'default' }}
              />
            </>
          )
        })}
      </TabList>
    </>
  )
}
