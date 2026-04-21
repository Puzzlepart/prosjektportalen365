import {
  TableCellLayout,
  TableColumnDefinition,
  Text,
  Tooltip,
  createTableColumn
} from '@fluentui/react-components'
import { LockClosedRegular } from '@fluentui/react-icons'
import strings from 'ProjectExtensionsStrings'
import { ContentConfig } from 'pp365-shared-library'
import React from 'react'

/**
 * Columns hook for `ContentConfigSection`
 */
export function useColumns(mandatoryKeys: Set<string>): TableColumnDefinition<ContentConfig>[] {
  return [
    createTableColumn<ContentConfig>({
      columnId: 'text',
      compare: (a, b) => a.text.localeCompare(b.text),
      renderHeaderCell: () => strings.TitleLabel,
      renderCell: (item) => {
        const isMandatory = mandatoryKeys.has(String(item.key))
        return (
          <TableCellLayout>
            <Text wrap>
              {item.text}
              {isMandatory && (
                <Tooltip content={strings.ContentConfigLockedTooltipText} relationship='label'>
                  <span style={{ marginLeft: 6, display: 'inline-flex' }}>
                    <LockClosedRegular fontSize={12} />
                  </span>
                </Tooltip>
              )}
            </Text>
          </TableCellLayout>
        )
      }
    }),
    createTableColumn<ContentConfig>({
      columnId: 'subText',
      compare: (a, b) => (a.subText || '').localeCompare(b.subText || ''),
      renderHeaderCell: () => strings.DescriptionLabel,
      renderCell: (item) => (
        <TableCellLayout>
          <Text wrap size={200}>
            {item.subText}
          </Text>
        </TableCellLayout>
      )
    })
  ]
}
