import { IDetailsHeaderProps, IRenderFunction } from '@fluentui/react'

export interface IListHeaderProps {
  headerProps: IDetailsHeaderProps
  defaultRender?: IRenderFunction<IDetailsHeaderProps>
}
