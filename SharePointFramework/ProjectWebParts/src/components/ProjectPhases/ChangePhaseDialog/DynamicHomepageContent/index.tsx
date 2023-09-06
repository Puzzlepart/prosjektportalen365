import { format } from '@fluentui/react'
import { ProjectPhasesContext } from '../../../ProjectPhases/context'
import { UserMessage } from 'pp365-shared-library/lib/components/UserMessage'
import * as strings from 'ProjectWebPartsStrings'
import React, { FC, useContext } from 'react'
import _ from 'underscore'
import styles from './DynamicHomepageContent.module.scss'

export const DynamicHomepageContent: FC = () => {
  const context = useContext(ProjectPhasesContext)
  const phaseSitePages = context.state.data.phaseSitePages ?? []
  const phaseSitePage = _.find(phaseSitePages, (p) => p.title === context.state.confirmPhase.name)
  return (
    <div className={styles.root}>
      <UserMessage
        text={
          phaseSitePage
            ? format(strings.PhaseSitePageFoundDescription, phaseSitePage?.fileLeafRef)
            : format(strings.PhaseSitePageNotFoundDescription, context.state.confirmPhase.name)
        }
        intent={phaseSitePage ? 'info' : 'warning'}
      />
    </div>
  )
}
