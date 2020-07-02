import { TypedHash } from '@pnp/common'
import { Logger, LogLevel } from '@pnp/logging'
import { getId } from '@uifabric/utilities'
import { UserMessage } from 'components/UserMessage'
import { CommandBar } from 'office-ui-fabric-react/lib/CommandBar'
import { ContextualMenuItemType, IContextualMenuItem } from 'office-ui-fabric-react/lib/ContextualMenu'
import { MessageBar, MessageBarType } from 'office-ui-fabric-react/lib/MessageBar'
import { Spinner } from 'office-ui-fabric-react/lib/Spinner'
import * as strings from 'ProjectWebPartsStrings'
import * as React from 'react'
import { formatDate } from 'shared/lib/helpers'
import { SectionModel, SectionType, StatusReport } from 'shared/lib/models'
import { PortalDataService } from 'shared/lib/services'
import { getUrlParam, parseUrlHash, setUrlHash } from 'shared/lib/util'
import * as formatString from 'string-format'
import SPDataAdapter from '../../data'
import { IProjectStatusData } from './IProjectStatusData'
import { IProjectStatusHashState } from './IProjectStatusHashState'
import { IProjectStatusProps } from './IProjectStatusProps'
import { IProjectStatusState } from './IProjectStatusState'
import styles from './ProjectStatus.module.scss'
import { IBaseSectionProps, ListSection, ProjectPropertiesSection, RiskSection, StatusSection, SummarySection } from './Sections'

export class ProjectStatus extends React.Component<IProjectStatusProps, IProjectStatusState> {
  private _portalDataService: PortalDataService

  /**
   * Constructor
   * 
   * @param {IProjectStatusProps} props Props
   */
  constructor(props: IProjectStatusProps) {
    super(props)
    this.state = { isLoading: true }
    this._portalDataService = new PortalDataService().configure({ urlOrWeb: props.hubSite.web, siteId: props.siteId })
  }

  public async componentDidMount() {
    try {
      const data = await this._fetchData()
      let selectedReport = data.reports[0]
      const hashState = parseUrlHash<IProjectStatusHashState>()
      const selectedReportUrlParam = getUrlParam('selectedReport')
      const sourceUrlParam = getUrlParam('Source')
      if (hashState.selectedReport) {
        [selectedReport] = data.reports.filter(report => report.id === parseInt(hashState.selectedReport, 10))
      } else if (selectedReportUrlParam) {
        [selectedReport] = data.reports.filter(report => report.id === parseInt(selectedReportUrlParam, 10))
      }
      this.setState({
        data,
        selectedReport,
        sourceUrl: decodeURIComponent(sourceUrlParam || ''),
        isLoading: false,
      })
    } catch (error) {
      this.setState({ error, isLoading: false })
    }
  }

  public componentWillUpdate(_: IProjectStatusProps, { selectedReport }: IProjectStatusState) {
    const obj: IProjectStatusHashState = {}
    if (selectedReport) obj.selectedReport = selectedReport.id.toString()
    setUrlHash<IProjectStatusHashState>(obj)
  }

  /**
   * Renders the <ProjectStatus /> component
   */
  public render(): React.ReactElement<IProjectStatusProps> {
    if (this.state.isLoading) {
      return (
        <div className={styles.projectStatus}>
          <div className={styles.container}>
            <Spinner label={formatString(strings.LoadingText, this.props.title)} />
          </div>
        </div>
      )
    }

    if (this.state.error) {
      return (
        <div className={styles.projectStatus}>
          <div className={styles.container}>
            <MessageBar messageBarType={MessageBarType.error}>{this.state.error}</MessageBar>
          </div>
        </div>
      )
    }

    return (
      <div className={styles.projectStatus}>
        {this._commandBar()}
        <div className={styles.container}>
          <div className={`${styles.header} ${styles.column12}`}>
            <div className={styles.title}>{this.props.title}</div>
          </div>
          <div className={`${styles.sections} ${styles.column12}`}>
            {this._renderSections()}
          </div>
        </div>
      </div>
    )
  }

