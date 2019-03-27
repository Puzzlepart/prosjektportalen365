import * as React from 'react';
import { Logger, LogLevel } from '@pnp/logging';
import styles from './ProjectStatus.module.scss';
import '@pnp/polyfill-ie11';
import { IProjectStatusProps } from './IProjectStatusProps';
import { IProjectStatusState, IProjectStatusData } from './IProjectStatusState';
import { DefaultButton } from 'office-ui-fabric-react/lib/Button';
import { Dropdown, IDropdownOption } from 'office-ui-fabric-react/lib/Dropdown';
import { Spinner } from 'office-ui-fabric-react/lib/Spinner';
import { autobind } from 'office-ui-fabric-react/lib/Utilities';
import SummarySection from './SummarySection';
import StatusSection from './StatusSection';
import ProjectPropertiesSection from './ProjectPropertiesSection';
import ProjectStatusReport from '../models/ProjectStatusReport';
import * as strings from 'ProjectStatusWebPartStrings';
import SectionModel, { SectionType } from './SectionModel';
import { IStatusSectionBaseProps } from './@StatusSectionBase/IStatusSectionBaseProps';

export default class ProjectStatus extends React.Component<IProjectStatusProps, IProjectStatusState> {
  private reportList: any;
  private sectionsList: any;

  constructor(props: IProjectStatusProps) {
    super(props);
    this.state = { isLoading: true };
  }

  public async componentDidMount() {
    const data = await this.fetchData();
    this.setState({ data, selectedReport: data.reports[0], isLoading: false });
  }

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
    let title = this.props.title;
    if (this.state.selectedReport) {
      title = `${this.props.title} (${this.state.selectedReport.toString()})`;
    }
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

  private renderSections() {
    let sortedSections = this.state.data.sections.sort((a, b) => a.sortOrder < b.sortOrder ? -1 : 1);
    return sortedSections.map(model => {
      const { context } = this.props;
      const { selectedReport, data } = this.state;
      const baseProps: IStatusSectionBaseProps = {
        headerProps: {
          label: model.name,
          value: selectedReport.item[model.fieldName],
          comment: selectedReport.item[model.commentFieldName],
          iconName: model.iconName,
          iconSize: 50
        },
        model,
        report: selectedReport,
        context,
        data,
      };
      if (model.fieldName === strings.OverallStatusFieldName) {
        return <SummarySection {...baseProps} entity={this.props.entity} sections={sortedSections} />;
      } else {
        switch (model.getType()) {
          case SectionType.StatusSection: {
            return <StatusSection {...baseProps} />;
          }
          case SectionType.ProjectPropertiesSection: {
            return <ProjectPropertiesSection {...baseProps} />;
          }
          case SectionType.RiskSection: {
            return <ProjectPropertiesSection {...baseProps} />;
          }
          default: {
            return null;
          }
        }
      }
    });
  }

  /**
   * Get selecte report edit form url
   */
  private getSelectedReportEditFormUrl(): string {
    const { selectedReport, data } = this.state;
    if (selectedReport) {
      return `${window.location.protocol}//${window.location.hostname}${data.reportList.DefaultEditFormUrl}?ID=${selectedReport.item.Id}&Source=${encodeURIComponent(window.location.href)}`;
    }
    return null;
  }

  /**
   * Get report new form url
   */
  private getReportNewFormUrl(): string {
    const { selectedReport, data } = this.state;
    if (selectedReport) {
      return `${window.location.protocol}//${window.location.hostname}${data.reportList.DefaultNewFormUrl}?Source=${encodeURIComponent(window.location.href)}`;
    }
    return null;
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
    let reportOptions: IDropdownOption[] = this.state.data.reports.map((report, idx) => ({
      key: `${idx}`,
      text: report.toString(),
      data: report,
    }));
    return reportOptions;
  }

  /**
   * Fetch dara
   */
  private async fetchData(): Promise<IProjectStatusData> {
    Logger.log({ message: '(ProjectStatus) fetchData: Fetching fields and reports', data: {}, level: LogLevel.Info });
    const { hubSite, spEntityPortalService, reportListName, sectionsListName } = this.props;
    this.reportList = hubSite.web.lists.getByTitle(reportListName);
    this.sectionsList = hubSite.web.lists.getByTitle(sectionsListName);
    const [entityItem, entityFields] = await Promise.all([
      spEntityPortalService.getEntityItemFieldValues(this.props.context.pageContext.site.id.toString()),
      spEntityPortalService.getEntityFields(),
    ]);
    let { DefaultEditFormUrl, DefaultNewFormUrl } = await this.reportList
      .select('DefaultEditFormUrl', 'DefaultNewFormUrl')
      .expand('DefaultEditFormUrl', 'DefaultNewFormUrl')
      .get();
    let reports = await this.reportList.items.filter(`GtSiteId eq '${this.props.context.pageContext.legacyPageContext.groupId}'`).get();
    reports = reports.map((r: any) => new ProjectStatusReport(r));
    let sections = await this.sectionsList.items.get();
    sections = sections.map((r: any) => new SectionModel(r, entityItem));
    return { entityFields, entityItem, reportList: { DefaultEditFormUrl, DefaultNewFormUrl }, reports, sections };
  }
}
