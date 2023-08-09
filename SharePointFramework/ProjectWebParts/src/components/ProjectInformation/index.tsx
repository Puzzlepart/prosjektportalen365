import { Shimmer } from '@fluentui/react/lib/Shimmer'
import { UserMessage } from 'pp365-shared-library/lib/components/UserMessage'
import { ConfirmDialog } from 'pzl-spfx-components/lib/components/ConfirmDialog'
import React, { FC } from 'react'
import { ProgressDialog } from './ProgressDialog'
import { Actions } from './Actions'
import { AllPropertiesPanel } from './AllPropertiesPanel'
import { ProjectInformationContextProvider } from './context'
import { CreateParentDialog } from './CreateParentDialog'
import { CustomShimmerElementsGroup } from './CustomShimmerElementsGroup'
import { ParentProjectsList } from './ParentProjectsList'
import styles from './ProjectInformation.module.scss'
import { ProjectProperties } from './ProjectProperties'
import { ProjectStatusReport } from './ProjectStatusReport'
import { SyncProjectDialog } from './SyncProjectDialog'
import { IProjectInformationProps } from './types'
import { useProjectInformation } from './useProjectInformation'
import { EditPropertiesPanel } from './EditPropertiesPanel'
import { ErrorBoundary } from 'react-error-boundary'

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div role='alert'>
      <p>Something went wrong:</p>
      <pre>{error.message}</pre>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  )
}

export const ProjectInformation: FC<IProjectInformationProps> = (props) => {
  const { context } = useProjectInformation(props)
  if (context.state.hidden) return null

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <ProjectInformationContextProvider value={context}>
        <div className={styles.root}>
          <div className={styles.container}>
            <div className={styles.header}>
              <span role='heading' aria-level={2}>
                {props.title}
              </span>
            </div>
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
                {!props.hideAllActions && context.state.message && (
                  <UserMessage className={styles.userMessage} {...context.state.message} />
                )}
                <Actions />
                <ParentProjectsList />
                <ProjectStatusReport />
                <ProgressDialog {...context.state.progress} />
                <AllPropertiesPanel />
                <EditPropertiesPanel />
                <CreateParentDialog />
                {props.page === 'Frontpage' && props.useIdeaProcessing && <SyncProjectDialog />}
              </Shimmer>
            )}
          </div>
        </div>
        {context.state.confirmActionProps && (
          <ConfirmDialog {...context.state.confirmActionProps} />
        )}
      </ProjectInformationContextProvider>
    </ErrorBoundary>
  )
}

ProjectInformation.displayName = 'Project Information'
ProjectInformation.defaultProps = {
  page: 'Frontpage',
  customActions: [],
  hideActions: []
}

export * from '../ProjectInformationPanel'
export * from './types'
