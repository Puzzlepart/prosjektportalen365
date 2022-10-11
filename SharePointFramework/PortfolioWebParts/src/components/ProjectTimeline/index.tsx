import { getId } from '@uifabric/utilities'
import { CommandBar, ICommandBarProps } from 'office-ui-fabric-react/lib/CommandBar'
import { ContextualMenuItemType } from 'office-ui-fabric-react/lib/ContextualMenu'
import { MessageBar, MessageBarType } from 'office-ui-fabric-react/lib/MessageBar'
import { format } from 'office-ui-fabric-react/lib/Utilities'
import { Spinner } from 'office-ui-fabric-react/lib/Spinner'
import * as strings from 'PortfolioWebPartsStrings'
import React, { FunctionComponent } from 'react'
import _ from 'underscore'
import { FilterPanel } from '../FilterPanel'
import { DetailsCallout } from './DetailsCallout'
import { Timeline } from './Timeline'
import styles from './ProjectTimeline.module.scss'
import { IProjectTimelineProps } from './types'
import './ProjectTimeline.overrides.css'
import { UserMessage } from 'pp365-shared/lib/components/UserMessage'
import { useProjectTimeline } from './useProjectTimeline'
import { ProjectTimelineContext } from './context'
import { ITimelineItem } from 'interfaces'

export const ProjectTimeline: FunctionComponent<IProjectTimelineProps> = (props) => {
  const { state, setState, onFilterChange } = useProjectTimeline(props)

  /**
   * On item click
   *
   * @param event Event
   * @param item Item
   */
  const onItemClick = (event: React.MouseEvent<HTMLDivElement, MouseEvent>, item: ITimelineItem) => {
    setState({ showDetails: { element: event.currentTarget, item } })
  }
  /**
   * Get command bar items
   */
  const getCommandBarProps = (): ICommandBarProps => {
    const cmd: ICommandBarProps = { items: [], farItems: [] }
    cmd.farItems.push({
      key: getId('Filter'),
      name: strings.FilterText,
      iconProps: { iconName: 'Filter' },
      itemType: ContextualMenuItemType.Header,
      buttonStyles: { root: { border: 'none', height: '40px' } },
      iconOnly: true,
      onClick: (ev) => {
        ev.preventDefault()
        setState({ showFilterPanel: true })
      }
    })
    return cmd
  }

  return (
    <ProjectTimelineContext.Provider value={{ props, state, setState, onFilterChange }}>
      <div className={styles.root}>
        <div className={styles.container}>
          <div className={styles.commandBar}>
            <CommandBar {...getCommandBarProps()} />
          </div>
          <div className={styles.header}>
            <div className={styles.title}>{props.title}</div>
          </div>
          <div className={styles.infoText}>
            <MessageBar>
              <div
                dangerouslySetInnerHTML={{
                  __html: format(
                    props.infoText ? props.infoText : strings.ProjectTimelineInfoText,
                    encodeURIComponent(window.location.href)
                  )
                }}></div>
            </MessageBar>
          </div>
          {state.loading ? (
            <div className={styles.root}>
              <div className={styles.container}>
                <Spinner label={format(strings.LoadingText, props.title)} />
              </div>
            </div>
          ) :
            state.error ? (
              <UserMessage type={MessageBarType.severeWarning} text={state.error.message} />
            ) : (
              <>
                <Timeline
                  defaultTimeStart={[-1, 'months']}
                  defaultTimeEnd={[1, 'years']}
                  _onItemClick={onItemClick.bind(this)}
                  groups={state.filteredData.groups}
                  items={state.filteredData.items}
                />
                <FilterPanel
                  isOpen={state.showFilterPanel}
                  headerText={strings.FilterText}
                  filters={state.filters}
                  onFilterChange={onFilterChange.bind(this)}
                  isLightDismiss
                  onDismiss={() => setState({ showFilterPanel: false })}
                />
              </>)}
        </div>
        {state.showDetails && (
          <DetailsCallout
            timelineItem={state.showDetails}
            onDismiss={() => setState({ showDetails: null })}
          />
        )}
      </div>
    </ProjectTimelineContext.Provider>
  )
}

export * from './types'
