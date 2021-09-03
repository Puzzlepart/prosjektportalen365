import { TypedHash } from '@pnp/common'
import { Logger, LogLevel } from '@pnp/logging'
import { AttachmentFileInfo } from '@pnp/sp'
import { getId } from '@uifabric/utilities'
import { UserMessage } from 'components/UserMessage'
import domToImage from 'dom-to-image'
import * as moment from 'moment'
import { CommandBar } from 'office-ui-fabric-react/lib/CommandBar'
import { IContextualMenuItem } from 'office-ui-fabric-react/lib/ContextualMenu'
import { MessageBar, MessageBarType } from 'office-ui-fabric-react/lib/MessageBar'
import { Spinner } from 'office-ui-fabric-react/lib/Spinner'
import { format } from 'office-ui-fabric-react/lib/Utilities'
import * as strings from 'ProjectWebPartsStrings'
import * as React from 'react'
import { formatDate } from 'pp365-shared/lib/helpers'
import { SectionModel, SectionType, StatusReport } from 'pp365-shared/lib/models'
import { PortalDataService } from 'pp365-shared/lib/services'
import { getUrlParam, parseUrlHash, removeMenuBorder, setUrlHash } from 'pp365-shared/lib/util'
import { find, first } from 'underscore'
import SPDataAdapter from '../../data'
import styles from './ProjectStatus.module.scss'
import {
  IBaseSectionProps,
  ListSection,
  ProjectPropertiesSection,
  RiskSection,
  StatusSection,
  SummarySection
} from './Sections'
import {
  IProjectStatusData,
  IProjectStatusHashState,
  IProjectStatusProps,
  IProjectStatusState
} from './types'

export class ProjectStatus extends React.Component<IProjectStatusProps, IProjectStatusState> {
  private _portalDataService: PortalDataService

  /**
   * Constructor
   *
   * @param {IProjectStatusProps} props Props
   */
  constructor(props: IProjectStatusProps) {
    super(props)
    this.state = { loading: true, isPublishing: false }
    this._portalDataService = new PortalDataService().configure({
      urlOrWeb: props.hubSite.web,
      siteId: props.siteId
    })
  }

  public async componentDidMount() {
    try {
      const data = await this._fetchData()
      let [selectedReport] = data.reports
      const hashState = parseUrlHash<IProjectStatusHashState>()
      const selectedReportUrlParam = getUrlParam('selectedReport')
      const sourceUrlParam = getUrlParam('Source')
      if (hashState.selectedReport) {
        selectedReport = find(
          data.reports,
          (report) => report.id === parseInt(hashState.selectedReport, 10)
        )
      } else if (selectedReportUrlParam) {
        selectedReport = find(
          data.reports,
          (report) => report.id === parseInt(selectedReportUrlParam, 10)
        )
      }
      this.setState({
        data,
        selectedReport,
        sourceUrl: decodeURIComponent(sourceUrlParam || ''),
        loading: false
      })
    } catch (error) {
      this.setState({ error, loading: false })
    }
  }

  public UNSAFE_componentWillUpdate(_: IProjectStatusProps, { selectedReport }: IProjectStatusState) {
    const obj: IProjectStatusHashState = {}
    if (selectedReport) obj.selectedReport = selectedReport.id.toString()
    setUrlHash<IProjectStatusHashState>(obj)
  }

  /**
   * Renders the <ProjectStatus /> component
   */
  public render(): React.ReactElement<IProjectStatusProps> {
    if (this.state.loading) {
      return (
        <div className={styles.projectStatus}>
          <div className={styles.container}>
            <Spinner label={format(strings.LoadingText, this.props.title)} />
          </div>
        </div>
      )
    }

    if (this.state.error) {
      return (
        <div className={styles.projectStatus}>
          <div className={styles.container}>
            <MessageBar messageBarType={MessageBarType.info}>{this.state.error}</MessageBar>
          </div>
        </div>
      )
    }

    return (
      <div className={styles.projectStatus}>
        {this._commandBar()}
        <div className={styles.container}>
          {this.state.data.reports.filter((report) => !report.published).length > 0 && (
            <MessageBar messageBarType={MessageBarType.info}>
              {strings.UnpublishedStatusReportInfo}
            </MessageBar>
          )}
          <div className={`${styles.header} ${styles.column12}`}>
            <div className={styles.title}>{this.props.title} {this.state.selectedReport ? moment(this.state.selectedReport.created).format('DD.MM.yyyy') : null} </div>
          </div>
          <div className={`${styles.sections} ${styles.column12}`} id='pp-statussection'>
            {this._renderSections()}
          </div>
        </div>
      </div>
    )
  }

