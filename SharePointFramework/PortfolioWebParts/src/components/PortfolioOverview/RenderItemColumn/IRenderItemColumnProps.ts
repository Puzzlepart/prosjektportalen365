import { ProjectColumn } from 'pp365-shared/lib/models/ProjectColumn'

export interface IRenderItemColumnProps {
  column?: ProjectColumn
  columnValue: string
  valueSeparator?: string
}
