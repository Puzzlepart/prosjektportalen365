import { Avatar, Link, TableCellLayout } from '@fluentui/react-components'
import { GlobeLocationFilled, TagMultipleFilled } from '@fluentui/react-icons'
import * as strings from 'PortfolioWebPartsStrings'
import { OverflowTagMenu, ProjectLogo } from 'pp365-shared-library'
import React, { useContext } from 'react'
import { ProjectMenu } from '../ProjectMenu'
import { ListContext } from './context'
import { IListColumn } from './types'
import { useListColumns } from './useListColumns'

export const useColumns = (): IListColumn[] => {
  const context = useContext(ListContext)

  const { getField, primaryUserRole, secondaryUserRole, primaryField, secondaryField } =
    useListColumns()

  return [
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
        return a.primaryUser?.name?.localeCompare(b.primaryUser?.name || '')
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
        return a.secondaryUser?.name?.localeCompare(b.secondaryUser?.name || '')
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
          <ProjectMenu
            project={item}
            context={context}
            size={context.size !== 'medium' ? 'small' : 'medium'}
          />
        )
      }
    }
  ]
}
