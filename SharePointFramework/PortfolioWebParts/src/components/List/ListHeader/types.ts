import { IDetailsHeaderProps, IRenderFunction } from '@fluentui/react'
import { IListProps } from '../types'

export interface IListHeaderProps extends Pick<IListProps, 'title' | 'searchBox'> {
  headerProps?: IDetailsHeaderProps
  defaultRender?: IRenderFunction<IDetailsHeaderProps>
}