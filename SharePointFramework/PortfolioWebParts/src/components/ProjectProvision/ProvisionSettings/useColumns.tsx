/* eslint-disable no-console */
import {
  Button,
  TableCellLayout,
  TableColumnDefinition,
  createTableColumn,
  Text
} from '@fluentui/react-components'
import React, { useContext } from 'react'
import styles from './ProvisionSettings.module.scss'
import { ProjectProvisionContext } from '../context'
import { getFluentIcon } from 'pp365-shared-library'
import { IRequestSettingsItem } from './types'

export const useColumns = (toast: any): TableColumnDefinition<IRequestSettingsItem>[] => {
  const context = useContext(ProjectProvisionContext)

  return [
    createTableColumn<IRequestSettingsItem>({
      columnId: 'title',
      compare: (a, b) => {
        if (a.title) {
          return a.title.localeCompare(b.title)
        }
        return null
      },
      renderHeaderCell: () => {
        return 'Innstilling'
      },
      renderCell: (setting) => {
        return (
          <TableCellLayout style={{ overflow: 'hidden' }}>
            <Text truncate wrap={true}>
              {setting.title}
            </Text>
          </TableCellLayout>
        )
      }
    }),
    createTableColumn<IRequestSettingsItem>({
      columnId: 'description',
      compare: (a, b) => {
        if (a.description) {
          return a.description.localeCompare(b.description)
        }
        return null
      },
      renderHeaderCell: () => {
        return 'Beskrivelse'
      },
      renderCell: (setting) => {
        return (
          <TableCellLayout style={{ overflow: 'hidden' }}>
            <Text truncate wrap={true}>
              {setting.description}
            </Text>
          </TableCellLayout>
        )
      }
    }),
    createTableColumn<IRequestSettingsItem>({
      columnId: 'value',
      compare: (a, b) => {
        if (a.value) {
          return a.value.localeCompare(b.value)
        }
        return null
      },
      renderHeaderCell: () => {
        return 'Verdi'
      },
      renderCell: (setting) => {
        if (
          setting.title !== 'NamingConvention' &&
          setting.title !== 'DefaultExternalSharingSetting'
        )
          return (
            <TableCellLayout style={{ overflow: 'hidden' }}>
              <Text truncate wrap={true}>
                {setting.value}
              </Text>
            </TableCellLayout>
          )
      }
    }),
    createTableColumn<IRequestSettingsItem>({
      columnId: 'actions',
      renderHeaderCell: () => null,
      renderCell: (setting) => {
        return (
          <div className={styles.actions}>
            <Button
              appearance='subtle'
              onClick={() => console.log(`edit request ${setting.title}`)}
              title='Rediger'
              icon={getFluentIcon('Edit')}
            />
          </div>
        )
      }
    })
  ]
}
