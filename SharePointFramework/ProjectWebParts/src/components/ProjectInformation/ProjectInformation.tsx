import { FluentProvider, IdPrefixProvider } from '@fluentui/react-components'
import strings from 'ProjectWebPartsStrings'
import {
  Fluent,
  UserMessage,
  WebPartTitle,
  customLightTheme,
  withDefaults
} from 'pp365-shared-library'
import React, { FC } from 'react'
import { Actions } from './Actions'
import { AllPropertiesPanel } from './AllPropertiesPanel'
import { ArchiveStatus } from './ArchiveStatus'
import { CreateParentDialog } from './CreateParentDialog'
import { RunProjectSetupDialog } from './RunProjectSetupDialog'
import { EditPropertiesPanel } from './EditPropertiesPanel'
import { LoadingSkeleton } from './LoadingSkeleton'
import { ParentProjectsList } from './ParentProjectsList'
import { ChildProjectsList } from './ChildProjectsList'
import { ProgressDialog } from './ProgressDialog'
import styles from './ProjectInformation.module.scss'
import { ProjectProperties } from './ProjectProperties'
import { ProjectStatusReport } from './ProjectStatusReport'
import { SustainabilityGoals } from './SustainabilityGoals'
import { ProjectInformationContextProvider } from './context'
import { IProjectInformationProps } from './types'
import { useProjectInformation } from './useProjectInformation'
import resource from 'SharedResources'
import { format } from 'pp365-shared-library'

export const PROJECT_INFORMATION_DEFAULT_PROPS: Partial<IProjectInformationProps> = {
  title: resource.WebParts_ProjectInformation_Title,
  page: 'Frontpage',
  customActions: [],
  hideActions: [],
  showFieldExternal: {},
  fallbackVisibleFields: [],
  hideStatusReport: false,
  hideArchiveStatus: true,
  showSustainabilityGoalsAsIcons: false,
  sustainabilityGoalIconSize: 48,
  // Icons by default, as in 1.14: each is named by its section and status, and its mark tells
  // the status by shape, not by colour alone (WCAG 1.4.1).
  statusReportShowOnlyIcons: true,
  rowLimit: 6,
  minRowLimit: 4,
  maxRowLimit: 100
}

/**
 * Display project information. A number of actions are available to the user,
 * depending on the access level of the current user.
 *
 * - Show all project information/properties in a panel (`AllPropertiesPanel`)
 * - Edit project information/properties in a panel (`EditPropertiesPanel`)
 * - Promote to parent project (`CreateParentDialog`)
 * - Run project setup wizard on-demand (`RunProjectSetupDialog`)
 */
export const ProjectInformation: FC<IProjectInformationProps> = (incomingProps) => {
  const props = withDefaults(incomingProps, PROJECT_INFORMATION_DEFAULT_PROPS)
  const { fluentProviderId, context } = useProjectInformation(props)
  const showNoHubAccessMessage = context.state.hubIsAvailable === false && !context.state.error
  if (context.state.hidden) return null

  if (!context.state.isDataLoaded) {
    return (
      <IdPrefixProvider value={fluentProviderId}>
        <FluentProvider theme={customLightTheme} style={{ background: 'transparent' }}>
          <LoadingSkeleton aria-label={format(strings.LoadingText, props.title)} />
        </FluentProvider>
      </IdPrefixProvider>
    )
  }

  return (
    <ProjectInformationContextProvider value={context}>
      <Fluent transparent>
        {props.title && !props.hideTitle && <WebPartTitle title={props.title} />}
        <div className={styles.container}>
          {context.state.error && (
            <UserMessage
              title={strings.ErrorTitle}
              text={context.state.error.message}
              intent='error'
            />
          )}
          <ProjectProperties />
          <SustainabilityGoals />
          <Actions />
          <ParentProjectsList />
          <ChildProjectsList />
          <ArchiveStatus />
          <ProjectStatusReport />
          {context.state.hubSyncWarning && (
            <UserMessage
              title={strings.HubSyncWarningTitle}
              text={context.state.hubSyncWarning}
              intent='warning'
            />
          )}
          {showNoHubAccessMessage && (
            <div className={styles.noHubAccessMessage}>
              {strings.ProjectInformationNoHubAccessMessage}
            </div>
          )}
          <ProgressDialog />
          <AllPropertiesPanel />
          <EditPropertiesPanel />
          <CreateParentDialog />
          <RunProjectSetupDialog />
        </div>
      </Fluent>
    </ProjectInformationContextProvider>
  )
}

ProjectInformation.displayName = 'Project Information'
