import * as React from 'react';
import { Logger, LogLevel } from '@pnp/logging';
import styles from './ProjectStatus.module.scss';
import '@pnp/polyfill-ie11';
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
import SectionModel from './SectionModel';
import { Element, Link } from 'react-scroll';
import Navigation from './Navigation/Navigation';
import { ScrollablePane } from 'office-ui-fabric-react/lib/ScrollablePane';
import { Sticky, StickyPositionType } from 'office-ui-fabric-react/lib/Sticky';


export default class ProjectStatus extends React.Component<IProjectStatusProps, IProjectStatusState> {
  private reportList;
  private sectionsList;

  constructor(props: IProjectStatusProps) {
    super(props);
    this.state = { isLoading: true };
  }

  public async componentDidMount() {
    const data = await this.fetchData();
    this.setState({ data, selectedReport: data.reports[0], isLoading: false });
  }

  public render() {
    const { isLoading, data, selectedReport, showNewStatusReportModal } = this.state;

    if (isLoading) {
      return <Spinner label={strings.LoadingText} />;
    }
    let reportOptions = this.getReportOptions();
    let webPartTitleText = this.props.title;
    if (selectedReport) {
      webPartTitleText = `${this.props.title} (${selectedReport.toString()})`;
    }

    const baseProps = {
      context: this.props.context,
      report: this.state.selectedReport,
      entityFields: this.state.data.entityFields,
      entityItem: this.state.data.entityItem,
    };

    return (
      <div className={styles.projectStatus}>
        <ScrollablePane className={styles.scrollablePane}>
          <div className={styles.container}>
            <div className={`${styles.projectStatusTopSection} ${styles.row}`}>
              <div className={styles.sticky}>
                <Sticky stickyPosition={StickyPositionType.Header}>
                  <div className={`${styles.title} ${styles.column12}`}>
                    <WebPartTitle
                      displayMode={DisplayMode.Read}
                      title={webPartTitleText}
                      updateProperty={_title => { }} />
                  </div>
                  <Navigation entityItem={baseProps.entityItem} sections={this.state.data.sections} />
                </Sticky>
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
                {(this.state.selectedReport) && this._renderSections(this.state.data.sections, baseProps)}
              </div>
            </div>
          </div>
          {showNewStatusReportModal && (
            <NewStatusReportModal
              fields={data.reportFields}
              onSave={this.onSaveReport}
              onDismiss={this.onDismissNewStatusReportModal} />
          )}
        </ScrollablePane>
      </div>
    );
  }

  private _renderSections(sections: SectionModel[], baseProps: any) {
    const report = baseProps.report.item;
    let sortedSections = sections.sort((a, b) => a.sortOrder < b.sortOrder ? -1 : 1);
    let index = -1;
    return sortedSections.map((s => {
      index++;
      if (s.fieldName === strings.OverallStatusFieldName) {
        return (
          <SummarySection
            entity={this.props.entity}
            sections={sections}
            {...baseProps} />
        );
      } else return (

        (s.fieldName === 'GtStatusBudget') ?
          <Element
            id={s.getHtmlElementId()}
            name={`section-${index}`}
            className={styles.row}
          >
            <StatusPropertySection
              section={s}
              headerProps={{ label: s.name, value: report[s.fieldName], comment: report[s.commentFieldName], iconName: s.iconName, iconSize: 50 }}
              {...baseProps}
              fieldNames={['GtProjectFinanceName', 'GtBudgetTotal', 'GtCostsTotal', 'GtProjectForecast']}
            />
          </Element>
          :
          <Element
            id={s.getHtmlElementId()}
            name={`section-${index}`}
            className={styles.row}
          >
            <StatusPropertySection
              section={s}
              headerProps={{ label: s.name, value: report[s.fieldName], comment: report[s.commentFieldName], iconName: s.iconName, iconSize: 50 }}
              {...baseProps}
            />
          </Element>
      );
    }));

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
    const { hubSite, spEntityPortalService, reportListName, sectionsListName } = this.props;
    this.reportList = hubSite.web.lists.getByTitle(reportListName);
    this.sectionsList = hubSite.web.lists.getByTitle(sectionsListName);
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
    let sections = await this.sectionsList.items.get();
    sections = sections.map((r: any) => new SectionModel(r, entityItem));
    return { entityFields, entityItem, reportFields, reportEditFormUrl, reports, sections };
  }
}
