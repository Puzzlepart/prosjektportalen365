import {
  IDetailsHeaderProps,
  ISearchBoxProps,
  SelectAllVisibility
} from '@fluentui/react'

export interface IListHeaderSearchProps {
  search?: ISearchBoxProps
  selectedCount?: number
  detailsHeaderProps: IDetailsHeaderProps
  defaultRender: (props?: IDetailsHeaderProps) => JSX.Element
  selectAllVisibility?: SelectAllVisibility
}
