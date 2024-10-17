import React, { FC, useMemo } from 'react'
import AutoSizer from 'react-virtualized-auto-sizer'
import { FixedSizeList } from 'react-window'
import { List, ListContext } from './List'
import styles from './IdeaList.module.scss'
import { IIdeaModuleContext } from '../context'

export function useIdeaListRenderer({ props, state }: IIdeaModuleContext) {
  /**
   * Render ideas based on `state.renderMode`.
   *
   * @param ideas - ideas to render
   */
  const renderIdeas = (ideas: Record<string, any>) => {
    const projectRow: FC<{
      index: number
      style: React.CSSProperties
      itemsPerRow: number
    }> = ({ index, style, itemsPerRow }) => {
      const items = useMemo(() => {
        const convertedIndex = index * itemsPerRow
        const items = []

        items.push(
          ...ideas
            .slice(convertedIndex, convertedIndex + itemsPerRow)
            .filter(Boolean)
            .map((idea, idx) => (
              <>
                {idx}: {idea.title}
              </>
              // <ProjectCardContext.Provider key={idx} value={createCardContext(project)}>
              //   <ProjectCard />
              // </ProjectCardContext.Provider>
            ))
        )
        return items
      }, [itemsPerRow])

      return (
        <div className={styles.ideaRow} key={index} style={style}>
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
              const itemCount = Math.ceil(ideas.length / itemsPerRow)
              const listHeight = Math.ceil(itemCount * 300)

              return (
                <FixedSizeList
                  className={styles.ideasSection}
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
              ideas: state.ideas,
              listSize: size
            }}
          >
            <List />
          </ListContext.Provider>
        )
      }
    }
  }

  return renderIdeas
}
