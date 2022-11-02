import { Shimmer } from '@fluentui/react/lib/Shimmer'
import { UserMessage } from 'pp365-shared/lib/components/UserMessage'
import { ConfirmDialog } from 'pzl-spfx-components/lib/components/ConfirmDialog'
import React, { FC } from 'react'
import { ProgressDialog } from '../ProgressDialog'
import { Actions } from './Actions'
import { AllPropertiesPanel } from './AllPropertiesPanel'
import { ProjectInformationContext } from './context'
import { CreateParentModal } from './CreateParentModal'
import { CustomShimmerElementsGroup } from './CustomShimmerElementsGroup'
import { ParentProjectsList } from './ParentProjectsList'
import styles from './ProjectInformation.module.scss'
import { ProjectProperties } from './ProjectProperties'
import { ProjectStatusReport } from './ProjectStatusReport'
import { SyncProjectModal } from './SyncProjectModal'
import { IProjectInformationProps } from './types'
import { useProjectInformation } from './useProjectInformation'

export const ProjectInformation: FC<IProjectInformationProps> = (props) => {
  const { state, setState, onSyncProperties } = useProjectInformation(props)
  if (state.hidden) return null

  return (
    <ProjectInformationContext.Provider value={{ props, state, setState, onSyncProperties }}>
      <div className={styles.root}>
        <div className={styles.container}>
          <div className={styles.header}>
            <span role='heading' aria-level={2}>
              {props.title}
            </span>
          </div>
          <Shimmer isDataLoaded={state.isDataLoaded} customElementsGroup={<CustomShimmerElementsGroup />}>
            <ProjectProperties properties={state.properties} />
            {!props.hideAllActions && state.message && <UserMessage {...state.message} />}
            <ParentProjectsList />
            <ProjectStatusReport />
            <Actions />
            <ProgressDialog {...state.progress} />
            <AllPropertiesPanel />
            {state.confirmActionProps && <ConfirmDialog {...state.confirmActionProps} />}
            {state.displayCreateParentModal && <CreateParentModal />}
            {state.displaySyncProjectModal && <SyncProjectModal />}
          </Shimmer>
        </div>
      </div>
    </ProjectInformationContext.Provider>
  )
}

ProjectInformation.defaultProps = {
  page: 'Frontpage',
  customActions: [],
  hideActions: [],
  hideAllActions: false,
  useFramelessButtons: false,
  hideStatusReport: true,
  hideParentProjects: true
}

export * from '../ProjectInformationPanel'
export * from './types'

