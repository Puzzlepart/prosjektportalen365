import { UserMessage } from 'components/UserMessage'
import { MessageBarType } from 'office-ui-fabric-react/lib/MessageBar'
import { Spinner } from 'office-ui-fabric-react/lib/Spinner'
import { format } from 'office-ui-fabric-react/lib/Utilities'
import * as strings from 'ProjectWebPartsStrings'
import React, { useEffect, useReducer } from 'react'
import { ProjectPhasesContext } from './context'
import { fetchData } from './fetchData'
import { ProjectPhase } from './ProjectPhase'
import { ProjectPhaseCallout } from './ProjectPhase/ProjectPhaseCallout'
import styles from './ProjectPhases.module.scss'
import reducer, { HIDE_MESSAGE, initState, INIT_DATA, OPEN_CALLOUT } from './reducer'
import { IProjectPhasesProps } from './types'

export const ProjectPhases = (props: IProjectPhasesProps) => {
  const [state, dispatch] = useReducer(reducer, initState())

  useEffect(() => {
    fetchData(props.phaseField).then(data => dispatch(INIT_DATA({ data })))
  }, [])

  if (state.hidden) return null

  if (state.isLoading) {
    return (
      <div className={styles.projectPhases}>
        <div className={styles.container}>
          <Spinner label={format(strings.LoadingText, 'fasevelger')} />
        </div>
      </div>
    )
  }

  if (state.error) {
    return (
      <UserMessage
        messageBarType={MessageBarType.severeWarning}
        onDismiss={() => dispatch(HIDE_MESSAGE())}
        text={strings.WebPartNoAccessMessage}
      />
    )
  }

  return (
    <ProjectPhasesContext.Provider value={{ state, dispatch }}>
      <div className={styles.projectPhases}>
        <div className={styles.container}>
          <ul className={styles.phaseList}>
            {state.data.phases.filter((p) => p.isVisible).map((phase, idx) => (
              <ProjectPhase
                key={idx}
                phase={phase}
                isCurrentPhase={phase.id === state.data.currentPhase?.id}
                onOpenCallout={(target) => dispatch(OPEN_CALLOUT({ phase, target }))}
              />
            ))}
          </ul>
        </div>
        {state.callout && (
          <ProjectPhaseCallout {...state.callout} />
        )}
        {/* {this.state.confirmPhase && (
            <ChangePhaseDialog onDismiss={() => this.setState({ confirmPhase: null })} />
          )} */}
      </div>
    </ProjectPhasesContext.Provider>
  )
}

// export class ProjectPhases2 extends Component<IProjectPhasesProps, IProjectPhasesState> {
//   /**
//    * Constructor
//    *
//    * @param {IProjectPhasesProps} props Initial props
//    */
//   constructor(props: IProjectPhasesProps) {
//     super(props)
//     this.state = { isLoading: true, data: {} }
//   }

//   public async componentDidMount() {
//     if (stringIsNullOrEmpty(this.props.phaseField)) return
//     try {
//       const data = await this._fetchData()
//       this.setState({ isLoading: false, data })
//     } catch (error) {
//       this.setState({ isLoading: false, error })
//     }
//   }

//   /**
//    * Renders the <ProjectPhases /> component
//    */
//   public render(): React.ReactElement<IProjectPhasesProps> {
//     if (!this.props.phaseField) {
//       return (
//         <div className={styles.projectPhases}>
//           <div className={styles.container}>
//             <MessageBar messageBarType={MessageBarType.error}>
//               {strings.WebPartNotConfiguredMessage}
//             </MessageBar>
//           </div>
//         </div>
//       )
//     }
//     if (this.state.hidden) {
//       return null
//     }
//     if (this.state.isLoading) {
//       return (
//         <div className={styles.projectPhases}>
//           <div className={styles.container}>
//             <Spinner label={format(strings.LoadingText, 'fasevelger')} />
//           </div>
//         </div>
//       )
//     }
//     if (this.state.error) {
//       return (
//         <UserMessage
//           messageBarType={MessageBarType.severeWarning}
//           onDismiss={() => this.setState({ hidden: true })}
//           text={strings.WebPartNoAccessMessage}
//         />
//       )
//     }

