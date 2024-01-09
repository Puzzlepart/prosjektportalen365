import { FluentProvider } from '@fluentui/react-components'
import * as strings from 'ProgramWebPartsStrings'
import { LoadingSkeleton, UserMessage, WebPartTitle, customLightTheme } from 'pp365-shared-library'
import React, { FC } from 'react'
import { AddProjectDialog } from './AddProjectDialog/AddProjectDialog'
import styles from './ProgramAdministration.module.scss'
import { ProjectList } from './ProjectList'
import { ProgramAdministrationContext } from './context'
import { IProgramAdministrationProps } from './types'
import { useProgramAdministration } from './useProgramAdministration'

export const ProgramAdministration: FC<IProgramAdministrationProps> = (props) => {
  const { context, childProjects, onSelectionChange } = useProgramAdministration(props)

  return (
    <FluentProvider theme={customLightTheme} className={styles.programAdministration}>
      <ProgramAdministrationContext.Provider value={context}>
        <WebPartTitle title={props.title} description={strings.ProgramAdministrationInfoMessage} />
        {context.state.error ? (
          <UserMessage title={strings.ErrorTitle} text={context.state.error} intent='error' />
        ) : context.state.loading ? (
          <LoadingSkeleton />
        ) : (
          <ProjectList
            items={childProjects}
            onSelectionChange={onSelectionChange}
            renderLinks
            search={{
              placeholder: strings.ProgramAdministrationSearchBoxPlaceholder
            }}
          />
        )}
        {context.state.addProjectDialog && <AddProjectDialog />}
      </ProgramAdministrationContext.Provider>
    </FluentProvider>
  )
}

ProgramAdministration.defaultProps = {
  title: strings.ProgramAdministrationHeader
}
