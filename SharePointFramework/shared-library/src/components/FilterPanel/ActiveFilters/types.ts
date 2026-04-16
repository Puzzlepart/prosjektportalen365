import { IFilterProps } from '../Filter/types'

export interface IActiveFilterEntry {
  fieldName: string
  columnName: string
  values: string[]
}

export interface IActiveFiltersProps {
  filters: IFilterProps[]
  onRemoveFilter?: (fieldName: string, value: string) => void
  onClearAll?: () => void
  compact?: boolean
}
