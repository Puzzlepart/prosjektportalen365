import { DisplayMode } from '@microsoft/sp-core-library'
import { stringIsNullOrEmpty } from '@pnp/common'
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
import {
  IProjectInformationProps
} from './types'
import { useProjectInformation } from './useProjectInformation'

export const ProjectInformation: FunctionComponent<IProjectInformationProps> = (props) => {
  const { state, setState, getCustomActions } = useProjectInformation(props)
  if (state.hidden) return null

  return (
    <ProjectInformationContext.Provider value={{ props,state }}>
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
                <ProjectProperties
                  title={props.title}
                  properties={state.properties}
                  displayMode={props.displayMode}
                  isSiteAdmin={props.isSiteAdmin}
                  onFieldExternalChanged={props.onFieldExternalChanged}
                  showFieldExternal={props.showFieldExternal}
                  propertiesList={!stringIsNullOrEmpty(state.data.propertiesListId)}
                />
                {(!props.hideActions && state.message) && <UserMessage {...state.message} />}
                <Actions
                  hidden={props.hideActions || props.displayMode === DisplayMode.Edit}
                  userHasAdminPermission={state.userHasAdminPermission}
                  versionHistoryUrl={state.data.versionHistoryUrl}
                  editFormUrl={state.data.editFormUrl}
                  customActions={getCustomActions()}
                />
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
                  <ProjectProperties
                    title={props.title}
                    properties={state.allProperties}
                    displayMode={props.displayMode}
                    isSiteAdmin={props.isSiteAdmin}
                    onFieldExternalChanged={props.onFieldExternalChanged}
                    showFieldExternal={props.showFieldExternal}
                    propertiesList={!stringIsNullOrEmpty(state.data.propertiesListId)}
                  />
                </Panel>
                {state.displayParentCreationModal && (
                  <CreateParentModal
                    isOpen={state.displayParentCreationModal}
                    onDismiss={() => setState({ ...state, displayParentCreationModal: false })}
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