//     const { phases, currentPhase } = this.state.data

//   }

//   /**
//    * On open callout
//    *
//    * @param {HTMLSpanElement} target Target
//    * @param {ProjectPhaseModel} phase Phase
//    */
//   private _onOpenCallout(target: HTMLSpanElement, phase: ProjectPhaseModel): void {
//     this.setState({ phaseMouseOver: { target, model: phase } })
//   }

//   /**
//    * On <ProjectPhaseCallout /> dismiss
//    */
//   private _onProjectPhaseCalloutDismiss() {
//     this.setState({ phaseMouseOver: null })
//   }

//   /**
//    * Change phase
//    *
//    * @param {ProjectPhaseModel} phase Phase
//    */
//   // private async _onChangePhase(phase: ProjectPhaseModel) {
//   //   try {
//   //     Logger.log({
//   //       message: `(ProjectPhases) _onChangePhase: Changing phase to ${phase.name}`,
//   //       level: LogLevel.Info
//   //     })
//   //     this.setState({ isChangingPhase: true })
//   //     await SPDataAdapter.project.updatePhase(phase, this.state.data.phaseTextField)
//   //     await this._modifyDocumentViews(phase.name)
//   //     sessionStorage.clear()
//   //     this.setState({
//   //       data: { ...this.state.data, currentPhase: phase },
//   //       confirmPhase: null,
//   //       isChangingPhase: false
//   //     })
//   //     window.setTimeout(
//   //       () => (document.location.href = `${this.props.webUrl}#syncproperties=1`),
//   //       3000
//   //     )
//   //   } catch (error) {
//   //     Logger.log({
//   //       message: '(ProjectPhases) _onChangePhase: Failed to change phase',
//   //       level: LogLevel.Warning
//   //     })
//   //     this.setState({ confirmPhase: null, isChangingPhase: false })
//   //   }
//   // }

//   /**
//    * Modify frontpage views
//    *
//    * @param {string} phaseTermName Phase term name
//    */
//   // private async _modifyDocumentViews(phaseTermName: string) {
//   //   const documentsViews = sp.web.lists.getByTitle(strings.DocumentsListName).views
//   //   const [documentsFrontpageView] = await documentsViews
//   //     .select('Id', 'ViewQuery')
//   //     .filter(`Title eq '${this.props.currentPhaseViewName}'`)
//   //     .get<{ Id: string; ViewQuery: string }[]>()
//   //   if (!documentsFrontpageView) return
//   //   const viewQueryDom = new DOMParser().parseFromString(
//   //     `<Query> ${documentsFrontpageView.ViewQuery}</Query> `,
//   //     'text/xml'
//   //   )
//   //   const orderByDomElement = viewQueryDom.getElementsByTagName('OrderBy')[0]
//   //   const orderBy = orderByDomElement ? orderByDomElement.outerHTML : ''
//   //   const newViewQuery = [
//   //     orderBy,
//   //     `<Where><Eq><FieldRef Name='GtProjectPhase' /><Value Type='Text'>${phaseTermName}</Value></Eq></Where>`
//   //   ].join('')
//   //   try {
//   //     await documentsViews.getById(documentsFrontpageView.Id).update({ ViewQuery: newViewQuery })
//   //     Logger.write(
//   //       `(ProjectPhases) _modifyDocumentViews: Successfully updated ViewQuery for view '${this.props.currentPhaseViewName}' for list '${strings.DocumentsListName}'`,
//   //       LogLevel.Info
//   //     )
//   //   } catch (err) {
//   //     Logger.write(
//   //       `(ProjectPhases) _modifyDocumentViews: Failed to update ViewQuery for view '${this.props.currentPhaseViewName}' for list '${strings.DocumentsListName}'`,
//   //       LogLevel.Error
//   //     )
//   //   }
//   // }
// }

export * from './types'
