import { PageContext } from '@microsoft/sp-page-context';
import { dateAdd } from "@pnp/common";
import { Logger, LogLevel } from '@pnp/logging';
import { List } from '@pnp/sp';
import { formatDate } from 'shared/lib/helpers';
import { ProjectStatusReport, SectionModel } from 'models';
import { SectionType } from 'models/SectionModel';
import { CommandBar } from 'office-ui-fabric-react/lib/CommandBar';
import { ContextualMenuItemType, IContextualMenuItem } from 'office-ui-fabric-react/lib/ContextualMenu';
import { Spinner } from 'office-ui-fabric-react/lib/Spinner';
import * as strings from 'ProjectWebPartsStrings';
import * as React from 'react';
import * as format from 'string-format';
import { IStatusSectionBaseProps } from './@StatusSectionBase/IStatusSectionBaseProps';
import { IProjectStatusData } from "./IProjectStatusData";
import { IProjectStatusProps } from './IProjectStatusProps';
import { IProjectStatusState } from './IProjectStatusState';
import ListSection from './ListSection';
import ProjectPropertiesSection from './ProjectPropertiesSection';
import styles from './ProjectStatus.module.scss';
import StatusSection from './StatusSection';
import SummarySection from './SummarySection';

export class ProjectStatus extends React.Component<IProjectStatusProps, IProjectStatusState> {
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
      newStatusCreated: document.location.hash === '#NewStatus',
    };
    this._reportList = props.hubSite.web.lists.getByTitle(this.props.reportListName);
    this._sectionsList = props.hubSite.web.lists.getByTitle(this.props.sectionsListName);
  }

  public async componentDidMount() {
    if (this.state.newStatusCreated) {
      await this.associateStatusItem();
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
            <Spinner label={format(strings.LoadingText, 'prosjektstatus')} />
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
    const items: IContextualMenuItem[] = [
      {
        key: 'NewStatusReport',
        name: strings.NewStatusReportModalHeaderText,
        itemType: ContextualMenuItemType.Normal,
        iconProps: { iconName: 'NewFolder' },
        onClick: this.redirectNewStatusReport.bind(this),
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
        name: selectedReport ? formatDate(selectedReport.date, true) : '',
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
    const baseProps: IStatusSectionBaseProps = {
      headerProps: {
        label: model.name,
        value: this.state.selectedReport.item[model.fieldName],
        comment: this.state.selectedReport.item[model.commentFieldName],
        iconName: model.iconName,
        iconSize: 50
      },
      report: this.state.selectedReport,
      model,
      pageContext: this.props.pageContext,
      hubSite: this.props.hubSite,
      data: this.state.data,
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
  private onReportChanged(selectedReport: ProjectStatusReport) {
    this.setState({ selectedReport });
  }

  /**
   * Get report options
   */
  private getReportOptions(data: IProjectStatusData): IContextualMenuItem[] {
    let reportOptions: IContextualMenuItem[] = data.reports.map(report => ({
      key: `${report.id}`,
      name: formatDate(report.date, true),
      onClick: _evt => this.onReportChanged(report),
      canCheck: true,
      isChecked: this.state.selectedReport ? report.item.Id === this.state.selectedReport.item.Id : false,
    } as IContextualMenuItem));
    return reportOptions;
  }

  /**
   * Associate status item
   */
  private async associateStatusItem(): Promise<void> {
    try {
      const filter = `Author/EMail eq '${this.props.pageContext.user.email}' and GtSiteId eq '00000000-0000-0000-0000-000000000000'`;
      Logger.log({ message: `(ProjectStatus) associateStatusItem: Attempting to find recently added report by current user '${this.props.pageContext.user.email}'`, data: { filter }, level: LogLevel.Info });
      let [item] = await this._reportList.items.filter(filter).select('Id', 'Created').orderBy('Id', false).top(1).get<any[]>();
      if (item) {
        const report = new ProjectStatusReport(item);
        Logger.log({ message: '(ProjectStatus) associateStatusItem: Setting title for item', data: { filter }, level: LogLevel.Info });
        await this._reportList.items.getById(report.id).update({
          Title: `${this.props.pageContext.web.title} (${formatDate(report.date, true)})`,
          GtSiteId: this.props.pageContext.site.id.toString(),
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
  private async redirectNewStatusReport(_ev?: React.MouseEvent<HTMLElement, MouseEvent> | React.KeyboardEvent<HTMLElement>, _item?: IContextualMenuItem): Promise<void> {
    const [previousReport] = this.state.data.reports;
    let properties = previousReport ? previousReport.getStatusValues() : {};
    properties.Title = format(strings.NewStatusReportTitle, this.props.pageContext.web.title);
    const { data } = await this._reportList.items.add(properties);
    const source = encodeURIComponent(`${window.location.href.split('#')[0]}#NewStatus`);
    document.location.href = `${window.location.protocol}//${window.location.hostname}${this.state.data.defaultEditFormUrl}?ID=${data.Id}&Source=${source}`;
  }

  /**
   * Fetch data
   * 
   * @param {PageContext} param0 Destructed PageContext
   */
  private async fetchData({ site }: PageContext): Promise<IProjectStatusData> {
    try {
      Logger.log({ message: '(ProjectStatus) fetchData: Fetching fields and reports', level: LogLevel.Info });
      const [entityItem, entityFields, { DefaultEditFormUrl }, reportItems, sectionItems] = await Promise.all([
        this.props.spEntityPortalService.getEntityItemFieldValues(site.id.toString()),
        this.props.spEntityPortalService.getEntityFields(),
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
          .filter(`GtSiteId eq '${site.id.toString()}'`)
          .orderBy('Id', false)
          .get<any[]>(),
        this._sectionsList.items.get(),
      ]);
      const reports = reportItems.map(item => new ProjectStatusReport(item, DefaultEditFormUrl));
      const reportsSorted = reports.sort((a, b) => b.date.getTime() - a.date.getTime());
      const sections = sectionItems.map(item => new SectionModel(item));
      const sectionsSorted = sections.sort((a, b) => a.sortOrder < b.sortOrder ? -1 : 1);
      return {
        entityFields,
        entityItem,
        defaultEditFormUrl: DefaultEditFormUrl,
        reports: reportsSorted,
        sections: sectionsSorted,
      };
    } catch (error) {
      throw error;
    }
  }
}

export { IProjectStatusProps };

