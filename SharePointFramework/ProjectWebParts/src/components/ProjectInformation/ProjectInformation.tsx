import { FluentProvider, mergeClasses, webLightTheme } from '@fluentui/react-components'
import { Alert } from '@fluentui/react-components/unstable'
import { WebPartTitle } from 'pp365-shared-library'
import { ConfirmDialog } from 'pzl-spfx-components/lib/components/ConfirmDialog'
import React, { FC } from 'react'
import { Actions } from './Actions'
import { AllPropertiesPanel } from './AllPropertiesPanel'
import { CreateParentDialog } from './CreateParentDialog'
import { EditPropertiesPanel } from './EditPropertiesPanel'
import { LoadingSkeleton } from './LoadingSkeleton'
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

  if (!context.state.isDataLoaded) {
    return (
      <FluentProvider theme={webLightTheme} className={styles.root} style={{background: 'transparent'}}>
        <LoadingSkeleton />
      </FluentProvider>
    )
  }

  return (
    <ProjectInformationContextProvider value={context}>
      <FluentProvider theme={webLightTheme} className={mergeClasses(styles.root, props.className)} style={{background: 'transparent'}}>
        <WebPartTitle title={props.title} />
        <div className={styles.container}>
          {context.state.error && (
            <Alert className={styles.alertContainer} intent='error'>
              {context.state.error.message}
            </Alert>
          )}
          <ProjectProperties />
          <>
            {context.state.alert && (
              <Alert className={styles.alertContainer} hidden={props.hideAllActions} intent='info'>
                {context.state.error.message}
              </Alert>
            )}
          </>
          <Actions />
          <ParentProjectsList />
          <ProjectStatusReport />
          <ProgressDialog />
          <AllPropertiesPanel />
          <EditPropertiesPanel />
          <CreateParentDialog />
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
  showFieldExternal: {},
  hideStatusReport: false,
  statusReportShowOnlyIcons: true
}
