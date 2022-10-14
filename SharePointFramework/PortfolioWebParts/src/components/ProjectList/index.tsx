import {
  ShimmeredDetailsList,
  SelectionMode,
  IColumn,
  MessageBar,
  MessageBarType,
  Pivot,
  PivotItem,
  SearchBox,
  Toggle,
  Spinner,
  SpinnerSize
} from '@fluentui/react'
import { ProjectListModel } from 'models'
import * as strings from 'PortfolioWebPartsStrings'
import { getObjectValue } from 'pp365-shared/lib/helpers'
import React, { FunctionComponent } from 'react'
import { isEmpty } from 'underscore'
import { ProjectCard } from './ProjectCard'
import styles from './ProjectList.module.scss'
import { PROJECTLIST_COLUMNS } from './ProjectListColumns'
import { IProjectListProps } from './types'
import { useProjectList } from './useProjectList'

export const ProjectList: FunctionComponent<IProjectListProps> = (props) => {
  const {
    state,
    setState,
    projects,
    getCardActions,
    getSearchBoxPlaceholder,
    onListSort,
    onSearch
  } = useProjectList(props)

  /**
   * Render projects
   *
   * @param projects - Projects
   */
  function renderProjects(projects: ProjectListModel[]) {
    if (state.showAsTiles) {
      return projects.map((project, idx) => (
        <ProjectCard
          key={idx}
          project={project}
          shouldTruncateTitle={true}
          showProjectLogo={props.showProjectLogo}
          showProjectOwner={props.showProjectOwner}
          showProjectManager={props.showProjectManager}
          actions={getCardActions(project)}
        />
      ))
    } else {
      const columns = props.columns.map((col) => {
        col.isSorted = col.key === state.sort?.fieldName
        if (col.isSorted) {
          col.isSortedDescending = state.sort?.isSortedDescending
        }
        return col
      })
      return (
        <ShimmeredDetailsList
          enableShimmer={state.loading}
          items={projects}
          columns={columns}
          onRenderItemColumn={onRenderItemColumn}
          onColumnHeaderClick={onListSort}
          selectionMode={SelectionMode.none}
        />
      )
    }
  }

  /**
   * On render item column
   *
   * @param project - Project
   * @param _index - Index
   * @param column - Column
   */
  function onRenderItemColumn(project: ProjectListModel, _index: number, column: IColumn) {
    const colValue = getObjectValue(project, column.fieldName, null)
    if (column.fieldName === 'title') {
      if (project.userIsMember) return <a href={project.url}>{colValue}</a>
      return <>{colValue}</>
    }
    return colValue
  }

  if (state.error) {
    return (
      <div className={styles.root}>
        <MessageBar messageBarType={MessageBarType.error}>{strings.ErrorText}</MessageBar>
      </div>
    )
  }

  return (
    <div className={styles.root}>
      <div className={styles.container}>
        {state.isUserInPortfolioManagerGroup && (
          <div className={styles.projectDisplaySelect}>
            <Pivot
              onLinkClick={({ props }) => setState({ selectedView: props.itemKey })}
              selectedKey={state.selectedView}>
              <PivotItem
                headerText={strings.MyProjectsLabel}
                itemKey='my_projects'
                itemIcon='FabricUserFolder'
              />
              <PivotItem
                headerText={strings.AllProjectsLabel}
                itemKey='all_projects'
                itemIcon='AllApps'
              />
              <PivotItem
                headerText={strings.ParentProjectLabel}
                itemKey='parent_projects'
                itemIcon='ProductVariant'
              />
              <PivotItem
                headerText={strings.ProgramLabel}
                itemKey='program'
                itemIcon='ProductList'
              />
            </Pivot>
          </div>
        )}
        <div className={styles.searchBox} hidden={!props.showSearchBox}>
          <SearchBox
            disabled={state.loading}
            placeholder={getSearchBoxPlaceholder()}
            onChanged={onSearch}
          />
        </div>
        <div className={styles.viewToggle} hidden={!props.showViewSelector}>
          <Toggle
            offText={strings.ShowAsListText}
            onText={strings.ShowAsTilesText}
            defaultChecked={state.showAsTiles}
            disabled={state.loading}
            inlineLabel={true}
            onChanged={(showAsTiles) => setState({ showAsTiles })}
          />
        </div>
        {state.loading && (
          <div className={styles.spinner}>
            <Spinner size={SpinnerSize.large} label={strings.ProjectListLoadingText} />
          </div>
        )}
        {!state.loading && isEmpty(projects) && (
          <div className={styles.emptyMessage}>
            <MessageBar>{strings.ProjectListEmptyText}</MessageBar>
          </div>
        )}
        {!isEmpty(projects) && <div className={styles.projects}>{renderProjects(projects)}</div>}
      </div>
    </div>
  )
}

ProjectList.defaultProps = {
  columns: PROJECTLIST_COLUMNS,
  sortBy: 'Title'
}

export * from './types'
