import { UrlQueryParameterCollection } from '@microsoft/sp-core-library';
import { PageContext } from '@microsoft/sp-page-context';
import { dateAdd } from '@pnp/common';
import { Logger, LogLevel } from '@pnp/logging';
import { List, Web } from '@pnp/sp';
import { getId } from '@uifabric/utilities';
import { ProjectStatusReport, SectionModel } from 'models';
import { SectionType } from 'models/SectionModel';
import { CommandBar } from 'office-ui-fabric-react/lib/CommandBar';
import { ContextualMenuItemType, IContextualMenuItem } from 'office-ui-fabric-react/lib/ContextualMenu';
import { MessageBar, MessageBarType } from 'office-ui-fabric-react/lib/MessageBar';
import { Spinner } from 'office-ui-fabric-react/lib/Spinner';
import * as strings from 'ProjectWebPartsStrings';
import * as React from 'react';
import { formatDate } from 'shared/lib/helpers';
import { HubConfigurationService } from 'shared/lib/services';
import { parseUrlHash, setUrlHash } from 'shared/lib/util';
import { SpEntityPortalService } from 'sp-entityportal-service';
import * as format from 'string-format';
import SPDataAdapter from '../../data';
import { IStatusSectionBaseProps } from './@StatusSectionBase/IStatusSectionBaseProps';
import { IProjectStatusData } from './IProjectStatusData';
import { IProjectStatusProps } from './IProjectStatusProps';
import { IProjectStatusHashState, IProjectStatusState } from './IProjectStatusState';
import ListSection from './ListSection';
import ProjectPropertiesSection from './ProjectPropertiesSection';
import styles from './ProjectStatus.module.scss';
import StatusSection from './StatusSection';
import SummarySection from './SummarySection';

export class ProjectStatus extends React.Component<IProjectStatusProps, IProjectStatusState> {
  private _reportList: List;
  private _sectionsList: List;
  private _hubConfigurationService: HubConfigurationService;
  private _spEntityPortalService: SpEntityPortalService;

  /**
   * Constructor
   * 
   * @param {IProjectStatusProps} props Props
   */
  constructor(props: IProjectStatusProps) {
    super(props);
    this.state = {
      isLoading: true,
      newStatusCreated: document.location.hash === '#NewStatus',
    };
    this._reportList = new Web(props.hubSiteUrl).lists.getByTitle(props.reportListName);
    this._sectionsList = new Web(props.hubSiteUrl).lists.getByTitle(props.sectionsListName);
    this._hubConfigurationService = new HubConfigurationService(props.hubSiteUrl);
    this._spEntityPortalService = new SpEntityPortalService({
      webUrl: props.hubSiteUrl,
      fieldPrefix: 'Gt',
      ...props.entity,
    });
    SPDataAdapter.configure({
      spEntityPortalService: this._spEntityPortalService,
      siteId: props.siteId,
      webUrl: props.webUrl,
      hubSiteUrl: props.hubSiteUrl,
    });
  }

