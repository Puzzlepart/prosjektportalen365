import strings from 'ProgramWebPartsStrings'
import { IListColumn } from 'pp365-shared-library'
import resource from 'SharedResources'
import { IProjectListSort } from './projectRows'

/**
 * The project lists' columns: the title (with the project's logo), the phase and the date the
 * project's site was created, named as the portfolio's site columns are. Their widths are shares
 * of the list's width (`justified`).
 */
const COLUMNS: IListColumn[] = [
  {
    key: 'Title',
    fieldName: 'Title',
    name: strings.TitleLabel,
    minWidth: 220,
    maxWidth: 440,
    isResizable: true
  },
  {
    key: 'Phase',
    fieldName: 'Phase',
    name: resource.SiteFields_GtProjectPhase_DisplayName,
    minWidth: 100,
    maxWidth: 180,
    isResizable: true
  },
  {
    key: 'Created',
    fieldName: 'Created',
    name: resource.SiteFields_Created_DisplayName,
    minWidth: 140,
    maxWidth: 220,
    isResizable: true
  }
]

/**
 * The columns, the one the rows are sorted by marked with its direction.
 *
 * @param sort The column the rows are sorted by
 */
export function createColumns(sort: IProjectListSort): IListColumn[] {
  return COLUMNS.map((column) => {
    const isSorted = column.fieldName === sort.fieldName
    return { ...column, isSorted, isSortedDescending: isSorted && !sort.ascending }
  })
}
