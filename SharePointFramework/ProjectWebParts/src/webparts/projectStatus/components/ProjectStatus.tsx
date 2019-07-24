import { dateAdd } from "@pnp/common";
import { Logger, LogLevel } from '@pnp/logging';
import '@pnp/polyfill-ie11';
import { List } from '@pnp/sp';
import { CommandBar } from 'office-ui-fabric-react/lib/CommandBar';
import { ContextualMenuItemType, IContextualMenuItem } from 'office-ui-fabric-react/lib/ContextualMenu';
import { Spinner } from 'office-ui-fabric-react/lib/Spinner';
import * as autobind from 'auto-bind';
import * as strings from 'ProjectStatusWebPartStrings';
import * as React from 'react';
import getObjectValue from '../../../../../@Shared/lib/helpers/getObjectValue';
import ProjectStatusReport, { IProjectStatusReportItem } from '../models/ProjectStatusReport';
import SectionModel, { SectionType } from '../models/SectionModel';
import { IStatusSectionBaseProps } from './@StatusSectionBase/IStatusSectionBaseProps';
import { IProjectStatusProps } from './IProjectStatusProps';
import { IProjectStatusData, IProjectStatusState } from './IProjectStatusState';
import ListSection from './ListSection';
import ProjectPropertiesSection from './ProjectPropertiesSection';
import styles from './ProjectStatus.module.scss';
import StatusSection from './StatusSection';
import SummarySection from './SummarySection';

export default class ProjectStatus extends React.Component<IProjectStatusProps, IProjectStatusState> {
  private _reportList: List;
  private _sectionsList: List;

  /**
   * Constructor
   * 
   * @param {IProjectStatusProps} props Props
   */
  constructor(props: IProjectStatusProps) {
    super(props);
    this.state = {
      isLoading: true,
      associateStatusItem: document.location.hash === '#NewStatus',
    };
    this._reportList = props.hubSite.web.lists.getByTitle(this.props.reportListName) as any;
    this._sectionsList = props.hubSite.web.lists.getByTitle(this.props.sectionsListName) as any;
    autobind.react(this);
  }

  public async componentDidMount() {
    if (this.state.associateStatusItem) {
      await this.associateStatusItem();
    }
    const data = await this.fetchData();
    this.setState({ data, selectedReport: data.reports[0], isLoading: false });
  }


  /**
   * Renders the <ProjectStatus /> component
   */
  public render(): React.ReactElement<IProjectStatusProps> {
    if (this.state.isLoading) {
      return (
        <div className={styles.projectStatus}>
          <div className={styles.container}>
            <Spinner label={strings.LoadingText} />
          </div>
        </div>
      );
    }

    return (
      <div className={styles.projectStatus}>
        <div className={styles.container}>
          {this.renderCommandBar()}
          <div className={`${styles.header} ${styles.column12}`}>
            <div className={styles.title}>{this.props.title}</div>
          </div>

          <div className={`${styles.sections} ${styles.column12}`}>
            {this.state.selectedReport && this.renderSections()}
          </div>
        </div>
      </div>
    );
  }

  private renderCommandBar() {
    let reportOptions = this.getReportOptions();
    let items: IContextualMenuItem[] = [
      {
        key: 'NewStatusReport',
        name: strings.NewStatusReportModalHeaderText,
        itemType: ContextualMenuItemType.Normal,
        iconProps: { iconName: 'NewFolder' },
        href: this.getReportNewFormUrl(),
      },
      {
        key: 'EditReport',
        name: strings.EditReportButtonText,
        itemType: ContextualMenuItemType.Normal,
        iconProps: { iconName: 'Edit' },
        href: this.getSelectedReportEditFormUrl(),
        disabled: !this.state.selectedReport,
      },
    ];
    let farItems: IContextualMenuItem[] = [
      {
        key: 'ReportDropdown',
        name: this.state.selectedReport ? this.state.selectedReport.toString() : '',
        itemType: ContextualMenuItemType.Normal,
        disabled: reportOptions.length === 0,
        subMenuProps: { items: reportOptions }
      },
    ];
    return (
      <CommandBar items={items} farItems={farItems} />
    );
  }

