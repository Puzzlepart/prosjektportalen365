import { TypedHash } from '@pnp/common';
import { Logger, LogLevel } from '@pnp/logging';
import { getId } from '@uifabric/utilities';
import { UserMessage } from 'components/UserMessage';
import { CommandBar } from 'office-ui-fabric-react/lib/CommandBar';
import { ContextualMenuItemType, IContextualMenuItem } from 'office-ui-fabric-react/lib/ContextualMenu';
import { MessageBar, MessageBarType } from 'office-ui-fabric-react/lib/MessageBar';
import { Spinner } from 'office-ui-fabric-react/lib/Spinner';
import * as strings from 'ProjectWebPartsStrings';
import * as React from 'react';
import { formatDate } from 'shared/lib/helpers';
import { SectionModel, SectionType, StatusReport } from 'shared/lib/models';
import { PortalDataService } from 'shared/lib/services';
import { getUrlParam, parseUrlHash, setUrlHash } from 'shared/lib/util';
import { SpEntityPortalService } from 'sp-entityportal-service';
import * as formatString from 'string-format';
import { IProjectStatusData } from './IProjectStatusData';
import { IProjectStatusHashState } from './IProjectStatusHashState';
import { IProjectStatusProps } from './IProjectStatusProps';
import { IProjectStatusState } from './IProjectStatusState';
import styles from './ProjectStatus.module.scss';
import { IBaseSectionProps, ListSection, ProjectPropertiesSection, RiskSection, StatusSection, SummarySection } from './Sections';

export class ProjectStatus extends React.Component<IProjectStatusProps, IProjectStatusState> {
  private _portalDataService: PortalDataService;
  private _entityService: SpEntityPortalService;

  /**
   * Constructor
   * 
   * @param {IProjectStatusProps} props Props
   */
  constructor(props: IProjectStatusProps) {
    super(props);
    this.state = { isLoading: true };
    this._portalDataService = new PortalDataService().configure({ urlOrWeb: props.hubSite.web, siteId: props.siteId });
    this._entityService = new SpEntityPortalService({
      portalUrl: this.props.hubSite.url,
      listName: strings.ProjectsListName,
      contentTypeId: '0x0100805E9E4FEAAB4F0EABAB2600D30DB70C',
      identityFieldName: 'GtSiteId',
      urlFieldName: 'GtSiteUrl',
    });
  }

  public async componentDidMount() {
    try {
      const data = await this._fetchData();
      let selectedReport = data.reports[0];
      const hashState = parseUrlHash<IProjectStatusHashState>();
      const selectedReportUrlParam = getUrlParam('selectedReport');
      const sourceUrlParam = getUrlParam('Source');
      if (hashState.selectedReport) {
        [selectedReport] = data.reports.filter(report => report.id === parseInt(hashState.selectedReport, 10));
      } else if (selectedReportUrlParam) {
        [selectedReport] = data.reports.filter(report => report.id === parseInt(selectedReportUrlParam, 10));
      }
      this.setState({
        data,
        selectedReport: data.reports[0],
        sourceUrl: decodeURIComponent(sourceUrlParam || ''),
        isLoading: false,
      });
    } catch (error) {
      this.setState({ error, isLoading: false });
    }
  }