  private _commandBar() {
    const { data, selectedReport, sourceUrl } = this.state
    const items: IContextualMenuItem[] = [
      {
        key: 'NEW_STATUS_REPORT',
        name: strings.NewStatusReportModalHeaderText,
        iconProps: { iconName: 'NewFolder' },
        disabled: data.reports.filter((report) => !report.published).length !== 0,
        onClick: this._redirectNewStatusReport.bind(this)
      },
      selectedReport && {
        key: 'DELETE_REPORT',
        name: strings.DeleteReportButtonText,
        iconProps: { iconName: 'Delete' },
        disabled: selectedReport?.published,
        onClick: () => {
          this._deleteReport(selectedReport)
        }
      },
      selectedReport && {
        key: 'EDIT_REPORT',
        name: strings.EditReportButtonText,
        iconProps: { iconName: 'Edit' },
        href: selectedReport?.editFormUrl,
        disabled: selectedReport?.published
      },
      selectedReport && {
        key: 'PUBLISH_REPORT',
        name: strings.PublishReportButtonText,
        iconProps: { iconName: 'PublishContent' },
        disabled: selectedReport?.published,
        onClick: () => {
          this._publishReport(selectedReport)
          this.setState({ isPublishing: true })
        }
      }
    ].filter((i) => i)
    const farItems: IContextualMenuItem[] = []
    if (sourceUrl) {
      farItems.push({
        key: 'NAVIGATE_TO_SOURC_EURL',
        name: strings.NavigateToSourceUrlText,
        iconProps: { iconName: 'NavigateBack' },
        href: sourceUrl
      })
    }
    if (selectedReport) {
      farItems.push({
        key: 'GET_SNAPSHOT',
        name: strings.GetSnapshotButtonText,
        iconProps: { iconName: 'Photo2' },
        disabled: !selectedReport?.hasAttachments,
        onClick: () => {
          window.open(first(selectedReport.attachments).ServerRelativeUrl)
        }
      })
    }
    if (data.reports.length > 0) {
      const reportOptions = this._getReportOptions(data)
      farItems.push({
        key: 'REPORT_DROPDOWN',
        name: selectedReport ? formatDate(selectedReport.created, true) : '',
        iconProps: { iconName: 'FullHistory' },
        subMenuProps: { items: reportOptions }
      })
    }
    if (selectedReport) {
      farItems.push({
        id: getId('StatusIcon'),
        key: 'STATUS_ICON',
        name: selectedReport?.published
          ? strings.PublishedStatusReport
          : strings.NotPublishedStatusReport,
        iconProps: {
          iconName: selectedReport?.published ? 'BoxCheckmarkSolid' : 'CheckboxFill',
          style: {
            color: selectedReport?.published ? '#2DA748' : '#D2D2D2'
          }
        },
        disabled: true
      })
    }

    return (
      <CommandBar
        items={removeMenuBorder<IContextualMenuItem>(items)}
        farItems={removeMenuBorder<IContextualMenuItem>(farItems)}
      />
    )
  }

  /**
   * Get section base props
   *
   * @param {SectionModel} sec Section model
   */
  private _getSectionBaseProps(sec: SectionModel): IBaseSectionProps {
    const { selectedReport, data } = this.state
    const { value, comment } = selectedReport?.getStatusValue(sec.fieldName)
    const [columnConfig] = data.columnConfig.filter(
      (c) => c.columnFieldName === sec.fieldName && c.value === value
    )
    const baseProps: IBaseSectionProps = {
      headerProps: {
        label: sec.name,
        value,
        comment,
        iconName: sec.iconName,
        iconSize: 50,
        iconColor: columnConfig ? columnConfig.color : '#444'
      },
      report: selectedReport,
      model: sec,
      data: this.state.data,
      hubSiteUrl: this.props.hubSite.url,
      siteId: this.props.siteId,
      webUrl: this.props.webUrl
    }
    return baseProps
  }

