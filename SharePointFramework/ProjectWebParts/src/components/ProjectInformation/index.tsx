import { Panel, PanelType } from 'office-ui-fabric-react/lib/Panel'
import { UserMessage } from 'pp365-shared/lib/components/UserMessage'
import * as strings from 'ProjectWebPartsStrings'
import { ConfirmDialog } from 'pzl-spfx-components/lib/components/ConfirmDialog'
import React, { FunctionComponent } from 'react'
import { ProgressDialog } from '../ProgressDialog'
import { Actions } from './Actions'
import { ProjectInformationContext } from './context'
import { CreateParentModal } from './ParentProjectModal'
import styles from './ProjectInformation.module.scss'
import { ProjectProperties } from './ProjectProperties'
import { SyncProjectModal } from './SyncProjectModal'
import { IProjectInformationProps } from './types'
import { useProjectInformation } from './useProjectInformation'

export const ProjectInformation: FunctionComponent<IProjectInformationProps> = (props) => {
  const { state, setState, getCustomActions, onSyncProperties } = useProjectInformation(props)
  if (state.hidden) return null

  return (
    <ProjectInformationContext.Provider value={{ props, state }}>
      <div className={styles.root}>
        <div className={styles.container}>
          <div className={styles.header}>
            <span role='heading' aria-level={2}>
              {props.title}
            </span>
          </div>
          {state.loading
            ? null
            : (
              <div>
                <ProjectProperties properties={state.properties} />
                {(!props.hideActions && state.message) && <UserMessage {...state.message} />}
                <Actions customActions={getCustomActions()} />
                <ProgressDialog {...state.progress} />
                {state.confirmActionProps && <ConfirmDialog {...state.confirmActionProps} />}
                <Panel
                  type={PanelType.medium}
                  headerText={strings.ProjectPropertiesListName}
                  isOpen={state.showProjectPropertiesPanel}
                  onDismiss={() => setState({ ...state, showProjectPropertiesPanel: false })}
                  onLightDismissClick={() => setState({ ...state, showProjectPropertiesPanel: false })}
                  isLightDismiss
                  closeButtonAriaLabel={strings.CloseText}>
                  <ProjectProperties properties={state.allProperties} />
                </Panel>
                {state.displayParentCreationModal && (
                  <CreateParentModal
                    isOpen={state.displayParentCreationModal}
                    onDismiss={() => setState({ ...state, displayParentCreationModal: false })}
                  />
                )}
                {state.displaySyncProjectModal && (
                  <SyncProjectModal
                    isOpen={state.displaySyncProjectModal}
                    onDismiss={() => setState({ ...state, displaySyncProjectModal: false })}
                    data={state.data}
                    onSyncProperties={onSyncProperties}
                    title={props.webTitle}
                    hubSite={props.hubSite}
                    context={props.webPartContext}
                  />
                )}
              </div>
            )}
        </div>
      </div>
    </ProjectInformationContext.Provider>
  )
}

ProjectInformation.defaultProps = {
  page: 'Frontpage'
}

export { ProjectInformationModal } from '../ProjectInformationModal'
export * from './types'
