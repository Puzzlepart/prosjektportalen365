import { Logger, LogLevel } from '@pnp/logging';
import { List, sp } from '@pnp/sp';
import { Phase } from 'models';
import { MessageBar, MessageBarType } from 'office-ui-fabric-react/lib/MessageBar';
import { Spinner } from 'office-ui-fabric-react/lib/Spinner';
import * as strings from 'ProjectWebPartsStrings';
import * as React from 'react';
import { SpEntityPortalService } from 'sp-entityportal-service';
import * as format from 'string-format';
import SPDataAdapter from '../../data';
import ChangePhaseDialog from './ChangePhaseDialog/index';
import { IProjectPhasesProps } from './IProjectPhasesProps';
import { IProjectPhasesData, IProjectPhasesState } from './IProjectPhasesState';
import ProjectPhase from './ProjectPhase';
import ProjectPhaseCallout from './ProjectPhaseCallout/index';
import styles from './ProjectPhases.module.scss';

/**
 * @component ProjectPhases
 */
export class ProjectPhases extends React.Component<IProjectPhasesProps, IProjectPhasesState> {
  private _spEntityPortalService: SpEntityPortalService;
  private _checkList: List;

  /**
   * Constructor
   * 
   * @param {IProjectPhasesProps} props Initial props
   */
  constructor(props: IProjectPhasesProps) {
    super(props);
    this.state = { isLoading: true, data: {} };
    this._checkList = sp.web.lists.getByTitle(strings.PhaseChecklistName);
    this._spEntityPortalService = new SpEntityPortalService({
      webUrl: props.hubSiteUrl,
      fieldPrefix: 'Gt',
      ...props.entity,
    });
    SPDataAdapter.configure({
      spEntityPortalService: this._spEntityPortalService,
      siteId: props.siteId,
      webUrl: props.webUrl,
      hubSiteUrl: props.hubSiteUrl,
    });
  }

  public async componentDidMount() {
    if (this.props.phaseField) {
      const data = await this._fetchData();
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
          <div className={styles.container}>
            <MessageBar messageBarType={MessageBarType.error}>{strings.WebPartNotConfiguredMessage}</MessageBar>
          </div>
        </div>
      );
    }
    if (this.state.isLoading) {
      return (
        <div className={styles.projectPhases}>
          <div className={styles.container}>
            <Spinner label={format(strings.LoadingText, 'fasevelger')} />
          </div>
        </div>
      );
    }

    const { phases, currentPhase } = this.state.data;

    let visiblePhases = phases.filter(p => p.properties.ShowOnFrontpage !== 'false');

