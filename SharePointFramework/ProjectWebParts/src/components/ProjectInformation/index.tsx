import { DisplayMode } from '@microsoft/sp-core-library'
import { stringIsNullOrEmpty } from '@pnp/common'
import { LogLevel } from '@pnp/logging'
import { MessageBarType } from 'office-ui-fabric-react/lib/MessageBar'
import { Panel, PanelType } from 'office-ui-fabric-react/lib/Panel'
import { IProgressIndicatorProps } from 'office-ui-fabric-react/lib/ProgressIndicator'
import { format } from 'office-ui-fabric-react/lib/Utilities'
import { UserMessage } from 'pp365-shared/lib/components/UserMessage'
import { PortalDataService } from 'pp365-shared/lib/services'
import { parseUrlHash, sleep } from 'pp365-shared/lib/util'
import * as strings from 'ProjectWebPartsStrings'
import { ConfirmAction, ConfirmDialog } from 'pzl-spfx-components/lib/components/ConfirmDialog'
import React from 'react'
import { isEmpty } from 'underscore'
import SPDataAdapter from '../../data'
import { BaseWebPartComponent } from '../BaseWebPartComponent'
import { ProgressDialog } from '../ProgressDialog'
import { Actions } from './Actions'
import { ActionType } from './Actions/types'
import { CreateParentModal } from './ParentProjectModal'
import styles from './ProjectInformation.module.scss'
import { ProjectProperties } from './ProjectProperties'
import { ProjectPropertyModel } from './ProjectProperties/ProjectProperty'
import {
  IProjectInformationData,
  IProjectInformationProps,
  IProjectInformationState,
  IProjectInformationUrlHash
} from './types'

export class ProjectInformation extends BaseWebPartComponent<
  IProjectInformationProps,
  IProjectInformationState
