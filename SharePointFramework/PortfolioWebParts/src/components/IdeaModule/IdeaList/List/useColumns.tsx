import { Avatar, Link, TableCellLayout } from '@fluentui/react-components'
import * as strings from 'PortfolioWebPartsStrings'
import { ProjectLogo } from 'pp365-shared-library'
import React from 'react'
import { IListColumn } from './types'
import { useIdeaModuleContext } from 'components/IdeaModule/context'

export const useColumns = (): IListColumn[] => {
  const context = useIdeaModuleContext()

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
            size={context.props.listSize !== 'medium' ? '32px' : '48px'}
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
            <Avatar size={context.props.listSize !== 'medium' ? 24 : 32} {...item.owner} />{' '}
            {item.owner?.name}
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
            <Avatar size={context.props.listSize !== 'medium' ? 24 : 32} {...item.manager} />{' '}
            {item.manager?.name}
          </TableCellLayout>
        )
      }
    }
  ]
}
