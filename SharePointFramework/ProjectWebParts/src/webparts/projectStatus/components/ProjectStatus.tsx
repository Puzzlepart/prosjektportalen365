import * as React from 'react';
import { Logger, LogLevel } from '@pnp/logging';
import { List } from '@pnp/sp';
import { dateAdd } from "@pnp/common";
import styles from './ProjectStatus.module.scss';
import * as strings from 'ProjectStatusWebPartStrings';
import '@pnp/polyfill-ie11';
import { IProjectStatusProps } from './IProjectStatusProps';
import { IProjectStatusState, IProjectStatusData } from './IProjectStatusState';
import { DefaultButton } from 'office-ui-fabric-react/lib/Button';
import { Dropdown, IDropdownOption } from 'office-ui-fabric-react/lib/Dropdown';
import { Spinner } from 'office-ui-fabric-react/lib/Spinner';
import { autobind } from 'office-ui-fabric-react/lib/Utilities';
import SummarySection from './SummarySection';
import StatusSection from './StatusSection';
import ListSection from './ListSection';
import ProjectPropertiesSection from './ProjectPropertiesSection';
import ProjectStatusReport, { IProjectStatusReportItem } from '../models/ProjectStatusReport';
import SectionModel, { SectionType } from '../models/SectionModel';
import { IStatusSectionBaseProps } from './@StatusSectionBase/IStatusSectionBaseProps';
import getObjectValue from 'prosjektportalen-spfx-shared/lib/helpers/getObjectValue';

export default class ProjectStatus extends React.Component<IProjectStatusProps, IProjectStatusState> {
  private reportList: List;
  private sectionsList: List;

  constructor(props: IProjectStatusProps) {
    super(props);
    this.state = {
      isLoading: true,
      associateStatusItem: document.location.hash === '#NewStatus',
    };
    this.reportList = props.hubSite.web.lists.getByTitle(this.props.reportListName) as any;
    this.sectionsList = props.hubSite.web.lists.getByTitle(this.props.sectionsListName) as any;
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
  public render() {
    if (this.state.isLoading) {
      return (
        <div className={styles.projectStatus}>
          <div className={styles.container}>
            <Spinner label={strings.LoadingText} />
          </div>
        </div>
      );
    }

    let reportOptions = this.getReportOptions();
    let title = this.getTitle();

    return (
      <div className={styles.projectStatus}>
        <div className={styles.container}>
          <div className={`${styles.header} ${styles.column12}`}>
            <div className={styles.title}>{title}</div>
          </div>
          <div className={`${styles.actions} ${styles.column8}`}>
            <DefaultButton
              text={strings.NewStatusReportModalHeaderText}
              href={this.getReportNewFormUrl()}
              iconProps={{ iconName: 'NewFolder' }} />
            <DefaultButton
              disabled={!this.state.selectedReport}
              text={strings.EditReportButtonText}
              href={this.getSelectedReportEditFormUrl()}
              iconProps={{ iconName: 'Edit' }} />
          </div>
          <div className={styles.column4}>
            <Dropdown
              onChanged={this.onReportChanged}
              defaultSelectedKey='0'
              options={reportOptions}
              disabled={reportOptions.length === 0} />
          </div>
          <div className={`${styles.sections} ${styles.column12}`}>
            {this.state.selectedReport && this.renderSections()}
          </div>
        </div>
      </div>
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
      [item] = await this.reportList.items
        .filter(`AuthorId eq ${this.props.pageContext.legacyPageContext.userId} and GtSiteId ne '${siteId}' and Created ge datetime'${dateTime}'`)
        .select('Id', 'GtMonthChoice', 'Created')
        .orderBy('Id', false)
        .top(1)
        .get<IProjectStatusReportItem[]>();
    } catch (error) { }
    if (item) {
      const report = new ProjectStatusReport(item);
      await this.reportList.items.getById(item.Id).update({
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
   * Get title
   */
  private getTitle() {
    let title = this.props.title;
    if (this.state.selectedReport) {
      title = `${this.props.title} (${this.state.selectedReport.toString()})`;
    }
    return title;
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
   */
  @autobind
  private onReportChanged(option: IDropdownOption) {
    this.setState({ selectedReport: option.data });
  }

  /**
   * Get report options
   */
  private getReportOptions(): IDropdownOption[] {
    let reportOptions: IDropdownOption[] = getObjectValue<ProjectStatusReport[]>(this.state, 'data.reports', []).map((report, idx) => ({
      key: `${idx}`,
      text: report.toString(),
      data: report,
    }));
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
    let reportListProps = await this.reportList
      .select('DefaultEditFormUrl', 'DefaultNewFormUrl')
      .expand('DefaultEditFormUrl', 'DefaultNewFormUrl')
      .get();
    const [reportItems, sectionItems] = await Promise.all([
      this.reportList.items.filter(`GtSiteId eq '${siteId}'`).get<IProjectStatusReportItem[]>(),
      this.sectionsList.items.get(),
    ]);
    const reports = reportItems.map(r => new ProjectStatusReport(r));
    const sections = sectionItems.map(s => new SectionModel(s));
    return { entityFields, entityItem, reportListProps, reports, sections };
  }
}

export { IProjectStatusProps };