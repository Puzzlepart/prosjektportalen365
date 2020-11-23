import { DisplayMode } from '@microsoft/sp-core-library'
import { stringIsNullOrEmpty, TypedHash } from '@pnp/common'
import { LogLevel } from '@pnp/logging'
import { WebPartTitle } from '@pnp/spfx-controls-react/lib/WebPartTitle'
import { MessageBarType } from 'office-ui-fabric-react/lib/MessageBar'
import { IProgressIndicatorProps } from 'office-ui-fabric-react/lib/ProgressIndicator'
import { Spinner } from 'office-ui-fabric-react/lib/Spinner'
import * as strings from 'ProjectWebPartsStrings'
import { ConfirmAction, ConfirmDialog } from 'pzl-spfx-components/lib/components/ConfirmDialog'
import * as React from 'react'
import { PortalDataService } from 'shared/lib/services'
import { parseUrlHash, sleep } from 'shared/lib/util'
import SPDataAdapter from '../../data'
import { BaseWebPartComponent } from '../BaseWebPartComponent'
import { ProgressDialog } from '../ProgressDialog'
import { UserMessage } from '../UserMessage'
import { Actions } from './Actions'
import {
  IProjectInformationProps,
  IProjectInformationState,
  IProjectInformationData,
  IProjectInformationUrlHash
} from './types'
import styles from './ProjectInformation.module.scss'
import { ProjectProperties } from './ProjectProperties'
import { ProjectProperty, ProjectPropertyModel } from './ProjectProperties/ProjectProperty'
import { StatusReports } from './StatusReports'
import { format } from 'office-ui-fabric-react/lib/Utilities'

export class ProjectInformation extends BaseWebPartComponent<
  IProjectInformationProps,
  IProjectInformationState
> {
  public static defaultProps: Partial<IProjectInformationProps> = {
    statusReportsCount: 0,
    page: 'Frontpage'
  }
  private _portalDataService: PortalDataService

  /**
   * Constructor
   *
   * @param {IProjectInformationProps} props Props
   */
  constructor(props: IProjectInformationProps) {
    super('ProjectInformation', props, { isLoading: true })
    this._portalDataService = new PortalDataService().configure({
      urlOrWeb: props.hubSite.web,
      siteId: props.siteId
    })
  }

  public async componentDidMount() {
    try {
      const urlHash = parseUrlHash<IProjectInformationUrlHash>(true)
      const data = await this._fetchData()
      this.setState({ ...data, isLoading: false })
      if (urlHash.syncproperties === '1') this._onSyncProperties(undefined, urlHash.force === '1')
    } catch (error) {
      this.setState({ error, isLoading: false })
    }
  }

  public render() {
    if (this.state.hidden) {
      return null
    }
    return (
      <div className={styles.projectInformation}>
        <div className={styles.container}>
          <div hidden={this.props.displayMode === DisplayMode.Edit}>
            <WebPartTitle
              displayMode={DisplayMode.Read}
              title={this.props.title}
              updateProperty={undefined}
            />
          </div>
          {this._contents}
        </div>
      </div>
    )
  }

  /**
   * Contents
   */
  private get _contents() {
    if (this.state.isLoading) {
      return !stringIsNullOrEmpty(this.props.title) ? (
        <Spinner label={format(strings.LoadingText, this.props.title.toLowerCase())} />
      ) : null
    }
    if (this.state.error) {
      return (
        <UserMessage
          messageBarType={MessageBarType.severeWarning}
          onDismiss={() => this.setState({ hidden: true })}
          text={strings.WebPartNoAccessMessage}
        />
      )
    }

    const { statusReports, editFormUrl, versionHistoryUrl } = this.state.data

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
        <StatusReports
          title={this.props.statusReportsHeader}
          statusReports={statusReports}
          urlSourceParam={document.location.href}
          hidden={this.props.statusReportsCount === 0}
        />
        <UserMessage {...this.state.message} />
        <Actions
          hidden={
            this.props.hideActions ||
            !this.props.isSiteAdmin ||
            this.props.displayMode === DisplayMode.Edit
          }
          versionHistoryUrl={versionHistoryUrl}
          editFormUrl={editFormUrl}
          onSyncProperties={
            stringIsNullOrEmpty(this.state.data.propertiesListId) &&
            this._onSyncProperties.bind(this)
          }
        />
        <ProgressDialog {...this.state.progress} />
        {this.state.confirmActionProps && <ConfirmDialog {...this.state.confirmActionProps} />}
      </>
    )
  }

  /**
   * Add message
   *
   * @param {string} text Text
   * @param {MessageBarType} messageBarType Message type
   * @param {number} duration Duration in seconds (defaults to 5)
   */
  private _addMessage(text: string, messageBarType: MessageBarType, duration = 5): Promise<void> {
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
   * @param {React.MouseEvent<any>} event Event
   * @param {boolean} force Force sync of properties
   */
  private async _onSyncProperties(event?: React.MouseEvent<any>, force = false): Promise<void> {
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
      this.logError('Failed to synchornize properties to item in hub', '_onSyncProperties', error)
      this._addMessage(strings.SyncProjectPropertiesErrorText, MessageBarType.severeWarning)
    } finally {
      this.setState({ progress: null })
    }
  }

  /**
   * Transform properties from entity item and configuration
   *
   * @param {TypedHash} fieldValuesText Field values as text
   * @param {IProjectInformationData} data Data
   */
  private _transformProperties(fieldValuesText: TypedHash<any>, data: IProjectInformationData) {
    const fieldNames: string[] = Object.keys(fieldValuesText).filter((fieldName) => {
      const [field] = data.fields.filter((fld) => fld.InternalName === fieldName)
      if (!field) {
        return false
      }
      if (
        data.columns.length === 0 &&
        ((this.props.showFieldExternal || {})[fieldName] || this.props.skipSyncToHub)
      ) {
        return true
      }
      const [column] = data.columns.filter((c) => c.internalName === fieldName)
      if (column) return column.isVisible(this.props.page)
      return false
    })
    const properties = fieldNames.map((fieldName) => {
      const [field] = data.fields.filter((fld) => fld.InternalName === fieldName)
      return new ProjectPropertyModel(field, fieldValuesText[fieldName])
    })
    return properties
  }

  /**
   * Fetch data
   */
  private async _fetchData(): Promise<Partial<IProjectInformationState>> {
    try {
      if (!SPDataAdapter.isConfigured) {
        SPDataAdapter.configure(this.context, {
          siteId: this.props.siteId,
          webUrl: this.props.webUrl,
          hubSiteUrl: this.props.hubSite.url,
          logLevel: sessionStorage.DEBUG || DEBUG ? LogLevel.Info : LogLevel.Warning
        })
      }

      const [columnConfig, propertiesData] = await Promise.all([
        this._portalDataService.getProjectColumns(),
        SPDataAdapter.project.getPropertiesData()
      ])

      const data: IProjectInformationData = {
        statusReports: [],
        columns: columnConfig,
        ...propertiesData
      }

      if (this.props.statusReportsCount > 0) {
        data.statusReports = await this._portalDataService.getStatusReports({
          top: this.props.statusReportsCount
        })
      }

      const properties = this._transformProperties(data.fieldValuesText, data)

      this.logInfo('Succesfully retrieved data.', '_fetchData', {
        propertiesListId: data.propertiesListId
      })

      return { data, properties }
    } catch (error) {
      this.logError('Failed to retrieve data.', '_fetchData', error)
      throw error
    }
  }
}

export { ProjectInformationModal } from '../ProjectInformationModal'
export { IProjectInformationProps, ProjectProperty }
