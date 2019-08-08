import { dateAdd } from '@pnp/common';
import { Logger, LogLevel } from '@pnp/logging';
import { ClientSidePage, ClientSideWebpart, sp, List } from '@pnp/sp';
import { taxonomy } from '@pnp/sp-taxonomy';
import MSGraphHelper from 'msgraph-helper';
import * as objectGet from 'object-get';
import { MessageBar, MessageBarType } from 'office-ui-fabric-react/lib/MessageBar';
import { Spinner } from 'office-ui-fabric-react/lib/Spinner';
import * as ProjectPhasesWebPartStrings from 'ProjectPhasesWebPartStrings';
import * as React from 'react';
import SpEntityPortalService from 'sp-entityportal-service';
import HubSiteService from 'sp-hubsite-service';
import { Phase } from '../models';
import { IPhaseChecklistItem } from '../models';
import ChangePhaseDialog from './ChangePhaseDialog';
import { ChecklistData } from './ChecklistData';
import { IProjectPhasesProps } from './IProjectPhasesProps';
import { IProjectPhasesData, IProjectPhasesState } from './IProjectPhasesState';
import ProjectPhase from './ProjectPhase';
import ProjectPhaseCallout from './ProjectPhaseCallout';
import styles from './ProjectPhases.module.scss';

export default class ProjectPhases extends React.Component<IProjectPhasesProps, IProjectPhasesState> {
  protected _spEntityPortalService: SpEntityPortalService;
  protected _phaseChecklist: List;

  /**
   * Constructor
   * 
   * @param {IProjectPhasesProps} props Initial props
   */
  constructor(props: IProjectPhasesProps) {
    super(props);
    this.state = { isLoading: true, data: {} };
    this._phaseChecklist = sp.web.lists.getByTitle(ProjectPhasesWebPartStrings.PhaseChecklistName);
  }

