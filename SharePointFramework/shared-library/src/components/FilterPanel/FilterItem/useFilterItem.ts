import strings from 'SharedLibraryStrings'
import _ from 'lodash'
import { IFilterItemProps } from './types'

export function useFilterItem(props: IFilterItemProps) {
  switch (props.column.data?.renderAs) {
    case 'boolean': {
      const valueIfTrue = _.get(
        props,
        'column.data.dataTypeProperties.valueIfTrue',
        strings.BooleanYes
      )
      const valueIfFalse = _.get(
        props,
        'column.data.dataTypeProperties.valueIfFalse',
        strings.BooleanNo
      )
      return { label: parseInt(props.value) === 1 ? valueIfTrue : valueIfFalse }
    }
    default: {
      return { label: props.name }
    }
  }
}
