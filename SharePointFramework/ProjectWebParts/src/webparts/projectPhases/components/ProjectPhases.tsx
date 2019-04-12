import * as React from 'react';
import { Logger, LogLevel } from '@pnp/logging';
import { sp, ClientSidePage, ClientSideWebpart, ClientSidePageComponent } from '@pnp/sp';
import { taxonomy } from '@pnp/sp-taxonomy';
import { Spinner } from 'office-ui-fabric-react/lib/Spinner';
import { MessageBar, MessageBarType } from 'office-ui-fabric-react/lib/MessageBar';
import { autobind } from 'office-ui-fabric-react/lib/Utilities';
import ChangePhaseDialog from './ChangePhaseDialog';
import ProjectPhaseCallout from './ProjectPhaseCallout';
import ProjectPhase from './ProjectPhase';
import Phase from '../models/Phase';
import styles from './ProjectPhases.module.scss';
import { IProjectPhasesProps } from './IProjectPhasesProps';
import { IProjectPhasesState, IProjectPhasesData } from './IProjectPhasesState';
import * as strings from 'ProjectPhasesWebPartStrings';
import { ChecklistData } from './ChecklistData';
import * as objectGet from 'object-get';
import MSGraphHelper from 'msgraph-helper';

export default class ProjectPhases extends React.Component<IProjectPhasesProps, IProjectPhasesState> {
  private phaseChecklist = sp.web.lists.getByTitle(strings.PhaseChecklistName);

  /**
   * Constructor
   * 
   * @param {IProjectPhasesProps} props Initial props
   */
  constructor(props: IProjectPhasesProps) {
    super(props);
    this.state = { isLoading: true, data: {} };
  }

  public async componentDidMount() {
    if (this.props.phaseField) {
      const checklistData = await this.fetchChecklistData();
      const data = await this.fetchData(checklistData);
      this.setState({ isLoading: false, data });
    }
  }

  /**
   * Renders the <ProjectPhases /> component
   */
  public render(): React.ReactElement<IProjectPhasesProps> {
    if (!this.props.phaseField) {
      return (
        <div className={styles.projectPhases}>
          <div className={styles.container} ref='container'>
            <MessageBar messageBarType={MessageBarType.error}>{strings.WebPartNotConfiguredMessage}</MessageBar>
          </div>
        </div>
      );
    }
    if (this.state.isLoading) {
      return (
        <div className={styles.projectPhases}>
          <div className={styles.container} ref='container'>
            <Spinner label={strings.LoadingText} />
          </div>
        </div>
      );
    }

    const { phases, currentPhase } = this.state.data;

    return (
      <div className={styles.projectPhases}>
        <div className={styles.container} ref='container'>
          <ul className={styles.phaseList}>
            {phases.map(phase => (
              <ProjectPhase
                phase={phase}
                isCurrentPhase={currentPhase && (phase.id === currentPhase.id)}
                onOpenCallout={(target: HTMLSpanElement) => this.setState({ phaseMouseOver: { target, model: phase } })} />
            ))}
          </ul>
        </div>
        {this.state.phaseMouseOver && (
          <ProjectPhaseCallout
            phase={this.state.phaseMouseOver}
            isCurrentPhase={currentPhase && (this.state.phaseMouseOver.model.id === currentPhase.id)}
            phaseSubTextProperty={this.props.phaseSubTextProperty}
            onChangePhase={phase => this.setState({ confirmPhase: phase })}
            onDismiss={this.onProjectPhaseCalloutDismiss}
            gapSpace={5} />
        )}
        {this.state.confirmPhase && (
          <ChangePhaseDialog
            activePhase={this.state.data.currentPhase}
            newPhase={this.state.confirmPhase}
            phaseChecklist={this.phaseChecklist}
            onDismiss={_ => this.setState({ confirmPhase: null })}
            onChangePhase={this.onChangePhase} />
        )}
      </div>
    );
  }

  /**
   * Update phase
   * 
   * @param {Phase} phase Phase
   */
  private async updatePhase(phase: Phase) {
    Logger.log({ message: '(ProjectPhases) updatePhase', data: { phase }, level: LogLevel.Info });
    await this.props.spEntityPortalService.updateEntityItem(this.props.pageContext.site.id.toString(), { [this.state.data.phaseTextField]: phase.toString() });
  }

  /**
   * On <ProjectPhaseCallout /> dismiss
   */
  @autobind
  private async onProjectPhaseCalloutDismiss() {
    this.setState({ phaseMouseOver: null });
  }

  /**
   * Change phase
   * 
   * @param {Phase} phase Phase
   */
  @autobind
  private async onChangePhase(phase: Phase) {
    try {
      this.setState({ isChangingPhase: true });
      await this.updatePhase(phase);
      await Promise.all([
        this.modifiyFrontpageViews(phase.name),
        this.updatePlannerWebPart(phase.name),
      ]);
      this.setState({ data: { ...this.state.data, currentPhase: phase }, confirmPhase: null, isChangingPhase: false });
      if (this.props.automaticReload) {
        window.setTimeout(() => {
          document.location.href = this.props.pageContext.web.absoluteUrl;
        }, (this.props.reloadTimeout * 5000));
      }
    } catch (err) {
      this.setState({ confirmPhase: null, isChangingPhase: false });
    }
  }

