import { IDetailsHeaderProps, IRenderFunction } from '@fluentui/react'
import { IListProps } from '../types'

export interface IListHeaderProps extends IListProps {
  headerProps?: IDetailsHeaderProps
  defaultRender?: IRenderFunction<IDetailsHeaderProps>
}
