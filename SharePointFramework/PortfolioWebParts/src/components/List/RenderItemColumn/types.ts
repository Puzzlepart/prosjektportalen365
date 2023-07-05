import { IColumn } from '@fluentui/react'

export interface IRenderItemColumnProps extends React.HTMLAttributes<HTMLDivElement> {
  column?: IColumn
  item?: Record<string, any>
  columnValue: string
  dataTypeProperties?: Map<string, any>
}

export type ItemRenderFunction = (props: IRenderItemColumnProps) => JSX.Element