  public async componentDidMount() {
    if (this.props.phaseField) {
      const checklistData = await this.fetchChecklistData();
      const data = await this.fetchData(checklistData, { expiration: dateAdd(new Date(), "day", 1), storeName: "local" });
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
            <MessageBar messageBarType={MessageBarType.error}>{ProjectPhasesWebPartStrings.WebPartNotConfiguredMessage}</MessageBar>
          </div>
        </div>
      );
    }
    if (this.state.isLoading) {
      return (
        <div className={styles.projectPhases}>
          <div className={styles.container} ref='container'>
            <Spinner label={ProjectPhasesWebPartStrings.LoadingText} />
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
            webAbsoluteUrl={this.props.pageContext.web.absoluteUrl}
            onChangePhase={phase => this.setState({ confirmPhase: phase })}
            onDismiss={this.onProjectPhaseCalloutDismiss}
            gapSpace={5} />
        )}
        {this.state.confirmPhase && (
          <ChangePhaseDialog
            activePhase={this.state.data.currentPhase}
            newPhase={this.state.confirmPhase}
            phaseChecklist={this._phaseChecklist}
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
  protected async updatePhase(phase: Phase) {
    Logger.log({ message: '(ProjectPhases) updatePhase', data: { phase }, level: LogLevel.Info });
    await this._spEntityPortalService.updateEntityItem(this.props.pageContext.site.id.toString(), { [this.state.data.phaseTextField]: phase.toString() });
  }

  /**
   * On <ProjectPhaseCallout /> dismiss
   */
  protected onProjectPhaseCalloutDismiss = () => {
    this.setState({ phaseMouseOver: null });
  }

  /**
   * Change phase
   * 
   * @param {Phase} phase Phase
   */
  protected onChangePhase = async (phase: Phase) => {
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
  protected async modifiyFrontpageViews(phaseTermName: string) {
    const documentsViews = sp.web.lists.getByTitle(ProjectPhasesWebPartStrings.DocumentsListName).views;
    let [documentsFrontpageView] = await documentsViews.select('Id', 'ViewQuery').filter(`Title eq '${this.props.currentPhaseViewName}'`).get<{ Id: string, ViewQuery: string }[]>();
    if (documentsFrontpageView) {
      const viewQueryDom = new DOMParser().parseFromString(`<Query>${documentsFrontpageView.ViewQuery}</Query>`, 'text/xml');
      const orderByDomElement = viewQueryDom.getElementsByTagName('OrderBy')[0];
      const orderBy = orderByDomElement ? orderByDomElement.outerHTML : '';
      const newViewQuery = [orderBy, `<Where><Eq><FieldRef Name='GtProjectPhase' /><Value Type='Text'>${phaseTermName}</Value></Eq></Where>`].join('');
      try {
        await documentsViews.getById(documentsFrontpageView.Id).update({ ViewQuery: newViewQuery });
        Logger.write(`(ProjectPhases) modifiyFrontpageViews: Successfully updated ViewQuery for view '${this.props.currentPhaseViewName}' for list '${ProjectPhasesWebPartStrings.DocumentsListName}'`, LogLevel.Info);
      } catch (err) {
        Logger.write(`(ProjectPhases) modifiyFrontpageViews: Failed to update ViewQuery for view '${this.props.currentPhaseViewName}' for list '${ProjectPhasesWebPartStrings.DocumentsListName}'`, LogLevel.Error);
      }
    }
  }

  /**
   * Update web part properties
   * 
   * @param {string} pageName Page name
   * @param {string} webPartId Web Part Id
   * @param {Object} properties Properties
   * @param {boolean} publish Publish file
   */
  protected async updateWebPartProperties(pageName: string, webPartId: string, properties: { [key: string]: string }, publish: boolean = true) {
    const page = await ClientSidePage.fromFile(sp.web.getFileByServerRelativePath(`${this.props.pageContext.web.serverRelativeUrl}/SitePages/${pageName}.aspx`));
    const control = page.findControl<ClientSideWebpart>(c => objectGet(c, 'json.webPartId') === webPartId) as ClientSideWebpart;
    control.setProperties<any>({
      ...control.getProperties(),
      ...properties,
    });
    await page.save(publish);
  }

  /**
   * Update Planner Web Part
   * 
   * @param {string} phaseTermName Phase term name
   * @param {string} plannerWebPartId Planner Web Part Id
   */
  protected async updatePlannerWebPart(phaseTermName: string, plannerWebPartId: string = '39c4c1c2-63fa-41be-8cc2-f6c0b49b253d') {
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
  protected async fetchChecklistData(): Promise<ChecklistData> {
    try {
      const items = await this._phaseChecklist
        .items
        .select(
          'ID',
          'Title',
          'GtComment',
          'GtChecklistStatus',
          'GtProjectPhase'
        )
        .get<IPhaseChecklistItem[]>();
      const checkPointStatuses: ChecklistData = items
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

  /**
   * Get storage key
   * 
   * @param {string[]} parts Parts
   */
  protected generateStorageKey(...parts: string[]) {
    return ['ProjectPhases', ...parts, this.props.pageContext.web.absoluteUrl].join('.');
  }

  /***
   * Fetch phase terms
   * 
   * @param {ChecklistData} checklistData Check point status
   * @param {any} cachingOptions Caching options
   */
  protected async fetchData(checklistData: ChecklistData, cachingOptions: any): Promise<IProjectPhasesData> {
    Logger.log({ message: '(ProjectPhases) fetchData: Fetching TermSetId for selected field', level: LogLevel.Info });
    const { phaseField, pageContext, entity } = this.props;
    try {
      const hubSite = await HubSiteService.GetHubSite(sp, pageContext);
      const params = { webUrl: hubSite.url, ...entity };
      this._spEntityPortalService = new SpEntityPortalService(params);
      const [{ TermSetId: termSetId }, phaseTextField] = await Promise.all([
        sp.web.fields.getByInternalNameOrTitle(phaseField).select('TermSetId').usingCaching({
          ...cachingOptions,
          key: this.generateStorageKey('PhaseField', 'TermSetId'),
        }).get(),
        sp.web.fields.getByInternalNameOrTitle(`${phaseField}_0`).select('InternalName').usingCaching({
          ...cachingOptions,
          key: this.generateStorageKey('PhaseTextField', 'InternalName'),
        }).get(),
      ]);
      const [phaseTerms, entityItem] = await Promise.all([
        taxonomy.getDefaultSiteCollectionTermStore().getTermSetById(termSetId).terms.select('Id', 'Name', 'LocalCustomProperties').usingCaching({
          ...cachingOptions,
          key: this.generateStorageKey('ProjectPhases', 'PhaseTerms'),
        }).get(),
        this._spEntityPortalService.getEntityItem(pageContext.site.id.toString()),
      ]);
      const phases = phaseTerms
        .filter(term => term.LocalCustomProperties.ShowOnFrontpage !== 'false')
        .map(term => new Phase(term.Name, term.Id, checklistData[term.Id] || { stats: {}, items: [] }, term.LocalCustomProperties));
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

