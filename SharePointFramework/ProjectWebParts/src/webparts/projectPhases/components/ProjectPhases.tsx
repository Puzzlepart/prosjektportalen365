import * as React from 'react';
import { Logger, LogLevel } from '@pnp/logging';
import { sp } from '@pnp/sp';
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
import * as format from 'string-format';
import { ChecklistData } from './ChecklistData';

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
    await this.props.spEntityPortalService.updateEntityItem(this.props.context.pageContext.site.id.toString(), { [this.state.data.phaseTextField]: phase.toString() });
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
      await this.modifiyFrontpageViews(phase.name);
      this.setState({ data: { ...this.state.data, currentPhase: phase }, confirmPhase: null, isChangingPhase: false });
      if (this.props.automaticReload) {
        window.setTimeout(() => {
          document.location.href = this.props.webAbsoluteUrl;
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
    const { web, updateViewsDocuments, updateViewsRisks, updateViewName } = this.props;
    const listsToUpdate = [updateViewsDocuments && strings.DocumentsListName, updateViewsRisks && strings.RiskRegisterListName].filter(l => l);
    const viewsPromises = listsToUpdate.map(t => web.lists.getByTitle(t).views.get());
    const viewsResult = await Promise.all(viewsPromises);
    for (let i = 0; i < viewsResult.length; i++) {
      const listName = listsToUpdate[i];
      const [frontpageView] = viewsResult[i].filter(v => v.Title === updateViewName);
      if (frontpageView) {
        const pnpFrontpageView = web.lists.getByTitle(listName).views.getById(frontpageView.Id);
        const { ViewQuery } = await pnpFrontpageView.select('ViewQuery').get();
        const viewQueryDom = new DOMParser().parseFromString(`<Query>${ViewQuery}</Query>`, 'text/xml');
        const orderByDomElement = viewQueryDom.getElementsByTagName('OrderBy')[0];
        const orderBy = orderByDomElement ? orderByDomElement.outerHTML : '';
        const newViewQuery = [orderBy, `<Where><Eq><FieldRef Name='GtProjectPhase' /><Value Type='Text'>${phaseTermName}</Value></Eq></Where>`].join('');
        try {
          await pnpFrontpageView.update({ ViewQuery: newViewQuery });
          Logger.write(`(ProjectPhases) modifiyFrontpageViews: Successfully updated ViewQuery for view '${updateViewName}' for list '${listName}'`, LogLevel.Info);
        } catch (err) {
          Logger.write(`(ProjectPhases) modifiyFrontpageViews: Failed to update ViewQuery for view '${updateViewName}' for list '${listName}'`, LogLevel.Error);
        }
      }
    }
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
    const { web, spEntityPortalService, phaseField, context } = this.props;
    try {
      const [{ TermSetId: termSetId }, phaseTextField] = await Promise.all([
        web.fields.getByInternalNameOrTitle(phaseField).select('TermSetId').usingCaching().get(),
        web.fields.getByInternalNameOrTitle(`${phaseField}_0`).select('InternalName').usingCaching().get(),
      ]);
      const [phaseTerms, entityItem] = await Promise.all([
        taxonomy.getDefaultSiteCollectionTermStore().getTermSetById(termSetId).terms.usingCaching().get(),
        spEntityPortalService.getEntityItem(context.pageContext.site.id.toString()),
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
