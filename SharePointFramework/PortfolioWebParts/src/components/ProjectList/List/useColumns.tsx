import { Avatar, Link, TableCellLayout } from '@fluentui/react-components'
import { GlobeLocationFilled, TagMultipleFilled } from '@fluentui/react-icons'
import * as strings from 'PortfolioWebPartsStrings'
import { OverflowTagMenu, ProjectLogo } from 'pp365-shared-library'
import React, { useContext } from 'react'
import _ from 'underscore'
import { ProjectMenu } from '../ProjectMenu'
import { ListContext } from './context'
import { IListColumn } from './types'

export const useColumns = (): IListColumn[] => {
  const context = useContext(ListContext)

  const getField = (item: any, field: string) => {
    if (!field || !item?.data) return []
    const fieldValue = item.data[field]
    let values: string[] = []
    if (typeof fieldValue === 'string') {
      values = fieldValue.split(';')
    } else {
      values = []
    }

    if (!values.length || (values.length === 1 && values[0] === '')) {
      const textValue = item.data[`${field}Text`]
      values = textValue ? textValue.split(';') : []
    }

    return values.length ? values : []
  }

  const findColumn = (field?: string) =>
    _.find(
      context.projectColumns,
      (col) => col.internalName === field || col.fieldName === field
    )

  const primaryUserRole =
    findColumn(context.primaryUserField)?.name || strings.PrimaryUserFieldLabel

  const secondaryUserRole =
    findColumn(context.secondaryUserField)?.name || strings.SecondaryUserFieldLabel

  const primaryField = findColumn(context.primaryField)?.name || strings.PrimaryFieldLabel

  const secondaryField = findColumn(context.secondaryField)?.name || strings.SecondaryFieldLabel

  const shouldDisplay = context.shouldDisplay ?? (() => true)

  const allColumns: IListColumn[] = [
    {
      columnId: 'logo',
      defaultWidth: 48,
      minWidth: 48,
      compare: () => null,
      renderHeaderCell: () => null,
      renderCell: (item) => {
        return (
          <ProjectLogo
            title={item.title}
            url={item.url}
            renderMode='list'
            size={context.size !== 'medium' ? '32px' : '48px'}
            fallbackImageUrl={item.templateImageUrl}
          />
        )
      }
    },
    {
      columnId: 'title',
      defaultWidth: 280,
      compare: (a, b) => {
        return (a.title ?? '').localeCompare(b.title ?? '')
      },
      renderHeaderCell: () => {
        return strings.TitleLabel
      },
      renderCell: (item) => {
        return (
          <TableCellLayout truncate title={item.title}>
            {item.hasUserAccess ? (
              <Link href={item.url} target='_blank' title={item.title}>
                {item.title}
              </Link>
            ) : (
              <>{item.title}</>
            )}
          </TableCellLayout>
        )
      }
    },
    {
      columnId: 'phase',
      defaultWidth: 100,
      compare: (a, b) => {
        return (a.phase || '').localeCompare(b.phase || '')
      },
      renderHeaderCell: () => {
        return strings.PhaseLabel
      },
      renderCell: (item) => {
        return (
          <TableCellLayout truncate title={item.phase}>
            {item.phase || ''}
          </TableCellLayout>
        )
      }
    },
    {
      columnId: 'primaryField',
      defaultWidth: 180,
      compare: () => {
        return -1
      },
      renderHeaderCell: () => {
        return primaryField
      },
      renderCell: (item) => {
        const tags = getField(item, context.primaryField)
        return (
          <TableCellLayout truncate>
            <OverflowTagMenu
              text={primaryField}
              tags={tags}
              icon={GlobeLocationFilled}
              hidden={!tags.length}
              isTagPreview={true}
            />
          </TableCellLayout>
        )
      }
    },
    {
      columnId: 'secondaryField',
      defaultWidth: 180,
      compare: () => {
        return -1
      },
      renderHeaderCell: () => {
        return secondaryField
      },
      renderCell: (item) => {
        const tags = getField(item, context.secondaryField)
        return (
          <TableCellLayout truncate>
            <OverflowTagMenu
              text={secondaryField}
              tags={tags}
              icon={TagMultipleFilled}
              hidden={!tags.length}
              isTagPreview={true}
            />
          </TableCellLayout>
        )
      }
    },
    {
      columnId: 'primaryUserRole',
      defaultWidth: 180,
      compare: (a, b) => {
        return (a.primaryUser?.name ?? '').localeCompare(b.primaryUser?.name ?? '')
      },
      renderHeaderCell: () => {
        return primaryUserRole
      },
      renderCell: (item) => {
        return (
          <TableCellLayout
            truncate
            title={`${primaryUserRole}: ${item.primaryUser?.name ?? strings.NotSet}`}
          >
            <Avatar size={context.size !== 'medium' ? 24 : 32} {...item.primaryUser} />{' '}
            {item.primaryUser?.name}
          </TableCellLayout>
        )
      }
    },
    {
      columnId: 'secondaryUserRole',
      defaultWidth: 180,
      compare: (a, b) => {
        return (a.secondaryUser?.name ?? '').localeCompare(b.secondaryUser?.name ?? '')
      },
      renderHeaderCell: () => {
        return secondaryUserRole
      },
      renderCell: (item) => {
        return (
          <TableCellLayout
            truncate
            title={`${secondaryUserRole}: ${item.secondaryUser?.name ?? strings.NotSet}`}
          >
            <Avatar size={context.size !== 'medium' ? 24 : 32} {...item.secondaryUser} />{' '}
            {item.secondaryUser?.name}
          </TableCellLayout>
        )
      }
    },
    {
      columnId: 'actions',
      defaultWidth: 40,
      minWidth: 40,
      compare: () => {
        return -1
      },
      renderHeaderCell: () => {
        return null
      },
      renderCell: (item) => {
        return (
          <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
            <ProjectMenu
              project={item}
              context={context}
              size={context.size !== 'medium' ? 'small' : 'medium'}
            />
          </div>
        )
      }
    }
  ]

  const metadataKeyByColumnId: Record<string, string> = {
    phase: 'ProjectPhase',
    primaryField: 'PrimaryField',
    secondaryField: 'SecondaryField',
    primaryUserRole: 'PrimaryUserField',
    secondaryUserRole: 'SecondaryUserField'
  }

  return allColumns.filter((col) => {
    const metadataKey = metadataKeyByColumnId[col.columnId as string]
    return metadataKey ? shouldDisplay(metadataKey) : true
  })
}
