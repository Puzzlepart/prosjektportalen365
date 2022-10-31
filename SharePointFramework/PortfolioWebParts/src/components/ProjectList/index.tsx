import {
  IColumn,
  MessageBar,
  MessageBarType,
  Pivot,
  PivotItem,
  SearchBox,
  SelectionMode,
  ShimmeredDetailsList,
  Toggle
} from '@fluentui/react'
import { Web } from '@pnp/sp'
import { ProjectListModel } from 'models'
import * as strings from 'PortfolioWebPartsStrings'
import { ProjectInformationPanel } from 'pp365-projectwebparts/lib/components/ProjectInformationPanel'
import { getObjectValue } from 'pp365-shared/lib/helpers'
import React, { FC } from 'react'
import { find, isEmpty } from 'underscore'
import { ProjectCard } from './ProjectCard'
import styles from './ProjectList.module.scss'
import { PROJECTLIST_COLUMNS } from './ProjectListColumns'
import { ProjectListViews } from './ProjectListViews'
import { IProjectListProps } from './types'
import { useProjectList } from './useProjectList'

export const ProjectList: FC<IProjectListProps> = (props) => {
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
    if (state.loading) {
      return projects.map((_, idx) => <ProjectCard key={idx} isDataLoaded={false} />)
    }
    switch (state.renderAs) {
      case 'tiles': {
        return projects.map((project, idx) => (
          <ProjectCard
            key={idx}
            project={project}
            showProjectLogo={props.showProjectLogo}
            showProjectOwner={props.showProjectOwner}
            showProjectManager={props.showProjectManager}
            actions={getCardActions(project)}
          />
        ))
      }
      case 'list': {
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
        <div className={styles.projectDisplaySelect}>
          <Pivot
            onLinkClick={({ props }) =>
              setState({ selectedView: find(ProjectListViews, (v) => v.itemKey === props.itemKey) })
            }
            selectedKey={state.selectedView.itemKey}>
            {ProjectListViews.map((props) => (
              <PivotItem
                key={props.itemKey}
                itemKey={props.itemKey}
                headerText={props.headerText}
                itemIcon={props.itemIcon}
                headerButtonProps={
                  !state.isUserInPortfolioManagerGroup && {
                    disabled: true,
                    style: { opacity: 0.3, cursor: 'default' }
                  }
                }
              />
            ))}
          </Pivot>
        </div>
        <div className={styles.searchBox} hidden={!props.showSearchBox}>
          <SearchBox
            disabled={state.loading || isEmpty(state.projects)}
            placeholder={getSearchBoxPlaceholder()}
            onChanged={onSearch}
          />
        </div>
        <div className={styles.renderAsToggle} hidden={!props.showViewSelector}>
          <Toggle
            offText={strings.RenderAsListText}
            onText={strings.RenderAsTilesText}
            defaultChecked={state.renderAs === 'tiles'}
            disabled={state.loading || isEmpty(state.projects)}
            inlineLabel={true}
            onChanged={(checked) => setState({ renderAs: checked ? 'tiles' : 'list' })}
          />
        </div>
        {!state.loading && isEmpty(projects) && (
          <div className={styles.emptyMessage}>
            <MessageBar>{strings.ProjectListEmptyText}</MessageBar>
          </div>
        )}
        <div className={styles.projects}>{renderProjects(projects)}</div>
      </div>
      <ProjectInformationPanel
        key={state.showProjectInfo?.siteId}
        title={state.showProjectInfo?.title}
        siteId={state.showProjectInfo?.siteId}
        webUrl={state.showProjectInfo?.url}
        hubSite={{
          web: new Web(props.pageContext.site.absoluteUrl),
          url: props.pageContext.site.absoluteUrl
        }}
        page='Portfolio'
        hidden={!state.showProjectInfo}
        hideAllActions={true}
      />
    </div>
  )
}

ProjectList.defaultProps = {
  columns: PROJECTLIST_COLUMNS,
  sortBy: 'Title'
}

export * from './types'