  /**
   * Render sections
   */
  private _renderSections() {
    const { riskMatrixWidth, riskMatrixHeight, riskMatrixCalloutTemplate } = this.props
    const { data, selectedReport } = this.state

    if (!selectedReport)
      return (
        <UserMessage text={strings.NoStatusReportsMessage} messageBarType={MessageBarType.info} />
      )
    return data.sections
      .filter((sec) => sec.showAsSection || sec.type === SectionType.SummarySection)
      .map((sec) => {
        const baseProps = this._getSectionBaseProps(sec)
        switch (sec.type) {
          case SectionType.SummarySection: {
            return (
              <SummarySection
                {...baseProps}
                sections={data.sections.filter(
                  (s) => s.showInStatusSection || s.type === SectionType.SummarySection
                )}
                columnConfig={data.columnConfig}
              />
            )
          }
          case SectionType.StatusSection: {
            if (baseProps.headerProps.value) {
              return <StatusSection {...baseProps} />
            } else {
              return null
            }
          }
          case SectionType.ProjectPropertiesSection: {
            return (
              <ProjectPropertiesSection
                {...baseProps}
                fieldValues={{ ...data.properties.fieldValues, ...selectedReport.fieldValues }}
                fields={[...data.properties.fields, ...data.reportFields]}
                fieldWidth={this.props.fieldWidth}
              />
            )
          }
          case SectionType.RiskSection: {
            return (
              <RiskSection
                {...baseProps}
                riskMatrix={{
                  width: riskMatrixWidth,
                  height: riskMatrixHeight,
                  calloutTemplate: riskMatrixCalloutTemplate
                }}
              />
            )
          }
          case SectionType.ListSection: {
            return <ListSection {...baseProps} />
          }
          default: {
            return null
          }
        }
      })
  }

  /**
   * On report changed
   *
   * @param {StatusReport} selectedReport Selected report
   */
  private _onReportChanged(selectedReport: StatusReport) {
    this.setState({ selectedReport })
  }

  /**
   * Get report options
   *
   * @param {IProjectStatusData} data Data
   */
  private _getReportOptions(data: IProjectStatusData): IContextualMenuItem[] {
    const reportOptions: IContextualMenuItem[] = data.reports.map((report) => {
      const isCurrent = this.state.selectedReport
        ? report.id === this.state.selectedReport.id
        : false
      return {
        key: `${report.id}`,
        name: formatDate(report.created, true),
        onClick: () => this._onReportChanged(report),
        canCheck: true,
        iconProps: {
          iconName: report.published ? 'BoxCheckmarkSolid' : 'CheckboxFill',
          style: {
            color: report.published ? '#2DA748' : '#D2D2D2'
          }
        },
        isChecked: isCurrent
      } as IContextualMenuItem
    })
    return reportOptions
  }

  /**
   * Create new status report and send the user to the edit form
   */
  private async _redirectNewStatusReport(): Promise<void> {
    const [lastReport] = this.state.data.reports
    let properties: TypedHash<string | number | boolean> = {}
    if (lastReport) {
      properties = this.state.data.reportFields
        .filter((field) => field.SchemaXml.indexOf('ReadOnly="TRUE"') === -1)
        .reduce((obj, field) => {
          const fieldValue = lastReport.values[field.InternalName]
          if (fieldValue) obj[field.InternalName] = fieldValue
          return obj
        }, {})
    }
    properties.Title = format(strings.NewStatusReportTitle, this.props.webTitle)
    properties.GtSiteId = this.props.siteId
    properties.GtModerationStatus = strings.GtModerationStatus_Choice_Draft
    Logger.log({
      message: '(ProjectStatus) _redirectNewStatusReport: Created new status report',
      data: { fieldValues: properties },
      level: LogLevel.Info
    })
    const { editFormUrl } = await this._portalDataService.addStatusReport(
      properties,
      this.state.data.properties.templateParameters?.ProjectStatusContentTypeId,
      this.state.data.reportEditFormUrl
    )
    document.location.hash = ''
    document.location.href = editFormUrl
  }

