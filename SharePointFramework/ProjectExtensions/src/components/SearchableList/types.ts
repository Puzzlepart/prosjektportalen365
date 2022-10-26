import { IDetailsListProps, ISearchBoxProps } from '@fluentui/react'

export interface ISearchableListProps extends Pick<IDetailsListProps, 'columns' | 'items'> {
  selectedKeys?: any
  onSelectionChanged(selectedItems: any[]): void
  searchBox?: ISearchBoxProps
}
