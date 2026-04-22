import { Shimmer, ShimmerElementType } from '@fluentui/react'
import { ProjectListModel } from 'pp365-shared-library'
import React, { FC, useMemo } from 'react'
import AutoSizer from 'react-virtualized-auto-sizer'
import { FixedSizeList } from 'react-window'
import { List, ListContext } from './List'
import { ProjectCard, ProjectCardContext } from './ProjectCard'
import styles from './ProjectList.module.scss'
import { IProjectListContext } from './context'

const SKELETON_CARD_COUNT = 12

export function useProjectListRenderer({ props, state, createCardContext }: IProjectListContext) {
  /**
   * Render projects based on `state.renderMode`.
   *
   * @param projects - Projects to render
   */
  const renderProjects = (projects: ProjectListModel[]) => {
    const projectRow: FC<{
      index: number
      style: React.CSSProperties
      itemsPerRow: number
    }> = ({ index, style, itemsPerRow }) => {
      const items = useMemo(() => {
        const convertedIndex = index * itemsPerRow
        const items = []

        items.push(
          ...projects
            .slice(convertedIndex, convertedIndex + itemsPerRow)
            .filter(Boolean)
            .map((project, idx) => (
              <ProjectCardContext.Provider key={idx} value={createCardContext(project)}>
                <ProjectCard />
              </ProjectCardContext.Provider>
            ))
        )
        return items
      }, [itemsPerRow])

      return (
        <div className={styles.projectRow} key={index} style={style}>
          {items}
        </div>
      )
    }

    const skeletonRow: FC<{
      index: number
      style: React.CSSProperties
      itemsPerRow: number
    }> = ({ index, style, itemsPerRow }) => {
      const convertedIndex = index * itemsPerRow
      const remaining = Math.max(0, SKELETON_CARD_COUNT - convertedIndex)
      const count = Math.min(itemsPerRow, remaining)
      const items = Array.from({ length: count }).map((_, idx) => (
        <ProjectCardContext.Provider
          key={`skeleton-${convertedIndex + idx}`}
          value={createCardContext(undefined)}
        >
          <ProjectCard />
        </ProjectCardContext.Provider>
      ))
      return (
        <div className={styles.projectRow} key={`skeleton-row-${index}`} style={style}>
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
              const itemsPerRow = Math.max(1, Math.floor(width / cardWidth))
              const isLoading = !state.isDataLoaded
              const displayCount = isLoading ? SKELETON_CARD_COUNT : projects.length
              const itemCount = Math.ceil(displayCount / itemsPerRow)
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
                  {({ index, style }) =>
                    isLoading
                      ? skeletonRow({ index, style, itemsPerRow })
                      : projectRow({ index, style, itemsPerRow })
                  }
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
            <div
              className={styles.listSkeleton}
              role='presentation'
              aria-busy='true'
            >
              {Array.from({ length: 8 }).map((_, i) => (
                <Shimmer
                  key={`list-skeleton-${i}`}
                  shimmerElements={[
                    { type: ShimmerElementType.line, width: '100%', height: rowHeight }
                  ]}
                />
              ))}
            </div>
          )
        }
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

  return renderProjects
}