  public componentWillUpdate(_: IProjectStatusProps, { selectedReport }: IProjectStatusState) {
    let obj: IProjectStatusHashState = {};
    if (selectedReport) {
      obj.selectedReport = selectedReport.id.toString();
    }
    setUrlHash<IProjectStatusHashState>(obj);
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
      );
    }

    if (this.state.error) {
      return (
        <div className={styles.projectStatus}>
          <div className={styles.container}>
            <MessageBar messageBarType={MessageBarType.error}>{this.state.error}</MessageBar>
          </div>
        </div>
      );
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
    );
  }

  private _commandBar() {
    const { data, selectedReport, sourceUrl } = this.state;
    const reportOptions = this._getReportOptions(data);
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
        onClick: _ => { this._publishReport(selectedReport); },
      },
    ];
    let farItems: IContextualMenuItem[] = [];
    if (this.state.sourceUrl) {
      farItems.push({
        id: getId('NavigateToSourceUrl'),
        key: getId('NavigateToSourceUrl'),
        name: strings.NavigateToSourceUrlText,
        iconProps: { iconName: 'NavigateBack' },
        href: sourceUrl,
      });
    }
    farItems.push({
      id: getId('ReportDropdown'),
      key: getId('ReportDropdown'),
      name: selectedReport ? formatDate(selectedReport.created, true) : '',
      itemType: ContextualMenuItemType.Normal,
      disabled: reportOptions.length === 0,
      subMenuProps: { items: reportOptions }
    });
    return (
      <CommandBar items={items} farItems={farItems} />
    );
  }

  /**
   * Get section base props
   * 
   * @param {SectionModel} sec Section model
   */
  private _getSectionBaseProps(sec: SectionModel): IBaseSectionProps {
    const { selectedReport: report, data } = this.state;
    const { value, comment } = report.getStatusValue(sec.fieldName);
    const [columnConfig] = data.columnConfig.filter(c => c.columnFieldName === sec.fieldName && c.value === value);
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
    };
    return baseProps;
  }

  /**
   * Render sections
   */
  private _renderSections() {
    if (!this.state.selectedReport) {
      return <UserMessage text={strings.NoStatusReportsMessage} messageBarType={MessageBarType.info} />;
    }
    return this.state.data.sections.map(model => {
      const baseProps = this._getSectionBaseProps(model);
      switch (model.type) {
        case SectionType.SummarySection: {
          return (
            <SummarySection
              {...baseProps}
              sections={this.state.data.sections}
              columnConfig={this.state.data.columnConfig} />
          );
        }
        case SectionType.StatusSection: {
          return <StatusSection {...baseProps} />;
        }
        case SectionType.ProjectPropertiesSection: {
          return (
            <ProjectPropertiesSection
              {...baseProps}
              fieldValues={{ ...this.state.data.entity.fieldValues, ...this.state.selectedReport.fieldValues }}
              fields={[...this.state.data.entity.fields, ...this.state.data.reportFields]} />
          );
        }
        case SectionType.RiskSection: {
          return (
            <RiskSection
              {...baseProps}
              riskMatrix={{
                width: this.props.riskMatrixWidth,
                height: this.props.riskMatrixHeight,
                calloutTemplate: this.props.riskMatrixCalloutTemplate,
              }} />
          );
        }
        case SectionType.ListSection: {
          return <ListSection {...baseProps} />;
        }
        default: {
          return null;
        }
      }
    });
  }

  /**
   * On report changed
   * 
   * @param {StatusReport} selectedReport Selected report
   */
  private _onReportChanged(selectedReport: StatusReport) {
    this.setState({ selectedReport });
  }

  /**
   * Get report options
   * 
   * @param {IProjectStatusData} data Data
   */
  private _getReportOptions(data: IProjectStatusData): IContextualMenuItem[] {
    let reportOptions: IContextualMenuItem[] = data.reports.map(report => ({
      key: `${report.id}`,
      name: formatDate(report.created, true),
      onClick: _evt => this._onReportChanged(report),
      canCheck: true,
      isChecked: this.state.selectedReport ? report.id === this.state.selectedReport.id : false,
    } as IContextualMenuItem));
    return reportOptions;
  }

  /**
   * Create new status report and send the user to the edit form
   * 
   * @param {React.MouseEvent | React.KeyboardEvent} _ev Event
   * @param {IContextualMenuItem} _item Item
   */
  private async _redirectNewStatusReport(_ev?: React.MouseEvent<any> | React.KeyboardEvent<any>, _item?: IContextualMenuItem): Promise<void> {
    const [previousReport] = this.state.data.reports;
    let properties: TypedHash<any> = previousReport ? previousReport.statusValues : {};
    properties.Title = formatString(strings.NewStatusReportTitle, this.props.webTitle);
    properties.GtSiteId = this.props.siteId;
    if (previousReport) {
      Logger.log({ message: '(ProjectStatus) _redirectNewStatusReport: Copying budget numbers from previous report', data: { id: previousReport.id, budgetNumbers: previousReport.budgetNumbers }, level: LogLevel.Info });
      properties = { ...properties, ...previousReport.budgetNumbers };
    }
    properties.GtModerationStatus = strings.GtModerationStatus_Choice_Draft;
    Logger.log({ message: '(ProjectStatus) _redirectNewStatusReport: Created new status report', data: { properties }, level: LogLevel.Info });
    const newReportId = await this._portalDataService.addStatusReport(properties);
    document.location.href = `${window.location.protocol}//${window.location.hostname}${this.state.data.reportEditFormUrl}?ID=${newReportId}&Source=${encodeURIComponent(window.location.href)}`;
  }

  /**
   * Publish report
   * 
   * @param {StatusReport} report Report
   */
  private async _publishReport(report: StatusReport) {
    await this._portalDataService.updateStatusReport(report.id, { GtModerationStatus: strings.GtModerationStatus_Choice_Published });
    document.location.reload();
  }

  /**
   * Fetch data
   */
  private async _fetchData(): Promise<IProjectStatusData> {
    try {
      Logger.log({ message: '(ProjectStatus) _fetchData: Fetching entity data, fields, column config, sections and reports', level: LogLevel.Info });
      let [
        entity,
        reportList,
        reports,
        sections,
        columnConfig,
        reportFields,
      ] = await Promise.all([
        this._entityService.fetchEntity(this.props.siteId, this.props.webUrl),
        this._portalDataService.getStatusReportListProps(),
        this._portalDataService.getStatusReports(),
        this._portalDataService.getProjectStatusSections(),
        this._portalDataService.getProjectColumnConfig(),
        this._portalDataService.getListFields('PROJECT_STATUS'),
      ]);
      reports = reports.map(item => item.setDefaultEditFormUrl(reportList.DefaultEditFormUrl));
      reports = reports.sort((a, b) => b.created.getTime() - a.created.getTime());
      sections = sections.sort((a, b) => a.sortOrder < b.sortOrder ? -1 : 1);
      return {
        entity,
        reportFields,
        reportEditFormUrl: reportList.DefaultEditFormUrl,
        reports,
        sections,
        columnConfig,
      };
    } catch (error) {
      throw strings.ProjectStatusDataErrorText;
    }
  }
}

export { IProjectStatusProps };

