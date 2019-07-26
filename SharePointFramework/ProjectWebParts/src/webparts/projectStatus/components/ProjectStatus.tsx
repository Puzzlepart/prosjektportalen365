import { dateAdd } from "@pnp/common";
import { Logger, LogLevel } from '@pnp/logging';
import '@pnp/polyfill-ie11';
import { List } from '@pnp/sp';
import { CommandBar } from 'office-ui-fabric-react/lib/CommandBar';
import { ContextualMenuItemType, IContextualMenuItem } from 'office-ui-fabric-react/lib/ContextualMenu';
import { Spinner } from 'office-ui-fabric-react/lib/Spinner';
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
import { PageContext } from '@microsoft/sp-page-context';

export default class ProjectStatus extends React.Component<IProjectStatusProps, IProjectStatusState> {
  private reportList: List;
  private sectionsList: List;

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
    this.reportList = props.hubSite.web.lists.getByTitle(this.props.reportListName);
    this.sectionsList = props.hubSite.web.lists.getByTitle(this.props.sectionsListName);
  }

  public async componentDidMount() {
    if (this.state.newStatusCreated) {
      await this.associateStatusItem(this.props.pageContext);
    }
    try {
      const data = await this.fetchData(this.props.pageContext);
      this.setState({ data, selectedReport: data.reports[0], isLoading: false });
    } catch (error) {
      console.log(error);
    }
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
        {this.renderCommandBar()}
        <div className={styles.container}>
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
    const { data, selectedReport } = this.state;
    const reportOptions = this.getReportOptions(data);

    const newStatusReportUrl = `${window.location.protocol}//${window.location.hostname}${data.defaultNewFormUrl}`;
    const newStatusReportSource = encodeURIComponent(`${window.location.href.split('#')[0]}#NewStatus`);

    const items: IContextualMenuItem[] = [
      {
        key: 'NewStatusReport',
        name: strings.NewStatusReportModalHeaderText,
        itemType: ContextualMenuItemType.Normal,
        iconProps: { iconName: 'NewFolder' },
        href: `${newStatusReportUrl}?Source=${newStatusReportSource}`,
      },
      {
        key: 'EditReport',
        name: strings.EditReportButtonText,
        itemType: ContextualMenuItemType.Normal,
        iconProps: { iconName: 'Edit' },
        href: selectedReport ? selectedReport.editFormUrl : null,
        disabled: !selectedReport,
      },
    ];
    let farItems: IContextualMenuItem[] = [
      {
        key: 'ReportDropdown',
        name: selectedReport ? selectedReport.toString() : '',
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
    return this.state.data.sections.map(model => {
      const baseProps = this.getSectionBaseProps(model);
      switch (model.type) {
        case SectionType.SummarySection: {
          return (
            <SummarySection
              {...baseProps}
              entity={this.props.entity}
              sections={this.state.data.sections} />
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
  private onReportChanged = (selectedReport: ProjectStatusReport) => {
    this.setState({ selectedReport });
  }

  /**
   * Get report options
   */
  private getReportOptions(data: IProjectStatusData): IContextualMenuItem[] {
    let reportOptions: IContextualMenuItem[] = data.reports.map((report, idx) => ({
      key: `ReportOption_${idx}`,
      name: report.toString(),
      onClick: _ => this.onReportChanged(report),
      canCheck: true,
      isChecked: this.state.selectedReport ? report.item.Id === this.state.selectedReport.item.Id : false,
    } as IContextualMenuItem));
    return reportOptions;
  }

  /**
   * Associate status item
   * 
   * @param {PageContext} param0 Destructed PageContext
   */
  private async associateStatusItem({ site, web, user }: PageContext): Promise<void> {
    try {
      const dateTime = dateAdd(new Date(), 'minute', -1).toISOString();
      const filter = `Author/EMail eq '${user.email}' and Created ge datetime'${dateTime}' and GtSiteId eq '00000000-0000-0000-0000-000000000000'`;
      Logger.log({ message: '(ProjectStatus) associateStatusItem: Attempting to find recently added report', data: { filter }, level: LogLevel.Info });
      let [item] = await this.reportList.items
        .filter(filter)
        .select('Id', 'GtYear', 'GtMonthChoice', 'Created')
        .orderBy('Id', false)
        .top(1)
        .get<IProjectStatusReportItem[]>();
      if (item) {
        const report = new ProjectStatusReport(item);
        Logger.log({ message: '(ProjectStatus) associateStatusItem: Found recently added report. Associating to site.', data: { reportId: report.id, siteId: site.id.toString() }, level: LogLevel.Info });
        await this.reportList.items.getById(report.id).update({
          Title: `${web.title} (${report.toString()})`,
          GtSiteId: site.id.toString(),
        });
      }
    } catch (error) { }
    document.location.hash = '#';
  }

  /**
   * Fetch data
   * 
   * @param {PageContext} param0 Destructed PageContext
   */
  private async fetchData({ site }: PageContext): Promise<IProjectStatusData> {
    try {
      Logger.log({ message: '(ProjectStatus) fetchData: Fetching fields and reports', level: LogLevel.Info });
      const [entityItem, entityFields, reportListProps, reportItems, sectionItems] = await Promise.all([
        this.props.spEntityPortalService.getEntityItemFieldValues(site.id.toString()),
        this.props.spEntityPortalService.getEntityFields(),
        this.reportList
          .select('DefaultEditFormUrl', 'DefaultNewFormUrl')
          .expand('DefaultEditFormUrl', 'DefaultNewFormUrl')
          .get<{ DefaultEditFormUrl: string, DefaultNewFormUrl: string }>(),
        this.reportList.items.filter(`GtSiteId eq '${site.id.toString()}'`).orderBy('Id', false).get<IProjectStatusReportItem[]>(),
        this.sectionsList.items.get(),
      ]);
      const reports = reportItems.map(item => new ProjectStatusReport(item, reportListProps.DefaultEditFormUrl));
      const reportsSorted = reports.sort((a, b) => b.date.valueOf() - a.date.valueOf());
      const sections = sectionItems.map(item => new SectionModel(item));
      const sectionsSorted = sections.sort((a, b) => a.sortOrder < b.sortOrder ? -1 : 1);
      return {
        entityFields,
        entityItem,
        defaultNewFormUrl: reportListProps.DefaultNewFormUrl,
        reports: reportsSorted,
        sections: sectionsSorted,
      };
    } catch (error) {
      throw error;
    }
  }
}

export { IProjectStatusProps };
