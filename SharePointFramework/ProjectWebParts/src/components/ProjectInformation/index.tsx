import { Panel, PanelType } from '@fluentui/react/lib/Panel'
import { Shimmer } from '@fluentui/react/lib/Shimmer'
import { UserMessage } from 'pp365-shared/lib/components/UserMessage'
import * as strings from 'ProjectWebPartsStrings'
import { ConfirmDialog } from 'pzl-spfx-components/lib/components/ConfirmDialog'
import React, { FunctionComponent } from 'react'
import { ProgressDialog } from '../ProgressDialog'
import { Actions } from './Actions'
import { ProjectInformationContext } from './context'
import { CreateParentModal } from './CreateParentModal'
import { ParentProjectsList } from './ParentProjectsList'
import styles from './ProjectInformation.module.scss'
import { ProjectProperties } from './ProjectProperties'
import { SyncProjectModal } from './SyncProjectModal'
import { IProjectInformationProps } from './types'
import { useProjectInformation } from './useProjectInformation'

export const ProjectInformation: FunctionComponent<IProjectInformationProps> = (props) => {
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
          {state.loading ? (
            <>
              <Shimmer width='65%' className={styles.shimmer} />
              <Shimmer width='65%' className={styles.shimmer} />
              <Shimmer width='50%' className={styles.shimmer} />
              <Shimmer width='45%' className={styles.shimmer} />
            </>
          ) : (
            <div>
              <ProjectProperties properties={state.properties} />
              {!props.hideAllActions && state.message && <UserMessage {...state.message} />}
              <ParentProjectsList />
              <Actions />
              <ProgressDialog {...state.progress} />
              <Panel
                type={PanelType.medium}
                headerText={strings.ProjectPropertiesListName}
                isOpen={state.showAllPropertiesPanel}
                onDismiss={() => setState({ showAllPropertiesPanel: false })}
                isLightDismiss
                closeButtonAriaLabel={strings.CloseText}>
                <ProjectProperties properties={state.allProperties} />
              </Panel>
              {state.confirmActionProps && <ConfirmDialog {...state.confirmActionProps} />}
              {state.displayCreateParentModal && <CreateParentModal />}
              {state.displaySyncProjectModal && <SyncProjectModal />}
            </div>
          )}
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
  useFramelessButtons: false
}

export { ProjectInformationModal } from '../ProjectInformationModal'
export * from './types'
