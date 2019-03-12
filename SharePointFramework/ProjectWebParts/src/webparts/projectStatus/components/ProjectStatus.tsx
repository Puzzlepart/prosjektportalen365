import * as React from 'react';
import { Logger, LogLevel } from '@pnp/logging';
import styles from './ProjectStatus.module.scss';
import { DisplayMode } from '@microsoft/sp-core-library';
import { IProjectStatusProps } from './IProjectStatusProps';
import { IProjectStatusState, IProjectStatusData } from './IProjectStatusState';
import { WebPartTitle } from "@pnp/spfx-controls-react/lib/WebPartTitle";
import { DefaultButton } from 'office-ui-fabric-react/lib/Button';
import { Dropdown, IDropdownOption } from 'office-ui-fabric-react/lib/Dropdown';
import { Spinner } from 'office-ui-fabric-react/lib/Spinner';
import { autobind } from 'office-ui-fabric-react/lib/Utilities';
import NewStatusReportModal from './NewStatusReportModal';
import SummarySection from './SummarySection';
import StatusPropertySection from './StatusPropertySection';
import ProjectStatusReport from '../models/ProjectStatusReport';
import * as strings from 'ProjectStatusWebPartStrings';


export default class ProjectStatus extends React.Component<IProjectStatusProps, IProjectStatusState> {
  private reportList;

  constructor(props: IProjectStatusProps) {
    super(props);
    this.state = { isLoading: true };
  }

  public async componentDidMount() {
    const data = await this.fetchData();
    this.setState({ data, selectedReport: data.reports[0], isLoading: false });
  }

  public render(): React.ReactElement<IProjectStatusProps> {
    const { isLoading, data, selectedReport, showNewStatusReportModal } = this.state;

    if (isLoading) {
      return <Spinner label={strings.LoadingText} />;
    }
    let reportOptions = this.getReportOptions();
    let webPartTitleText = this.props.title;
    if (selectedReport) {
      webPartTitleText = `${this.props.title} (${selectedReport.toString()})`;
    }

    return (
      <div className={styles.projectStatus}>
        <div className={styles.container}>
          <div className={`${styles.projectStatusTopSection} ${styles.row}`}>
            <div className={`${styles.title} ${styles.column12}`}>
              <WebPartTitle
                displayMode={DisplayMode.Read}
                title={webPartTitleText}
                updateProperty={_title => { }} />
            </div>
            <div className={`${styles.projectStatusActions} ${styles.column8}`}>
              <DefaultButton
                text={strings.NewStatusReportModalHeaderText}
                onClick={this.onOpenNewStatusReportModal}
                iconProps={{ iconName: 'NewFolder' }} />
              <DefaultButton
                disabled={!selectedReport}
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
              {this.renderSections()}
            </div>
          </div>
        </div>
        {showNewStatusReportModal && (
          <NewStatusReportModal
            fields={data.reportFields}
            onSave={this.onSaveReport}
            onDismiss={this.onDismissNewStatusReportModal} />
        )}
      </div>
    );
  }

  private renderSections() {
    let sections = [];
    if (this.state.selectedReport) {
      const baseProps = {
        context: this.props.context,
        report: this.state.selectedReport,
        entityFields: this.state.data.entityFields,
        entityItem: this.state.data.entityItem,
      };
      const data = this.state.selectedReport.item;
      sections.push(
        <SummarySection
          entity={this.props.entity} {...baseProps} />,
        <StatusPropertySection
          headerProps={{ label: 'Fremdrift', value: data.GtStatusTime, comment: data.GtStatusTimeComment, iconName: 'AwayStatus', iconSize: 50 }}
          {...baseProps} />,
        <StatusPropertySection
          headerProps={{ label: 'Økonomi', value: data.GtStatusBudget, comment: data.GtStatusBudgetComment, iconName: 'Money', iconSize: 50 }}
          fieldNames={['GtProjectFinanceName', 'GtBudgetTotal', 'GtCostsTotal', 'GtProjectForecast']}
          {...baseProps} />,
        <StatusPropertySection
          headerProps={{ label: 'Kvalitet', value: data.GtStatusQuality, comment: data.GtStatusQualityComment, iconName: 'Equalizer', iconSize: 50 }}
          {...baseProps} />,
        <StatusPropertySection
          headerProps={{ label: 'Risiko', value: data.GtStatusRisk, comment: data.GtStatusRiskComment, iconName: 'Warning', iconSize: 50 }}
          {...baseProps} />,
        <StatusPropertySection
          headerProps={{ label: 'Gevinstoppnåelse', value: data.GtStatusGainAchievement, comment: data.GtStatusGainAchievementComment, iconName: 'Wines', iconSize: 50 }}
          {...baseProps} />,
      );
    }
    return sections;
  }

  private getSelectedReportEditFormUrl(): string {
    const { selectedReport, data } = this.state;
    if (selectedReport) {
      return `${window.location.protocol}//${window.location.hostname}${data.reportEditFormUrl}?ID=${selectedReport.item.Id}&Source=${encodeURIComponent(window.location.href)}`;
    }
    return null;
  }

  @autobind
  private onReportChanged(option: IDropdownOption) {
    this.setState({ selectedReport: option.data });
  }

  private getReportOptions(): IDropdownOption[] {
    let reportOptions: IDropdownOption[] = this.state.data.reports.map((report, idx) => ({
      key: `${idx}`,
      text: report.toString(),
      data: report,
    }));
    return reportOptions;
  }

  @autobind
  private async onSaveReport(model: { [key: string]: string }) {
    this.setState({ showNewStatusReportModal: false });
    const report = { GtSiteId: this.props.context.pageContext.legacyPageContext.groupId, ...model };
    await this.reportList.items.add(report);
  }

  @autobind
  private onOpenNewStatusReportModal() {
    this.setState({ showNewStatusReportModal: true });
  }

  @autobind
  private onDismissNewStatusReportModal() {
    this.setState({ showNewStatusReportModal: false });
  }

  private async fetchData(): Promise<IProjectStatusData> {
    Logger.log({ message: '(ProjectStatus) fetchData: Fetching fields and reports', data: {}, level: LogLevel.Info });
    const { hubSite, spEntityPortalService, reportListName } = this.props;
    this.reportList = hubSite.web.lists.getByTitle(reportListName);
    const [entityItem, entityFields] = await Promise.all([
      spEntityPortalService.getEntityItemFieldValues(this.props.context.pageContext.site.id.toString()),
      spEntityPortalService.getEntityFields(),
    ]);
    let { DefaultEditFormUrl: reportEditFormUrl } = await this.reportList
      .select('DefaultEditFormUrl')
      .expand('DefaultEditFormUrl')
      .get();
    let reportFields = await hubSite.web.contentTypes
      .getById(this.props.reportCtId)
      .fields
      .select('Title', 'InternalName', 'TypeAsString', 'Choices')
      .filter(`(TypeAsString eq 'Note' or TypeAsString eq 'Text' or TypeAsString eq 'Choice') and InternalName ne 'Title' and InternalName ne 'GtSiteId'`)
      .get();
    reportFields = reportFields.map(fld => ({
      title: fld.Title,
      fieldName: fld.InternalName,
      fieldType: fld.TypeAsString.toLowerCase(),
      choices: fld.Choices || [],
    }));
    let reports = await this.reportList.items.filter(`GtSiteId eq '${this.props.context.pageContext.legacyPageContext.groupId}'`).get();
    reports = reports.map((r: any) => new ProjectStatusReport(r));
    return { entityFields, entityItem, reportFields, reportEditFormUrl, reports };
  }
}
