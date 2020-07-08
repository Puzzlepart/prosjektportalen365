import { stringIsNullOrEmpty } from '@pnp/common'
import { Logger, LogLevel } from '@pnp/logging'
import { sp } from '@pnp/sp'
import { Phase } from 'models'
import { MessageBar, MessageBarType } from 'office-ui-fabric-react/lib/MessageBar'
import { Spinner } from 'office-ui-fabric-react/lib/Spinner'
import * as strings from 'ProjectWebPartsStrings'
import * as React from 'react'
import * as format from 'string-format'
import SPDataAdapter from '../../data'
import { UserMessage } from '../UserMessage'
import ChangePhaseDialog from './ChangePhaseDialog'
import { IProjectPhasesProps,IProjectPhasesState,IProjectPhasesData } from './types'
import ProjectPhase from './ProjectPhase'
import ProjectPhaseCallout from './ProjectPhaseCallout'
import styles from './ProjectPhases.module.scss'

/**
 * @component ProjectPhases
 */
export class ProjectPhases extends React.Component<IProjectPhasesProps, IProjectPhasesState> {
  /**
   * Constructor
   * 
   * @param {IProjectPhasesProps} props Initial props
   */
  constructor(props: IProjectPhasesProps) {
    super(props)
    this.state = { isLoading: true, data: {} }
  }

  public async componentDidMount() {
    if (stringIsNullOrEmpty(this.props.phaseField)) return
    try {
      const data = await this._fetchData()
      this.setState({ isLoading: false, data })
    } catch (error) {
      this.setState({ isLoading: false, error })
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
      )
    }
    if (this.state.hidden) {
      return null
    }
    if (this.state.isLoading) {
      return (
        <div className={styles.projectPhases}>
          <div className={styles.container}>
            <Spinner label={format(strings.LoadingText, 'fasevelger')} />
          </div>
        </div>
      )
    }
    if (this.state.error) {
      return (
        <UserMessage
          messageBarType={MessageBarType.severeWarning}
          onDismiss={() => this.setState({ hidden: true })}
          text={strings.WebPartNoAccessMessage} />
      )
    }

    const { phases, currentPhase } = this.state.data

    const visiblePhases = phases.filter(p => p.properties.ShowOnFrontpage !== 'false')

    return (
      <div className={styles.projectPhases}>
        <div className={styles.container}>
          <ul className={styles.phaseList}>
            {visiblePhases.map((phase, idx) => (
              <ProjectPhase
                key={idx}
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
            webUrl={this.props.webUrl}
            isSiteAdmin={this.props.isSiteAdmin}
            onChangePhase={phase => this.setState({ confirmPhase: phase })}
            onDismiss={this._onProjectPhaseCalloutDismiss.bind(this)} />
        )}
        {this.state.confirmPhase && (
          <ChangePhaseDialog
            activePhase={this.state.data.currentPhase}
            newPhase={this.state.confirmPhase}
            onDismiss={() => this.setState({ confirmPhase: null })}
            onChangePhase={this._onChangePhase.bind(this)} />
        )}
      </div>
    )
  }

  /**
   * On open callout
   * 
   * @param {HTMLSpanElement} target Target
   * @param {Phase} phase Phase
   */
  private _onOpenCallout(target: HTMLSpanElement, phase: Phase): void {
    this.setState({ phaseMouseOver: { target, model: phase } })
  }

  /**
   * On <ProjectPhaseCallout /> dismiss
   */
  private _onProjectPhaseCalloutDismiss() {
    this.setState({ phaseMouseOver: null })
  }

  /**
   * Change phase
   * 
   * @param {Phase} phase Phase
   */
  private async _onChangePhase(phase: Phase) {
    try {
      Logger.log({ message: `(ProjectPhases) _onChangePhase: Changing phase to ${phase.name}`, level: LogLevel.Info })
      this.setState({ isChangingPhase: true })
      await SPDataAdapter.project.updatePhase(phase, this.state.data.phaseTextField)
      await this._modifyDocumentViews(phase.name)
      sessionStorage.clear()
      this.setState({ data: { ...this.state.data, currentPhase: phase }, confirmPhase: null, isChangingPhase: false })
      window.setTimeout(() => document.location.href = `${this.props.webUrl}#syncproperties=1`, 3000)
    } catch (error) {
      Logger.log({ message: '(ProjectPhases) _onChangePhase: Failed to change phase', level: LogLevel.Warning })
      this.setState({ confirmPhase: null, isChangingPhase: false })
    }
  }

  /**
   * Modify frontpage views
   * 
   * @param {string} phaseTermName Phase term name
   */
  private async _modifyDocumentViews(phaseTermName: string) {
    const documentsViews = sp.web.lists.getByTitle(strings.DocumentsListName).views
    const [documentsFrontpageView] = await documentsViews.select('Id', 'ViewQuery').filter(`Title eq '${this.props.currentPhaseViewName}'`).get<{ Id: string; ViewQuery: string }[]>()
    if (!documentsFrontpageView) return
    const viewQueryDom = new DOMParser().parseFromString(`<Query> ${documentsFrontpageView.ViewQuery}</Query> `, 'text/xml')
    const orderByDomElement = viewQueryDom.getElementsByTagName('OrderBy')[0]
    const orderBy = orderByDomElement ? orderByDomElement.outerHTML : ''
    const newViewQuery = [orderBy, `<Where><Eq><FieldRef Name='GtProjectPhase' /><Value Type='Text'>${phaseTermName}</Value></Eq></Where>`].join('')
    try {
      await documentsViews.getById(documentsFrontpageView.Id).update({ ViewQuery: newViewQuery })
      Logger.write(`(ProjectPhases) _modifyDocumentViews: Successfully updated ViewQuery for view '${this.props.currentPhaseViewName}' for list '${strings.DocumentsListName}'`, LogLevel.Info)
    } catch (err) {
      Logger.write(`(ProjectPhases) _modifyDocumentViews: Failed to update ViewQuery for view '${this.props.currentPhaseViewName}' for list '${strings.DocumentsListName}'`, LogLevel.Error)
    }
  }

  /***
   * Fetch phase terms
   */
  private async _fetchData(): Promise<IProjectPhasesData> {
    try {
      const [phaseFieldCtx, checklistData] = await Promise.all([
        SPDataAdapter.getTermFieldContext(this.props.phaseField),
        SPDataAdapter.project.getChecklistData(strings.PhaseChecklistName),
      ])
      const [phases, currentPhaseName] = await Promise.all([
        SPDataAdapter.project.getPhases(phaseFieldCtx.termSetId, checklistData),
        SPDataAdapter.project.getCurrentPhaseName(phaseFieldCtx.fieldName),
      ])
      Logger.log({ message: '(ProjectPhases) _fetchData: Successfully fetch phases', level: LogLevel.Info })
      const [currentPhase] = phases.filter(p => p.name === currentPhaseName)
      return {
        currentPhase,
        phases,
        phaseTextField: phaseFieldCtx.phaseTextField,
      }
    } catch (error) {
      throw new Error()
    }
  }
}

export { IProjectPhasesProps }

