import {
  FluentProvider,
  IdPrefixProvider,
  SelectTabData,
  Tab,
  TabList
} from '@fluentui/react-components'
import { SearchBox } from '@fluentui/react-search-preview'
import * as strings from 'PortfolioWebPartsStrings'
import { ProjectInformationPanel } from 'pp365-projectwebparts/lib/components/ProjectInformationPanel'
import { ProjectListModel, SiteContext, customLightTheme } from 'pp365-shared-library'
import React, { FC, useMemo } from 'react'
import { find, isEmpty } from 'underscore'
import { List } from './List'
import { ListContext } from './List/context'
import { ProjectCard } from './ProjectCard'
import { ProjectCardContext } from './ProjectCard/context'
import styles from './ProjectList.module.scss'
import { ProjectListVerticals } from './ProjectListVerticals'
import { IProjectListProps } from './types'
import { useProjectList } from './useProjectList'
import { Toolbar, UserMessage } from 'pp365-shared-library'
import { FixedSizeList } from 'react-window'
import AutoSizer from 'react-virtualized-auto-sizer'

export const ProjectList: FC<IProjectListProps> = (props) => {
  const {
    state,
    setState,
    projects,
    verticals,
    onSearch,
    searchBoxPlaceholder,
    createCardContext,
    menuItems,
    fluentProviderId
  } = useProjectList(props)

  /**
   * Render projects based on `state.renderMode`.
   *
   * @param projects - Projects to render
   */
  const renderProjects = (projects: ProjectListModel[]) => {
    const projectRow: FC<{ index: number; style: React.CSSProperties; itemsPerRow: number }> = ({
      index,
      style,
      itemsPerRow
    }) => {
      const items = useMemo(() => {
        const convertedIndex = index * itemsPerRow
        const employeeItems = []

        employeeItems.push(
          ...projects
            .slice(convertedIndex, convertedIndex + itemsPerRow)
            .filter(Boolean)
            .map((project, idx) => (
              <ProjectCardContext.Provider key={idx} value={createCardContext(project)}>
                <ProjectCard />
              </ProjectCardContext.Provider>
            ))
        )
        return employeeItems
      }, [itemsPerRow])

      return (
        <div className={styles.projectRow} key={index} style={style}>
          {items}
        </div>
      )
    }

    switch (state.renderMode) {
      case 'tiles': {
        return (
          <AutoSizer disableHeight style={{ width: '100%' }}>
            {({ width }) => {
              const cardWidth = 242
              const itemsPerRow = Math.floor(width / cardWidth)
              const itemCount = Math.ceil(projects.length / itemsPerRow)
              const listHeight = Math.ceil(itemCount * 300)

              return (
                <FixedSizeList
                  className={styles.projectsSection}
                  style={{ gap: 12 }}
                  height={listHeight < 880 ? listHeight : 880}
                  itemCount={itemCount}
                  overscanCount={2}
                  itemSize={290}
                  width={width}
                >
                  {({ index, style }) => projectRow({ index, style, itemsPerRow })}
                </FixedSizeList>
              )
            }}
          </AutoSizer>
        )
      }
      case 'list':
      case 'compactList': {
        const size = state.renderMode === 'list' ? 'medium' : 'extra-small'
        return (
          <ListContext.Provider
            value={{
              ...props,
              projects,
              size
            }}
          >
            <List />
          </ListContext.Provider>
        )
      }
    }
  }

  if (state.projects.length === 0) {
    return (
      <FluentProvider theme={customLightTheme}>
        <section className={styles.root}>
          <UserMessage title={strings.NoProjectsFoundTitle} text={strings.NoProjectsFoundMessage} />
        </section>
      </FluentProvider>
    )
  }

  if (state.error) {
    return (
      <section className={styles.root}>
        <UserMessage title={strings.ErrorFetchingProjectsTitle} text={state.error} intent='error' />
      </section>
    )
  }

  return (
    <IdPrefixProvider value={fluentProviderId}>
      <FluentProvider className={styles.root} theme={customLightTheme}>
        <div className={styles.tabs}>
          <TabList
            onTabSelect={(_, data: SelectTabData) =>
              setState({ selectedVertical: find(verticals, (v) => v.key === data.value) })
            }
            selectedValue={state.selectedVertical.key}
          >
            {state.isDataLoaded &&
              verticals
                .filter((vertical) => !vertical.isHidden || !vertical.isHidden(state))
                .map((vertical) => {
                  const Icon = vertical.icon
                  return (
                    <Tab key={vertical.key} value={vertical.value} icon={<Icon />}>
                      {vertical.text}
                    </Tab>
                  )
                })}
          </TabList>
        </div>
        <div
          className={styles.commandBar}
          hidden={!props.showSearchBox && !props.showRenderModeSelector}
        >
          <div className={styles.search} hidden={!props.showSearchBox}>
            <SearchBox
              className={styles.searchBox}
              disabled={!state.isDataLoaded || isEmpty(state.projects)}
              value={state.searchTerm}
              placeholder={searchBoxPlaceholder}
              aria-label={searchBoxPlaceholder}
              title={searchBoxPlaceholder}
              size='large'
              onChange={onSearch}
              contentAfter={{
                onClick: () => setState({ searchTerm: '' })
              }}
              appearance='filled-lighter'
            />
          </div>
          <div hidden={!props.showRenderModeSelector && !props.showSortBy}>
            <Toolbar items={menuItems} />
          </div>
        </div>
        {state.isDataLoaded && isEmpty(projects) && (
          <div className={styles.emptyMessage}>
            <UserMessage
              title={strings.NoProjectsFoundTitle}
              text={strings.ProjectListEmptyMessage}
            />
          </div>
        )}
        <div className={styles.projects}>{renderProjects(projects)}</div>
        <ProjectInformationPanel
          {...SiteContext.create(
            props.spfxContext,
            state.showProjectInfo?.siteId,
            state.showProjectInfo?.url
          )}
          page='Portfolio'
          hidden={!state.showProjectInfo}
          hideAllActions={true}
          panelProps={{
            headerText: state.showProjectInfo?.title,
            onDismiss: () => {
              setState({ showProjectInfo: null })
            }
          }}
        />
      </FluentProvider>
    </IdPrefixProvider>
  )
}

ProjectList.defaultProps = {
  sortBy: 'Title',
  showSearchBox: true,
  showRenderModeSelector: true,
  showSortBy: true,
  defaultRenderMode: 'tiles',
  defaultVertical: 'my_projects',
  verticals: ProjectListVerticals,
  hideVerticals: [],
  useDynamicColors: true,
  showProjectLogo: true,
  projectMetadata: [
    'ProjectOwner',
    'ProjectManager',
    'ProjectServiceArea',
    'ProjectType',
    'ProjectPhase'
  ],
  quickLaunchMenu: [
    {
      order: 10,
      text: 'Prosjektstatus',
      relativeUrl: '/SitePages/Prosjektstatus.aspx'
    },
    {
      order: 20,
      text: 'Dokumentbibliotek',
      relativeUrl: '/Delte%20dokumenter'
    },
    {
      order: 30,
      text: 'Fasesjekkliste',
      relativeUrl: '/Lists/Fasesjekkliste'
    },
    {
      order: 40,
      text: 'Oppgaver',
      relativeUrl: '/SitePages/Oppgaver.aspx'
    }
  ]
}

export * from './types'
