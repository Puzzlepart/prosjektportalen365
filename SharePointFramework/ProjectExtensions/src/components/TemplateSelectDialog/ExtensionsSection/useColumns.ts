import { IColumn } from '@fluentui/react'
import strings from 'ProjectExtensionsStrings'

/**
 * Columns hook for `ExtensionsSection`
 */
export function useColumns(): IColumn[] {
  return [
    {
      key: 'text',
      fieldName: 'text',
      name: strings.TitleLabel,
      minWidth: 150,
      maxWidth: 180
    },
    {
      key: 'subText',
      fieldName: 'subText',
      name: strings.DescriptionLabel,
      minWidth: 250
    }
  ]
}
