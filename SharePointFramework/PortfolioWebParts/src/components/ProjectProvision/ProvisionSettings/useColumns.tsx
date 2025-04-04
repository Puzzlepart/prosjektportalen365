/* eslint-disable no-console */
import {
  Button,
  createTableColumn,
  TableCellLayout,
  TableColumnDefinition,
  Text
} from '@fluentui/react-components'
import strings from 'PortfolioWebPartsStrings'
import { getFluentIcon } from 'pp365-shared-library'
import React from 'react'
import styles from './ProvisionSettings.module.scss'
import { IRequestSettingsItem } from './types'

export const useColumns = (toast: any): TableColumnDefinition<IRequestSettingsItem>[] => {
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
        return strings.Provision.SettingLabel
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
        return strings.Provision.DescriptionLabel
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
        return strings.Provision.ValueLabel
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
      renderCell: () => {
        return (
          <div className={styles.actions}>
            <Button
              appearance='subtle'
              disabled
              title={strings.Provision.EditLabel}
              icon={getFluentIcon('Edit')}
            />
          </div>
        )
      }
    })
  ]
}
