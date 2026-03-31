import {
  TableCellLayout,
  TableColumnDefinition,
  Text,
  Tooltip,
  createTableColumn
} from '@fluentui/react-components'
import { LockClosedRegular } from '@fluentui/react-icons'
import strings from 'ProjectExtensionsStrings'
import { ProjectExtension } from 'pp365-shared-library'
import React from 'react'

/**
 * Columns hook for `ExtensionsSection`
 */
export function useColumns(mandatoryKeys: Set<string>): TableColumnDefinition<ProjectExtension>[] {
  return [
    createTableColumn<ProjectExtension>({
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
                <Tooltip content={strings.ExtensionLockedTooltipText} relationship='label'>
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
    createTableColumn<ProjectExtension>({
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