  /**
   * Creates PNG snapshot
   *
   * @param {sting} title Report title
   *
   * @returns PNG file (AttachmentFileInfo) or null
   */
  private async _captureReport(title: string | number | boolean): Promise<AttachmentFileInfo> {
    try {
      const statusReportHtml = document.getElementById('pp-statussection')
      const date = moment().format('YYYY-MM-DD HH:mm')
      const dateStamp = document.createElement('p')
      dateStamp.textContent = `${date}`
      dateStamp.style.textAlign = 'right'
      statusReportHtml.appendChild(dateStamp)
      statusReportHtml.style.backgroundColor = '#FFFFFF'
      const content = await domToImage.toBlob(statusReportHtml)
      const name = `${(title + '_' + date).toString().replace(/\/|\\| |\:/g, '-')}.png`
      return { name, content }
    } catch (error) {
      return null
    }
  }

  /**
   * Publish report
   *
   * @param {StatusReport} report Report
   */
  private async _publishReport(report: StatusReport) {
    if (!this.state.isPublishing) {
      try {
        const attachment = await this._captureReport(report.values.Title)
        const properties = { GtModerationStatus: strings.GtModerationStatus_Choice_Published, GtLastReportDate: moment().format('YYYY-MM-DD HH:mm') }
        await this._portalDataService.updateStatusReport(report.id, properties, attachment)
      } catch (error) {
        Logger.log({
          message: `(ProjectStatus) _publishReport: Failed to publish status report: ${error.message}`,
          level: LogLevel.Info
        })
      }
      document.location.reload()
    }
  }

  /**
   * Delete report
   *
   * @param {StatusReport} report Report
   */
  private async _deleteReport(report: StatusReport) {
    await this._portalDataService.deleteStatusReport(report.id)
    window.location.hash = ''
    document.location.reload()
  }

  /**
   * Fetch data
   */
  private async _fetchData(): Promise<IProjectStatusData> {
    try {
      Logger.log({
        message:
          '(ProjectStatus) _fetchData: Fetching entity data, fields, column config, sections and reports',
        level: LogLevel.Info
      })
      if (!SPDataAdapter.isConfigured) {
        SPDataAdapter.configure(this.context, {
          siteId: this.props.siteId,
          webUrl: this.props.webUrl,
          hubSiteUrl: this.props.hubSite.url,
          logLevel: sessionStorage.DEBUG || DEBUG ? LogLevel.Info : LogLevel.Warning
        })
      }
      const [
        properties,
        reportList,
        reports,
        sections,
        columnConfig,
        reportFields
      ] = await Promise.all([
        SPDataAdapter.project.getPropertiesData(),
        this._portalDataService.getStatusReportListProps(),
        this._portalDataService.getStatusReports({
          publishedString: strings.GtModerationStatus_Choice_Published
        }),
        this._portalDataService.getProjectStatusSections(),
        this._portalDataService.getProjectColumnConfig(),
        this._portalDataService.getListFields(
          'PROJECT_STATUS',
          // eslint-disable-next-line quotes
          "Hidden eq false and Group ne 'Hidden'"
        )
      ])
      const sortedReports = reports
        .map((item) => item.setDefaultEditFormUrl(reportList.DefaultEditFormUrl))
        .sort((a, b) => b.created.getTime() - a.created.getTime())
      const sortedSections = sections.sort((a, b) => (a.sortOrder < b.sortOrder ? -1 : 1))
      return {
        properties,
        reportFields,
        reportEditFormUrl: reportList.DefaultEditFormUrl,
        reports: sortedReports,
        sections: sortedSections,
        columnConfig
      }
    } catch (error) {
      throw strings.ProjectStatusDataErrorText
    }
  }
}

export * from './types'
