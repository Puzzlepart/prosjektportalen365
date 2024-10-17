import { Avatar, Link, TableCellLayout } from '@fluentui/react-components'
import * as strings from 'PortfolioWebPartsStrings'
import { ProjectLogo } from 'pp365-shared-library'
import React, { useContext } from 'react'
import { ProjectMenu } from '../ProjectMenu'
import { ListContext } from './context'
import { IListColumn } from './types'

export const useColumns = (): IListColumn[] => {
  const context = useContext(ListContext)
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
      defaultWidth: 120,
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
      columnId: 'owner',
      defaultWidth: 180,
      compare: (a, b) => {
        return a.owner?.name?.localeCompare(b.owner?.name || '')
      },
      renderHeaderCell: () => {
        return strings.ProjectOwner
      },
      renderCell: (item) => {
        return (
          <TableCellLayout
            truncate
            title={`${strings.ProjectOwner}: ${item.owner?.name ?? strings.NotSet}`}
          >
            <Avatar size={context.size !== 'medium' ? 24 : 32} {...item.owner} /> {item.owner?.name}
          </TableCellLayout>
        )
      }
    },
    {
      columnId: 'manager',
      defaultWidth: 180,
      compare: (a, b) => {
        return a.manager?.name?.localeCompare(b.manager?.name || '')
      },
      renderHeaderCell: () => {
        return strings.ProjectManager
      },
      renderCell: (item) => {
        return (
          <TableCellLayout
            truncate
            title={`${strings.ProjectManager}: ${item.manager?.name ?? strings.NotSet}`}
          >
            <Avatar size={context.size !== 'medium' ? 24 : 32} {...item.manager} />{' '}
            {item.manager?.name}
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
