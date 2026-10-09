import { mergeClasses, SearchBox } from '@fluentui/react-components'
import { ListGrid } from 'pp365-portfoliowebparts/lib/components/List/ListGrid'
import { UserMessage } from 'pp365-shared-library'
import strings from 'ProgramWebPartsStrings'
import React, { FC } from 'react'
import { Commands } from '../Commands'
import styles from './ProjectList.module.scss'
import { ProjectListCell } from './ProjectListCell'
import { IProjectListProps } from './types'
import { useProjectList } from './useProjectList'

/**
 * The program's projects, or the projects that can be added to it, on the portfolio overview's
 * grid (`ListGrid`): a search box and the commands above, the rows sorted by a column, and a group
 * per hub when the projects come from more than one.
 */
export const ProjectList: FC<IProjectListProps> = (props) => {
  const {
    rows,
    groups,
    columns,
    selectionMode,
    selectedRows,
    showList,
    onSelectionChange,
    onColumnHeaderClick,
    onSearch,
    searchTerm
  } = useProjectList(props)

  return (
    <div className={styles.projectList}>
      <div className={styles.header}>
        <div className={styles.search}>
          <SearchBox
            {...props.search}
            className={styles.searchBox}
            appearance='filled-lighter'
            size='large'
            onChange={onSearch}
            contentAfter={{ onClick: () => onSearch(null, { value: '' }) }}
          />
        </div>
        <div className={styles.commands} hidden={props.hideCommands}>
          <Commands />
        </div>
      </div>
      {showList ? (
        <ListGrid
          className={mergeClasses(styles.grid, props.scrollRows && styles.scrollingGrid)}
          title={props.title}
          items={rows}
          groups={groups}
          columns={columns}
          justified
          collapseStateKey={searchTerm}
          selectionMode={selectionMode}
          selectedItems={selectedRows}
          onSelectionChange={onSelectionChange}
          onColumnHeaderClick={onColumnHeaderClick}
          renderCell={(item, _index, column) => (
            <ProjectListCell item={item} column={column} renderLinks={props.renderLinks} />
          )}
        />
      ) : (
        <UserMessage
          title={strings.ProgramAdministrationEmptyTitle}
          text={strings.ProgramAdministrationEmptyMessage}
        />
      )}
    </div>
  )
}
