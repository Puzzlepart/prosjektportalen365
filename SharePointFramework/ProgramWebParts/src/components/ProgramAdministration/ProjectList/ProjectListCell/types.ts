import { IListColumn } from 'pp365-shared-library'

/** Project row, column definition and optional title-link rendering for a grid cell. */
export interface IProjectListCellProps {
  /**
   * The project the row shows.
   */
  item: Record<string, any>

  /**
   * The column the cell is in.
   */
  column: IListColumn

  /**
   * Link the title to the project's site.
   */
  renderLinks?: boolean
}