  /**
   * Associate status item
   */
  private async associateStatusItem(): Promise<void> {
    const siteId = this.props.pageContext.site.id.toString();
    let item: IProjectStatusReportItem;
    try {
      const dateTime = dateAdd(new Date(), 'minute', -1).toISOString();
      [item] = await this._reportList.items
        .filter(`AuthorId eq ${this.props.pageContext.legacyPageContext.userId} and GtSiteId ne '${siteId}' and Created ge datetime'${dateTime}'`)
        .select('Id', 'GtMonthChoice', 'Created')
        .orderBy('Id', false)
        .top(1)
        .get<IProjectStatusReportItem[]>();
    } catch (error) { }
    if (item) {
      const report = new ProjectStatusReport(item);
      await this._reportList.items.getById(item.Id).update({
        Title: `${this.props.pageContext.web.title} (${report.toString()})`,
        GtSiteId: siteId,
      });
    }
    document.location.hash = '#';
  }

  /**
   * Get section base props
   * 
   * @param {SectionModel} model Section model
   */
  private getSectionBaseProps(model: SectionModel): IStatusSectionBaseProps {
    const { pageContext, hubSite } = this.props;
    const { selectedReport, data } = this.state;
    const baseProps: IStatusSectionBaseProps = {
      headerProps: {
        label: model.name,
        value: selectedReport.item[model.fieldName],
        comment: selectedReport.item[model.commentFieldName],
        iconName: model.iconName,
        iconSize: 50
      },
      report: selectedReport,
      model,
      pageContext,
      hubSite,
      data,
    };
    return baseProps;
  }

  /**
   * Render sections
   */
  private renderSections() {
    let sortedSections = this.state.data.sections.sort((a, b) => a.sortOrder < b.sortOrder ? -1 : 1);
    return sortedSections.map(model => {
      const baseProps = this.getSectionBaseProps(model);
      switch (model.type) {
        case SectionType.SummarySection: {
          return (
            <SummarySection
              {...baseProps}
              entity={this.props.entity}
              sections={sortedSections} />
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
   * Get selected report edit form url
   */
  private getSelectedReportEditFormUrl(): string {
    return [
      `${window.location.protocol}//${window.location.hostname}`,
      getObjectValue(this.state, 'data.reportListProps.DefaultEditFormUrl', ''),
      `?ID=`,
      getObjectValue(this.state, 'selectedReport.item.Id', ''),
      `&Source=`,
      encodeURIComponent(window.location.href),
    ].join('');
  }

  /**
   * Get report new form url
   */
  private getReportNewFormUrl(): string {
    return [
      `${window.location.protocol}//${window.location.hostname}`,
      getObjectValue(this.state, 'data.reportListProps.DefaultNewFormUrl', ''),
      `?Source=`,
      encodeURIComponent(`${window.location.href.split('#')[0]}#NewStatus`)
    ].join('');
  }

  /**
   * On report changed
   * 
   * @param {ProjectStatusReport} report Report
   */
  private onReportChanged(report: ProjectStatusReport) {
    this.setState({ selectedReport: report });
  }

  /**
   * Get report options
   */
  private getReportOptions(): IContextualMenuItem[] {
    const reports = getObjectValue<ProjectStatusReport[]>(this.state, 'data.reports', []);
    let reportOptions: IContextualMenuItem[] = reports.map((report, idx) => ({
      key: `${idx}`,
      name: report.toString(),
      onClick: _ => this.onReportChanged(report),
      canCheck: true,
      isChecked: this.state.selectedReport ? report.item.Id === this.state.selectedReport.item.Id : false,
    } as IContextualMenuItem));
    return reportOptions;
  }

  /**
   * Fetch data
   */
  private async fetchData(): Promise<IProjectStatusData> {
    const siteId = this.props.pageContext.site.id.toString();
    Logger.log({ message: '(ProjectStatus) fetchData: Fetching fields and reports', data: {}, level: LogLevel.Info });
    const [entityItem, entityFields] = await Promise.all([
      this.props.spEntityPortalService.getEntityItemFieldValues(siteId),
      this.props.spEntityPortalService.getEntityFields(),
    ]);
    let reportListProps = await this._reportList
      .select('DefaultEditFormUrl', 'DefaultNewFormUrl')
      .expand('DefaultEditFormUrl', 'DefaultNewFormUrl')
      .get<{ DefaultEditFormUrl: string, DefaultNewFormUrl: string }>();
    const [reportItems, sectionItems] = await Promise.all([
      this._reportList.items.filter(`GtSiteId eq '${siteId}'`).get<IProjectStatusReportItem[]>(),
      this._sectionsList.items.get(),
    ]);
    const reports = reportItems.map(r => new ProjectStatusReport(r));
    const sections = sectionItems.map(s => new SectionModel(s));
    return { entityFields, entityItem, reportListProps, reports, sections };
  }
}

export { IProjectStatusProps };
