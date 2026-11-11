import { Skeleton, SkeletonItem } from '@fluentui/react-components'
import { ProjectListModel } from 'pp365-shared-library'
import React, { FC } from 'react'
import AutoSizer from 'react-virtualized-auto-sizer'
import { FixedSizeList, ListChildComponentProps } from 'react-window'
import { List, ListContext } from './List'
import { ProjectCard, ProjectCardContext } from './ProjectCard'
import styles from './ProjectList.module.scss'
import { IProjectListContext } from './context'

const SKELETON_CARD_COUNT = 12

/** What a row of cards gets: the projects shown, how many fit a row, and how a card's context is made. */
interface IProjectRowData {
  projects: ProjectListModel[]
  itemsPerRow: number
  isLoading: boolean
  createCardContext: IProjectListContext['createCardContext']
}

/**
 * A row of project cards, or of their skeletons while the projects load. A component of its own,
 * given to `FixedSizeList` once: an inline function there was a new component on every render of
 * the list, so every row and card was made anew, and the card button that opened the project
 * information was gone when it closed, leaving the focus nowhere to return to (WCAG 2.4.3).
 */
const ProjectRow: FC<ListChildComponentProps<IProjectRowData>> = ({ index, style, data }) => {
  const { projects, itemsPerRow, isLoading, createCardContext } = data
  const first = index * itemsPerRow
  if (isLoading) {
    const count = Math.min(itemsPerRow, Math.max(0, SKELETON_CARD_COUNT - first))
    return (
      <div className={styles.projectRow} style={style}>
        {Array.from({ length: count }).map((_, idx) => (
          <ProjectCardContext.Provider
            key={`skeleton-${first + idx}`}
            value={createCardContext(undefined)}
          >
            <ProjectCard />
          </ProjectCardContext.Provider>
        ))}
      </div>
    )
  }
  return (
    <div className={styles.projectRow} style={style}>
      {projects
        .slice(first, first + itemsPerRow)
        .filter(Boolean)
        .map((project, idx) => (
          <ProjectCardContext.Provider
            key={project.siteId ?? project.url ?? first + idx}
            value={createCardContext(project)}
          >
            <ProjectCard />
          </ProjectCardContext.Provider>
        ))}
    </div>
  )
}

export function useProjectListRenderer({
  props,
  state,
  createCardContext,
  shouldDisplay
}: IProjectListContext) {
  /**
   * Render projects based on `state.renderMode`.
   *
   * @param projects - Projects to render
   */
  const renderProjects = (projects: ProjectListModel[]) => {
    switch (state.renderMode) {
      case 'tiles': {
        return (
          <AutoSizer disableHeight style={{ width: '100%' }}>
            {({ width }) => {
              const cardWidth = 242
              const itemsPerRow = Math.max(1, Math.floor(width / cardWidth))
              const isLoading = !state.isDataLoaded
              const displayCount = isLoading ? SKELETON_CARD_COUNT : projects.length
              const itemCount = Math.ceil(displayCount / itemsPerRow)
              const listHeight = Math.ceil(itemCount * 300)

              return (
                <FixedSizeList<IProjectRowData>
                  className={styles.projectsSection}
                  style={{ gap: 12 }}
                  height={listHeight < 880 ? listHeight : 880}
                  itemCount={itemCount}
                  overscanCount={2}
                  itemSize={290}
                  width={width}
                  itemData={{ projects, itemsPerRow, isLoading, createCardContext }}
                >
                  {ProjectRow}
                </FixedSizeList>
              )
            }}
          </AutoSizer>
        )
      }
      case 'list':
      case 'compactList': {
        const size = state.renderMode === 'list' ? 'medium' : 'extra-small'
        const rowHeight = size === 'medium' ? 44 : 32
        if (!state.isDataLoaded) {
          return (
            <div className={styles.listSkeleton} role='presentation' aria-busy='true'>
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={`list-skeleton-${i}`}>
                  <SkeletonItem style={{ width: '100%', height: rowHeight }} />
                </Skeleton>
              ))}
            </div>
          )
        }
        return (
          <ListContext.Provider
            value={{
              ...props,
              projects,
              size,
              shouldDisplay
            }}
          >
            <List />
          </ListContext.Provider>
        )
      }
    }
  }

  return renderProjects
}
