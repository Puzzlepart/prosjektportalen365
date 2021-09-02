import { ProjectColumn } from 'pp365-shared/lib/models/ProjectColumn'

export interface IRenderItemColumnProps extends React.HTMLAttributes<HTMLDivElement> {
  column?: ProjectColumn
  columnValue: string
  valueSeparator?: string
}
