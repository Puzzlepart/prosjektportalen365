import {
  Badge,
  TableCellLayout,
  Text,
  Tooltip,
  createTableColumn
} from '@fluentui/react-components'
import { LockClosedRegular } from '@fluentui/react-icons'
import strings from 'ProjectExtensionsStrings'
import { ContentConfig, IDataGridColumn } from 'pp365-shared-library'
import React from 'react'

/**
 * Columns hook for `ContentConfigSection`: the title, with a lock on what cannot be left out and a
 * mark on what the project has already, and the description.
 *
 * @param mandatoryKeys The keys of the items that cannot be left out
 * @param addedKeys The keys of the items the project has from an earlier run of the setup
 */
export function useColumns(
  mandatoryKeys: Set<string>,
  addedKeys: Set<string> = new Set()
): IDataGridColumn<ContentConfig>[] {
  return [
    {
      ...createTableColumn<ContentConfig>({
        columnId: 'text',
        compare: (a, b) => a.text.localeCompare(b.text),
        renderHeaderCell: () => strings.TitleLabel,
        renderCell: (item) => {
          const isMandatory = mandatoryKeys.has(String(item.key))
          const isAdded = addedKeys.has(String(item.key))
          return (
            <TableCellLayout>
              <Text wrap>
                {item.text}
                {isMandatory && (
                  <Tooltip content={strings.ContentConfigLockedTooltipText} relationship='label'>
                    <span role='img' style={{ marginLeft: 6, display: 'inline-flex' }}>
                      <LockClosedRegular fontSize={12} />
                    </span>
                  </Tooltip>
                )}
                {isAdded && (
                  <Badge
                    appearance='tint'
                    color='informative'
                    size='small'
                    style={{ marginLeft: 6 }}
                  >
                    {strings.ContentConfigAddedText}
                  </Badge>
                )}
              </Text>
            </TableCellLayout>
          )
        }
      }),
      minWidth: 150,
      defaultWidth: 200
    },
    {
      ...createTableColumn<ContentConfig>({
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
      }),
      minWidth: 250,
      defaultWidth: 400
    }
  ]
}
