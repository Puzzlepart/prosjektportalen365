import { FluentProvider, webLightTheme } from '@fluentui/react-components'
import { Shimmer } from '@fluentui/react/lib/Shimmer'
import { WebPartTitle } from 'pp365-shared-library'
import { UserMessage } from 'pp365-shared-library/lib/components/UserMessage'
import { ConfirmDialog } from 'pzl-spfx-components/lib/components/ConfirmDialog'
import React, { FC } from 'react'
import { Actions } from './Actions'
import { AllPropertiesPanel } from './AllPropertiesPanel'
import { CreateParentDialog } from './CreateParentDialog'
import { CustomShimmerElementsGroup } from './CustomShimmerElementsGroup'
import { EditPropertiesPanel } from './EditPropertiesPanel'
import { ParentProjectsList } from './ParentProjectsList'
import { ProgressDialog } from './ProgressDialog'
import styles from './ProjectInformation.module.scss'
import { ProjectProperties } from './ProjectProperties'
import { ProjectStatusReport } from './ProjectStatusReport'
import { ProjectInformationContextProvider } from './context'
import { IProjectInformationProps } from './types'
import { useProjectInformation } from './useProjectInformation'

/**
 * Display project information. A number of actions are available to the user,
 * depending on the access level of the current user.
 *
 * - Show all project information/properties in a panel (`AllPropertiesPanel`)
 * - Edit project information/properties in a panel (`EditPropertiesPanel`)
 * - Promote to parent project (`CreateParentDialog`)
 */
export const ProjectInformation: FC<IProjectInformationProps> = (props) => {
  const context = useProjectInformation(props)
  if (context.state.hidden) return null

  return (
    <ProjectInformationContextProvider value={context}>
      <FluentProvider theme={webLightTheme} className={styles.root}>
        <div className={styles.container}>
          <WebPartTitle title={props.title} />
          {context.state.error ? (
            <UserMessage
              className={styles.userMessage}
              type={context.state.error.type}
              text={context.state.error.message}
            />
          ) : (
            <Shimmer
              isDataLoaded={context.state.isDataLoaded}
              customElementsGroup={<CustomShimmerElementsGroup />}
            >
              <ProjectProperties />
              {context.state.message && (
                <UserMessage
                  hidden={props.hideAllActions}
                  className={styles.userMessage}
                  {...context.state.message}
                />
              )}
              <Actions />
              <ParentProjectsList />
              <ProjectStatusReport />
              <ProgressDialog />
              <AllPropertiesPanel />
              <EditPropertiesPanel />
              <CreateParentDialog />
            </Shimmer>
          )}
        </div>
      </FluentProvider>
      {context.state.confirmActionProps && <ConfirmDialog {...context.state.confirmActionProps} />}
    </ProjectInformationContextProvider>
  )
}

ProjectInformation.displayName = 'Project Information'
ProjectInformation.defaultProps = {
  page: 'Frontpage',
  customActions: [],
  hideActions: [],
  showFieldExternal: {}
}

export * from '../ProjectInformationPanel'
export * from './types'