  private _commandBar() {
    const { data, selectedReport, sourceUrl } = this.state
    const reportOptions = this._getReportOptions(data)
    const items: IContextualMenuItem[] = [
      {
        id: getId('NewStatusReport'),
        key: getId('NewStatusReport'),
        name: strings.NewStatusReportModalHeaderText,
        iconProps: { iconName: 'NewFolder' },
        onClick: this._redirectNewStatusReport.bind(this),
      },
      {
        id: getId('EditReport'),
        key: getId('EditReport'),
        name: strings.EditReportButtonText,
        iconProps: { iconName: 'Edit' },
        href: selectedReport ? selectedReport.editFormUrl : null,
        disabled: !selectedReport || selectedReport.moderationStatus === strings.GtModerationStatus_Choice_Published,
      },
      {
        id: getId('PublishReport'),
        key: getId('PublishReport'),
        name: strings.PublishReportButtonText,
        iconProps: { iconName: 'PublishContent' },
        disabled: !selectedReport || selectedReport.moderationStatus === strings.GtModerationStatus_Choice_Published,
        onClick: () => { this._publishReport(selectedReport) },
      },
    ]
    const farItems: IContextualMenuItem[] = []
    if (this.state.sourceUrl) {
      farItems.push({
        id: getId('NavigateToSourceUrl'),
        key: getId('NavigateToSourceUrl'),
        name: strings.NavigateToSourceUrlText,
        iconProps: { iconName: 'NavigateBack' },
        href: sourceUrl,
      })
    }
    farItems.push({
      id: getId('ReportDropdown'),
      key: getId('ReportDropdown'),
      name: selectedReport ? formatDate(selectedReport.created, true) : '',
      itemType: ContextualMenuItemType.Normal,
      disabled: reportOptions.length === 0,
      subMenuProps: { items: reportOptions }
    })
    return (
      <CommandBar items={items} farItems={farItems} />
    )
  }

  /**
   * Get section base props
   * 
   * @param {SectionModel} sec Section model
   */
  private _getSectionBaseProps(sec: SectionModel): IBaseSectionProps {
    const { selectedReport: report, data } = this.state
    const { value, comment } = report.getStatusValue(sec.fieldName)
    const [columnConfig] = data.columnConfig.filter(c => c.columnFieldName === sec.fieldName && c.value === value)
    const baseProps: IBaseSectionProps = {
      headerProps: {
        label: sec.name,
        value,
        comment,
        iconName: sec.iconName,
        iconSize: 50,
        iconColor: columnConfig ? columnConfig.color : '#444',
      },
      report,
      model: sec,
      data: this.state.data,
      hubSiteUrl: this.props.hubSite.url,
      siteId: this.props.siteId,
      webUrl: this.props.webUrl,
    }
    return baseProps
  }