  public async componentDidMount() {
    if (this.state.newStatusCreated) {
      await this._associateStatusItem();
    }
    try {
      const data = await this._fetchData();
      let selectedReport = data.reports[0];
      const hashState = parseUrlHash<IProjectStatusHashState>();
      const urlQueryParameterCollection = new UrlQueryParameterCollection(document.location.href);
      const selectedReportUrlParam = urlQueryParameterCollection.getValue('selectedReport');
      const sourceUrlParam = urlQueryParameterCollection.getValue('Source');
      if (hashState.selectedReport) {
        [selectedReport] = data.reports.filter(report => report.id === parseInt(hashState.selectedReport, 10));
      } else if (selectedReportUrlParam) {
        [selectedReport] = data.reports.filter(report => report.id === parseInt(selectedReportUrlParam, 10));
      }
      this.setState({ data, selectedReport, sourceUrl: decodeURIComponent(sourceUrlParam || ''), isLoading: false });
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
            <Spinner label={format(strings.LoadingText, this.props.title)} />
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
            {this.state.selectedReport && this._renderSections()}
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
        disabled: !selectedReport,
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
      name: selectedReport ? formatDate(selectedReport.date, true) : '',
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
  private _getSectionBaseProps(sec: SectionModel): IStatusSectionBaseProps {
    const { selectedReport: report, data } = this.state;
    const value = report.item[sec.fieldName];
    const comment = report.item[sec.commentFieldName];
    const [columnConfig] = data.columnConfig.filter(c => c.columnFieldName === sec.fieldName && c.value === value);
    const baseProps: IStatusSectionBaseProps = {
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
      hubSiteUrl: this.props.hubSiteUrl,
      siteId: this.props.siteId,
      webUrl: this.props.webUrl,
    };
    return baseProps;
  }

  /**
   * Render sections
   */
  private _renderSections() {
    return this.state.data.sections.map(model => {
      const baseProps = this._getSectionBaseProps(model);
      switch (model.type) {
        case SectionType.SummarySection: {
          return (
            <SummarySection
              {...baseProps}
              entity={this.props.entity}
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
              entityItem={this.state.data.entityItem}
              entityFields={this.state.data.entityFields} />
          );
        }
        case SectionType.RiskSection: {
          return <ListSection {...baseProps} />;
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
   * @param {ProjectStatusReport} selectedReport Selected report
   */
  private _onReportChanged(selectedReport: ProjectStatusReport) {
    this.setState({ selectedReport });
  }

  /**
   * Get report options
   */
  private _getReportOptions(data: IProjectStatusData): IContextualMenuItem[] {
    let reportOptions: IContextualMenuItem[] = data.reports.map(report => ({
      key: `${report.id}`,
      name: formatDate(report.date, true),
      onClick: _evt => this._onReportChanged(report),
      canCheck: true,
      isChecked: this.state.selectedReport ? report.item.Id === this.state.selectedReport.item.Id : false,
    } as IContextualMenuItem));
    return reportOptions;
  }

  /**
   * Associate status item
   */
  private async _associateStatusItem(): Promise<void> {
    try {
      const filter = `Author/EMail eq '${this.props.currentUserEmail}' and GtSiteId eq '00000000-0000-0000-0000-000000000000'`;
      Logger.log({ message: `(ProjectStatus) _associateStatusItem: Attempting to find recently added report by current user '${this.props.currentUserEmail}'`, data: { filter }, level: LogLevel.Info });
      let [item] = await this._reportList.items.filter(filter).select('Id', 'Created').orderBy('Id', false).top(1).get<any[]>();
      if (item) {
        const report = new ProjectStatusReport(item);
        Logger.log({ message: '(ProjectStatus) _associateStatusItem: Setting title for item', data: { filter }, level: LogLevel.Info });
        await this._reportList.items.getById(report.id).update({
          Title: `${this.props.webTitle} (${formatDate(report.date, true)})`,
          GtSiteId: this.props.siteId,
        });
      }
    } catch (error) { }
    document.location.hash = '#';
  }

  /**
   * Create new status report and send the user to the edit form
   * 
   * @param {React.MouseEvent} _ev Event
   * @param {IContextualMenuItem} _item Item
   */
  private async _redirectNewStatusReport(_ev?: React.MouseEvent<HTMLElement, MouseEvent> | React.KeyboardEvent<HTMLElement>, _item?: IContextualMenuItem): Promise<void> {
    const [previousReport] = this.state.data.reports;
    let properties = previousReport ? previousReport.getStatusValues() : {};
    properties.Title = format(strings.NewStatusReportTitle, this.props.webTitle);
    const { data } = await this._reportList.items.add(properties);
    const source = encodeURIComponent(`${window.location.href.split('#')[0]}#NewStatus`);
    document.location.href = `${window.location.protocol}//${window.location.hostname}${this.state.data.defaultEditFormUrl}?ID=${data.Id}&Source=${source}`;
  }

  /**
   * Fetch data
   */
  private async _fetchData(): Promise<IProjectStatusData> {
    try {
      Logger.log({ message: '(ProjectStatus) _fetchData: Fetching fields and reports', level: LogLevel.Info });
      const [entity, reportList, reportItems, sectionItems, columnConfig] = await Promise.all([
        this._spEntityPortalService.fetchEntity(this.props.siteId, this.props.webUrl),
        this._reportList
          .select('DefaultEditFormUrl')
          .expand('DefaultEditFormUrl')
          .usingCaching({
            key: 'projectstatus_defaulteditformurl',
            storeName: 'session',
            expiration: dateAdd(new Date(), 'day', 1),
          })
          .get<{ DefaultEditFormUrl: string }>(),
        this._reportList.items
          .filter(`GtSiteId eq '${this.props.siteId}'`)
          .orderBy('Id', false)
          .get<any[]>(),
        this._sectionsList.items.get(),
        this._hubConfigurationService.getProjectColumnConfig(),
      ]);
      const reports = reportItems.map(item => new ProjectStatusReport(item, reportList.DefaultEditFormUrl));
      const reportsSorted = reports.sort((a, b) => b.date.getTime() - a.date.getTime());
      const sections = sectionItems.map(item => new SectionModel(item));
      const sectionsSorted = sections.sort((a, b) => a.sortOrder < b.sortOrder ? -1 : 1);
      return {
        entityFields: entity.fields,
        entityItem: entity.fieldValues,
        defaultEditFormUrl: reportList.DefaultEditFormUrl,
        reports: reportsSorted,
        sections: sectionsSorted,
        columnConfig,
      };
    } catch (error) {
      throw strings.ProjectStatusDataErrorText;
    }
  }
}

export { IProjectStatusProps };