> {
  public static defaultProps: Partial<IProjectInformationProps> = {
    page: 'Frontpage'
  }
  private _portalDataService: PortalDataService

  constructor(props: IProjectInformationProps) {
    super('ProjectInformation', props, { loading: true })
    this._portalDataService = new PortalDataService().configure({
      urlOrWeb: this.props.hubSite.web,
      siteId: this.props.siteId
    })
  }

  public async componentDidMount() {
    try {
      const urlHash = parseUrlHash<IProjectInformationUrlHash>(true)
      const data = await this._fetchData()
      this.setState({ ...data, loading: false })
      if (urlHash.syncproperties === '1') this._onSyncProperties(undefined, urlHash.force === '1')
    } catch (error) {
      this.setState({ error, loading: false })
    }
  }

  public render() {
    if (this.state.hidden) return null

    return (
      <div className={styles.root}>
        <div className={styles.container}>
          <div className={styles.header}>
            <span role='heading' aria-level={2}>
              {this.props.title}
            </span>
          </div>
          {this.getContent()}
        </div>
      </div>
    )
  }

  /**
   * Contents
   */
  private getContent() {
    if (this.state.loading) return null
    if (this.state.error) {
      return (
        <UserMessage
          type={MessageBarType.severeWarning}
          onDismiss={() => this.setState({ hidden: true })}
          text={strings.WebPartNoAccessMessage}
        />
      )
    }

    const { editFormUrl, versionHistoryUrl } = this.state.data

    return (
      <>
        <ProjectProperties
          title={this.props.title}
          properties={this.state.properties}
          displayMode={this.props.displayMode}
          isSiteAdmin={this.props.isSiteAdmin}
          onFieldExternalChanged={this.props.onFieldExternalChanged}
          showFieldExternal={this.props.showFieldExternal}
          propertiesList={!stringIsNullOrEmpty(this.state.data.propertiesListId)}
        />
        {(!this.props.hideActions && this.state.message) && <UserMessage {...this.state.message} />}
        <Actions
          hidden={this.props.hideActions || this.props.displayMode === DisplayMode.Edit}
          userHasAdminPermission={this.state.userHasAdminPermission}
          versionHistoryUrl={versionHistoryUrl}
          editFormUrl={editFormUrl}
          onSyncProperties={
            stringIsNullOrEmpty(this.state.data.propertiesListId) &&
            this._onSyncProperties.bind(this)
          }
          customActions={this.getCustomActions()}
        />
        <ProgressDialog {...this.state.progress} />
        {this.state.confirmActionProps && <ConfirmDialog {...this.state.confirmActionProps} />}
        <Panel
          type={PanelType.medium}
          headerText={strings.ProjectPropertiesListName}
          isOpen={this.state.showProjectPropertiesPanel}
          onDismiss={() => this.setState({ showProjectPropertiesPanel: false })}
          onLightDismissClick={() => this.setState({ showProjectPropertiesPanel: false })}
          isLightDismiss
          closeButtonAriaLabel={strings.CloseText}>
          <ProjectProperties
            title={this.props.title}
            properties={this.state.allProperties}
            displayMode={this.props.displayMode}
            isSiteAdmin={this.props.isSiteAdmin}
            onFieldExternalChanged={this.props.onFieldExternalChanged}
            showFieldExternal={this.props.showFieldExternal}
            propertiesList={!stringIsNullOrEmpty(this.state.data.propertiesListId)}
          />
        </Panel>
        {this.state.displayParentCreationModal && (
          <CreateParentModal
            isOpen={this.state.displayParentCreationModal}
            onDismiss={this.onDismissParentModal.bind(this)}
          />
        )}
      </>
    )
  }

  private getCustomActions(): ActionType[] {
    const administerChildrenAction: ActionType = [
      strings.ChildProjectAdminLabel,
      () => {
        window.location.href = `${this.props.webPartContext.pageContext.web.serverRelativeUrl}/SitePages/${this.props.adminPageLink}`
      },
      'Org',
      false,
      !this.state.userHasAdminPermission
    ]
    const transformToParentProject: ActionType = [
      strings.CreateParentProjectLabel,
      () => {
        this.setState({ displayParentCreationModal: true })
      },
      'Org',
      false,
      !this.state.userHasAdminPermission
    ]
    const viewAllPropertiesAction: ActionType = [
      strings.ViewAllPropertiesLabel,
      () => {
        this.setState({ showProjectPropertiesPanel: true })
      },
      'EntryView',
      false
    ]
    const syncProjectPropertiesAction: ActionType = [
      strings.SyncProjectPropertiesText,
      () => {
        console.log('Open sync dialog')
      },
      'Sync',
      false,
      !this.props.useIdeaProcessing
    ]
    if (this.state.isParentProject) {
      return [administerChildrenAction, viewAllPropertiesAction, syncProjectPropertiesAction]
    }
    return [transformToParentProject, viewAllPropertiesAction, syncProjectPropertiesAction]
  }

  private onDismissParentModal() {
    this.setState({ displayParentCreationModal: false })
  }

  /**
   * Add message
   *
   * @param text Text
   * @param messageBarType Message type
   * @param duration Duration in seconds (defaults to 5)
   */
  private _addMessage(
    text: string,
    messageBarType: MessageBarType,
    duration: number = 5
  ): Promise<void> {
    return new Promise((resolve) => {
      this.setState({
        message: {
          text: format(text, duration.toString()),
          messageBarType,
          onDismiss: () => this.setState({ message: null })
        }
      })
      window.setTimeout(() => {
        this.setState({ message: null })
        resolve()
      }, duration * 1000)
    })
  }

  /**
   * On sync properties
   *
   * @param event Event
   * @param force Force sync of properties
   */
  private async _onSyncProperties(
    event?: React.MouseEvent<any>,
    force: boolean = false
  ): Promise<void> {
    if (event) {
      return ConfirmAction(
        strings.SyncProjectPropertiesText,
        strings.SyncProjectPropertiesDescription,
        this._onSyncProperties.bind(this),
        strings.SyncNowText,
        this,
        'confirmActionProps',
        { containerClassName: styles.confirmDialog }
      )
    }
    if (!stringIsNullOrEmpty(this.state.data.propertiesListId)) {
      const lastUpdated = await SPDataAdapter.project.getPropertiesLastUpdated(this.state.data)
      if (lastUpdated > 60 && !force) return
    }
    if (this.props.skipSyncToHub) return
    this.logInfo(`Starting sync of ${strings.ProjectPropertiesListName}`, '_onSyncProperties')
    this.setState({ progress: { title: strings.SyncProjectPropertiesProgressLabel, progress: {} } })
    const progressFunc = (progress: IProgressIndicatorProps) =>
      this.setState({ progress: { title: strings.SyncProjectPropertiesProgressLabel, progress } })
    try {
      progressFunc({
        label: strings.SyncProjectPropertiesListProgressDescription,
        description: `${strings.PleaseWaitText}...`
      })
      this.logInfo('Ensuring list and fields', '_onSyncProperties', {
        templateParameters: this.state.data.templateParameters
      })
      const { created } = await this._portalDataService.syncList(
        this.props.webUrl,
        strings.ProjectPropertiesListName,
        this.state.data.templateParameters.ProjectContentTypeId ||
        '0x0100805E9E4FEAAB4F0EABAB2600D30DB70C',
        { Title: this.props.webTitle }
      )
      if (!created) {
        this.logInfo('Synchronizing properties to item in hub', '_onSyncProperties')
        await SPDataAdapter.syncPropertyItemToHub(
          this.state.data.fieldValues,
          { ...this.state.data.fieldValuesText, Title: this.props.webTitle },
          this.state.data.templateParameters,
          progressFunc
        )
      }
      this.logInfo('Finished. Reloading page.', '_onSyncProperties')
      SPDataAdapter.clearCache()
      await sleep(5)
      document.location.href =
        sessionStorage.DEBUG || DEBUG ? document.location.href.split('#')[0] : this.props.webUrl
    } catch (error) {
      this.logError('Failed to synchronize properties to item in hub', '_onSyncProperties', error)
      this._addMessage(strings.SyncProjectPropertiesErrorText, MessageBarType.severeWarning)
    } finally {
      this.setState({ progress: null })
    }
  }

  /**
   * Transform properties from entity item and configuration
   *
   * @param data Data
   * @param useVisibleFilter Set to false if all properties should be returned
   */
  private _transformProperties(
    { columns, fields, fieldValuesText }: IProjectInformationData,
    useVisibleFilter: boolean = true
  ) {
    const fieldNames: string[] = Object.keys(fieldValuesText).filter((fieldName) => {
      const [field] = fields.filter((fld) => fld.InternalName === fieldName)
      if (!field) return false
      if (
        isEmpty(columns) &&
        ((this.props.showFieldExternal || {})[fieldName] || this.props.skipSyncToHub)
      ) {
        return true
      }

      const [column] = columns.filter((c) => c.internalName === fieldName)
      return column ? (useVisibleFilter ? column.isVisible(this.props.page) : true) : false
    })

    const properties = fieldNames.map((fn) => {
      const [field] = fields.filter((fld) => fld.InternalName === fn)
      return new ProjectPropertyModel(field, fieldValuesText[fn])
    })
    return properties
  }

  /**
   * Fetch data
   */
  private async _fetchData(): Promise<Partial<IProjectInformationState>> {
    try {
      SPDataAdapter.configure(this.props.webPartContext, {
        siteId: this.props.siteId,
        webUrl: this.props.webUrl,
        hubSiteUrl: this.props.hubSite.url,
        logLevel: sessionStorage.DEBUG || DEBUG ? LogLevel.Info : LogLevel.Warning
      })
      const [columns, propertiesData] = await Promise.all([
        this._portalDataService.getProjectColumns(),
        SPDataAdapter.project.getPropertiesData()
      ])
      const data: IProjectInformationData = {
        columns,
        ...propertiesData
      }
      const userHasAdminPermission = await SPDataAdapter.checkProjectAdminPermission(data.fieldValues)
      const properties = this._transformProperties(data)
      const allProperties = this._transformProperties(data, false)
      return {
        data,
        isParentProject: data.fieldValues?.GtIsParentProject || data.fieldValues?.GtIsProgram,
        properties,
        allProperties,
        userHasAdminPermission
      }
    } catch (error) {
      this.logError('Failed to retrieve data.', '_fetchData', error)
      throw error
    }
  }
}

export { ProjectInformationModal } from '../ProjectInformationModal'
export * from './types'