    return (
      <div className={styles.projectPhases}>
        <div className={styles.container}>
          <ul className={styles.phaseList}>
            {visiblePhases.map(phase => (
              <ProjectPhase
                phase={phase}
                isCurrentPhase={currentPhase && (phase.id === currentPhase.id)}
                onOpenCallout={target => this._onOpenCallout(target, phase)} />
            ))}
          </ul>
        </div>
        {this.state.phaseMouseOver && (
          <ProjectPhaseCallout
            phase={this.state.phaseMouseOver}
            isCurrentPhase={currentPhase && (this.state.phaseMouseOver.model.id === currentPhase.id)}
            phaseSubTextProperty={this.props.phaseSubTextProperty}
            webUrl={this.props.webUrl}
            isSiteAdmin={this.props.isSiteAdmin}
            onChangePhase={phase => this.setState({ confirmPhase: phase })}
            onDismiss={this._onProjectPhaseCalloutDismiss.bind(this)} />
        )}
        {this.state.confirmPhase && (
          <ChangePhaseDialog
            activePhase={this.state.data.currentPhase}
            newPhase={this.state.confirmPhase}
            phaseChecklist={this._checkList}
            onDismiss={_ => this.setState({ confirmPhase: null })}
            onChangePhase={this._onChangePhase.bind(this)} />
        )}
      </div>
    );
  }

  /**
   * On open callout
   * 
   * @param {HTMLSpanElement} target Target
   * @param {Phase} phase Phase
   */
  private _onOpenCallout(target: HTMLSpanElement, phase: Phase): void {
    this.setState({ phaseMouseOver: { target, model: phase } });
  }

  /**
   * On <ProjectPhaseCallout /> dismiss
   */
  private _onProjectPhaseCalloutDismiss() {
    this.setState({ phaseMouseOver: null });
  }

  /**
   * Change phase
   * 
   * @param {Phase} phase Phase
   */
  private async _onChangePhase(phase: Phase) {
    try {
      Logger.log({ message: `(ProjectPhases) _onChangePhase: Changing phase to ${phase.name}`, level: LogLevel.Info });
      this.setState({ isChangingPhase: true });
      await SPDataAdapter.updatePhase(phase, this.state.data.phaseTextField);
      await this._modifyDocumentViews(phase.name);
      sessionStorage.clear();
      this.setState({ data: { ...this.state.data, currentPhase: phase }, confirmPhase: null, isChangingPhase: false });
      if (this.props.automaticReload) {
        window.setTimeout(() => {
          document.location.href = this.props.webUrl;
        }, (this.props.reloadTimeout * 5000));
      } else {
        Logger.log({ message: '(ProjectPhases) _onChangePhase: Successfully changed phase. Automatic reload is disabled.', level: LogLevel.Info });
      }
    } catch (error) {
      console.log(error);
      Logger.log({ message: '(ProjectPhases) _onChangePhase: Failed to change phase', level: LogLevel.Warning });
      this.setState({ confirmPhase: null, isChangingPhase: false });
    }
  }

  /**
   * Modify frontpage views
   * 
   * @param {string} phaseTermName Phase term name
   */
  private async _modifyDocumentViews(phaseTermName: string) {
    const documentsViews = sp.web.lists.getByTitle(strings.DocumentsListName).views;
    let [documentsFrontpageView] = await documentsViews.select('Id', 'ViewQuery').filter(`Title eq '${this.props.currentPhaseViewName}'`).get<{ Id: string, ViewQuery: string }[]>();
    if (!documentsFrontpageView) return;
    const viewQueryDom = new DOMParser().parseFromString(`<Query>${documentsFrontpageView.ViewQuery}</Query>`, 'text/xml');
    const orderByDomElement = viewQueryDom.getElementsByTagName('OrderBy')[0];
    const orderBy = orderByDomElement ? orderByDomElement.outerHTML : '';
    const newViewQuery = [orderBy, `<Where><Eq><FieldRef Name='GtProjectPhase' /><Value Type='Text'>${phaseTermName}</Value></Eq></Where>`].join('');
    try {
      await documentsViews.getById(documentsFrontpageView.Id).update({ ViewQuery: newViewQuery });
      Logger.write(`(ProjectPhases) _modifyDocumentViews: Successfully updated ViewQuery for view '${this.props.currentPhaseViewName}' for list '${strings.DocumentsListName}'`, LogLevel.Info);
    } catch (err) {
      Logger.write(`(ProjectPhases) _modifyDocumentViews: Failed to update ViewQuery for view '${this.props.currentPhaseViewName}' for list '${strings.DocumentsListName}'`, LogLevel.Error);
    }
  }

  /***
   * Fetch phase terms
   */
  private async _fetchData(): Promise<IProjectPhasesData> {
    try {
      const [phaseFieldCtx, checklistData] = await Promise.all([
        SPDataAdapter.getTermFieldContext(this.props.phaseField),
        SPDataAdapter.getChecklistData(this._checkList),
      ]);
      const [phases, currentPhaseName] = await Promise.all([
        SPDataAdapter.getPhases(phaseFieldCtx.termSetId, checklistData),
        SPDataAdapter.getCurrentPhaseName(),
      ]);
      Logger.log({ message: '(ProjectPhases) _fetchData: Successfully fetch phases', level: LogLevel.Info });
      let [currentPhase] = phases.filter(p => p.name === currentPhaseName);
      return {
        currentPhase,
        phases,
        phaseTextField: phaseFieldCtx.phaseTextField,
      };
    } catch (err) {
      throw err;
    }
  }
}

export { IProjectPhasesProps };

