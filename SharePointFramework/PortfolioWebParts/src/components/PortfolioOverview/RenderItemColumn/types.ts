import { IColumn } from '@fluentui/react'
import { ProjectColumn } from 'pp365-shared-library/lib/models/ProjectColumn'

export interface IRenderItemColumnProps
  extends React.HTMLAttributes<HTMLDivElement> {
  column?: ProjectColumn | IColumn
  columnValue: string
  valueSeparator?: string
}