  /**
   * Modify frontpage views
   * 
   * @param {string} phaseTermName Phase term name
   */
  private async modifiyFrontpageViews(phaseTermName: string) {
    const documentsViews = sp.web.lists.getByTitle(strings.DocumentsListName).views;
    let [documentsFrontpageView] = await documentsViews.select('Id', 'ViewQuery').filter(`Title eq '${this.props.currentPhaseViewName}'`).get<{ Id: string, ViewQuery: string }[]>();
    if (documentsFrontpageView) {
      const viewQueryDom = new DOMParser().parseFromString(`<Query>${documentsFrontpageView.ViewQuery}</Query>`, 'text/xml');
      const orderByDomElement = viewQueryDom.getElementsByTagName('OrderBy')[0];
      const orderBy = orderByDomElement ? orderByDomElement.outerHTML : '';
      const newViewQuery = [orderBy, `<Where><Eq><FieldRef Name='GtProjectPhase' /><Value Type='Text'>${phaseTermName}</Value></Eq></Where>`].join('');
      try {
        await documentsViews.getById(documentsFrontpageView.Id).update({ ViewQuery: newViewQuery });
        Logger.write(`(ProjectPhases) modifiyFrontpageViews: Successfully updated ViewQuery for view '${this.props.currentPhaseViewName}' for list '${strings.DocumentsListName}'`, LogLevel.Info);
      } catch (err) {
        Logger.write(`(ProjectPhases) modifiyFrontpageViews: Failed to update ViewQuery for view '${this.props.currentPhaseViewName}' for list '${strings.DocumentsListName}'`, LogLevel.Error);
      }
    }
  }

  /**
   * Update web part properties
   * 
   * @param {string} pageName Page name
   * @param {string} webPartId Web Part Id
   * @param {Object} properties Properties
   */
  private async updateWebPartProperties(pageName: string, webPartId: string, properties: { [key: string]: string }) {
    const page = await ClientSidePage.fromFile(sp.web.getFileByServerRelativePath(`${this.props.pageContext.web.serverRelativeUrl}/SitePages/${pageName}.aspx`));
    const control = page.findControl<ClientSideWebpart>(c => objectGet(c, 'json.webPartId') === webPartId) as ClientSideWebpart;
    control.setProperties<any>({
      ...objectGet(control, 'data.webPartData.properties'),
      ...properties,
    });
    await page.save();
  }

  /**
   * Update Planner Web Part
   * 
   * @param {string} phaseTermName Phase term name
   * @param {string} plannerWebPartId Planner Web Part Id
   */
  private async updatePlannerWebPart(phaseTermName: string, plannerWebPartId: string = '39c4c1c2-63fa-41be-8cc2-f6c0b49b253d') {
    try {
      const plans = await MSGraphHelper.Get<{ id: string, title: string }[]>(`groups/${this.props.pageContext.legacyPageContext.groupId}/planner/plans`, ['id', 'title']);
      const [plan] = plans.filter(p => p.title === phaseTermName);
      if (plan) {
        await this.updateWebPartProperties('Hjem', plannerWebPartId, { planId: plan.id });
        await this.updateWebPartProperties('Oppgaver', plannerWebPartId, { planId: plan.id });
      }
    } catch (error) { }
  }

  /**
   * Fetch check point statuses
   */
  private async fetchChecklistData(): Promise<ChecklistData> {
    try {
      const phaseChecklistItems = await this.phaseChecklist.items.get();
      const checkPointStatuses: ChecklistData = phaseChecklistItems
        .filter(item => item.GtProjectPhase)
        .reduce((obj, item) => {
          const status = item.GtChecklistStatus.toLowerCase();
          const termGuid = `/Guid(${item.GtProjectPhase.TermGuid})/`;
          obj[termGuid] = obj[termGuid] ? obj[termGuid] : {};
          obj[termGuid].stats = obj[termGuid].stats || {};
          obj[termGuid].items = obj[termGuid].items || [];
          obj[termGuid].items.push(item);
          obj[termGuid].stats[status] = obj[termGuid].stats[status] ? obj[termGuid].stats[status] + 1 : 1;
          return obj;
        }, {});
      return checkPointStatuses;
    } catch (e) {
      return {};
    }
  }

  /***
   * Fetch phase terms
   * 
   * @param {ChecklistData} checklistData Check point status
   */
  private async fetchData(checklistData: ChecklistData): Promise<IProjectPhasesData> {
    Logger.log({ message: '(ProjectPhases) fetchData: Fetching TermSetId for selected field', level: LogLevel.Info });
    const { spEntityPortalService, phaseField, pageContext } = this.props;
    try {
      const [{ TermSetId: termSetId }, phaseTextField] = await Promise.all([
        sp.web.fields.getByInternalNameOrTitle(phaseField).select('TermSetId').usingCaching().get(),
        sp.web.fields.getByInternalNameOrTitle(`${phaseField}_0`).select('InternalName').usingCaching().get(),
      ]);
      const [phaseTerms, entityItem] = await Promise.all([
        taxonomy.getDefaultSiteCollectionTermStore().getTermSetById(termSetId).terms.usingCaching().get(),
        spEntityPortalService.getEntityItem(pageContext.site.id.toString()),
      ]);
      const phases = phaseTerms
        .filter(term => term.LocalCustomProperties.ShowOnFrontpage !== 'false')
        .map(term => new Phase(term, checklistData[term.Id] || { stats: {}, items: [] }, term.LocalCustomProperties));
      let currentPhase: Phase = null;
      if (entityItem && entityItem.GtProjectPhase) {
        [currentPhase] = phases.filter(p => p.id.indexOf(entityItem.GtProjectPhase.TermGuid) !== -1);
      }
      Logger.log({ message: '(ProjectPhases) fetchData: Successfully loaded phases', data: { phaseTextField }, level: LogLevel.Info });
      return { currentPhase, phases, phaseTextField: phaseTextField.InternalName };
    } catch (err) {
      throw err;
    }
  }
}

export { IProjectPhasesProps };