  /**
   * Render sections
   */
  private _renderSections() {
    const { riskMatrixWidth, riskMatrixHeight, riskMatrixCalloutTemplate } = this.props
    const { data, selectedReport } = this.state

    if (!selectedReport) return <UserMessage text={strings.NoStatusReportsMessage} messageBarType={MessageBarType.info} />
    return data.sections
      .filter(sec => sec.showAsSection || sec.type === SectionType.SummarySection)
      .map(sec => {
        const baseProps = this._getSectionBaseProps(sec)
        switch (sec.type) {
          case SectionType.SummarySection: {
            return (
              <SummarySection
                {...baseProps}
                sections={data.sections.filter(s => s.showInStatusSection || s.type === SectionType.SummarySection)}
                columnConfig={data.columnConfig} />
            )
          }
          case SectionType.StatusSection: {
            return <StatusSection {...baseProps} />
          }
          case SectionType.ProjectPropertiesSection: {
            return (
              <ProjectPropertiesSection
                {...baseProps}
                fieldValues={{ ...data.properties.fieldValues, ...selectedReport.fieldValues }}
                fields={[...data.properties.fields, ...data.reportFields]}
                fieldWidth={this.props.fieldWidth} />
            )
          }
          case SectionType.RiskSection: {
            return (
              <RiskSection
                {...baseProps}
                riskMatrix={{
                  width: riskMatrixWidth,
                  height: riskMatrixHeight,
                  calloutTemplate: riskMatrixCalloutTemplate,
                }} />
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
    const reportOptions: IContextualMenuItem[] = data.reports.map(report => ({
      key: `${report.id}`,
      name: formatDate(report.created, true),
      onClick: () => this._onReportChanged(report),
      canCheck: true,
      isChecked: this.state.selectedReport ? report.id === this.state.selectedReport.id : false,
    } as IContextualMenuItem))
    return reportOptions
  }

  /**
   * Create new status report and send the user to the edit form
   */
  private async _redirectNewStatusReport(): Promise<void> {
    const { webTitle, siteId } = this.props
    const { reports, reportFields, properties, reportEditFormUrl } = this.state.data
    const [previousReport] = reports
    const fieldValues: TypedHash<string | number | boolean> = reportFields
      .filter(field => field.SchemaXml.indexOf('ReadOnly="TRUE"') === -1)
      .reduce((obj, field) => {
        const fieldValue = previousReport.values[field.InternalName]
        if (fieldValue) obj[field.InternalName] = fieldValue
        return obj
      }, {})
    fieldValues.Title = formatString(strings.NewStatusReportTitle, webTitle)
    fieldValues.GtSiteId = siteId
    fieldValues.ContentTypeId = properties.templateParameters.ProjectStatusContentTypeId
    fieldValues.GtModerationStatus = strings.GtModerationStatus_Choice_Draft
    Logger.log({ message: '(ProjectStatus) _redirectNewStatusReport: Created new status report', data: { fieldValues }, level: LogLevel.Info })
    const newReport = await this._portalDataService.addStatusReport(fieldValues, reportEditFormUrl)
    document.location.href = newReport.editFormUrl
  }

  /**
   * Publish report
   * 
   * @param {StatusReport} report Report
   */
  private async _publishReport(report: StatusReport) {
    await this._portalDataService.updateStatusReport(report.id, { GtModerationStatus: strings.GtModerationStatus_Choice_Published })
    document.location.reload()
  }

  /**
   * Fetch data
   */
  private async _fetchData(): Promise<IProjectStatusData> {
    try {
      Logger.log({ message: '(ProjectStatus) _fetchData: Fetching entity data, fields, column config, sections and reports', level: LogLevel.Info })
      if (!SPDataAdapter.isConfigured) {
        SPDataAdapter.configure(this.context, {
          siteId: this.props.siteId,
          webUrl: this.props.webUrl,
          hubSiteUrl: this.props.hubSite.url,
          logLevel: (sessionStorage.DEBUG || DEBUG) ? LogLevel.Info : LogLevel.Warning,
        })
      }
      const [
        properties,
        reportList,
        reports,
        sections,
        columnConfig,
        reportFields,
      ] = await Promise.all([
        SPDataAdapter.project.getPropertiesData(),
        this._portalDataService.getStatusReportListProps(),
        this._portalDataService.getStatusReports(),
        this._portalDataService.getProjectStatusSections(),
        this._portalDataService.getProjectColumnConfig(),
        this._portalDataService.getListFields('PROJECT_STATUS', 'Hidden eq false and Group ne \'Hidden\''),
      ])
      const sortedReports = reports
        .map(item => item.setDefaultEditFormUrl(reportList.DefaultEditFormUrl))
        .sort((a, b) => b.created.getTime() - a.created.getTime())
      const sortedSections = sections.sort((a, b) => a.sortOrder < b.sortOrder ? -1 : 1)
      return {
        properties,
        reportFields,
        reportEditFormUrl: reportList.DefaultEditFormUrl,
        reports: sortedReports,
        sections: sortedSections,
        columnConfig,
      }
    } catch (error) {
      throw strings.ProjectStatusDataErrorText
    }
  }
}

export { IProjectStatusProps }

