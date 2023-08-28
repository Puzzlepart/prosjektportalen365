import { Avatar, TableCellLayout, TableColumnDefinition } from '@fluentui/react-components'
import * as strings from 'PortfolioWebPartsStrings'
import { ProjectListModel, ProjectLogo } from 'pp365-shared-library'
import React, { useContext } from 'react'
import { ProjectMenu } from '../ProjectMenu'
import { ListContext } from './context'

export const useColumns = (): TableColumnDefinition<ProjectListModel>[] => {
  const context = useContext(ListContext)
  return [
    {
      columnId: 'logo',
      compare: () => {
        return null
      },
      renderHeaderCell: () => {
        return null
      },
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
      columnId: 'owner',
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
            title={`${strings.ProjectOwner}: ${item.owner.name ?? strings.NotSet}`}
          >
            <Avatar
              size={context.size !== 'medium' ? 24 : 32}
              {...item.owner}
            />{' '}
            {item.owner?.name}
          </TableCellLayout>
        )
      }
    },
    {
      columnId: 'manager',
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
            title={`${strings.ProjectManager}: ${item.manager.name ?? strings.NotSet}`}
          >
            <Avatar
              size={context.size !== 'medium' ? 24 : 32}
              {...item.manager}
            />{' '}
            {item.manager?.name}
          </TableCellLayout>
        )
      }
    },
    {
      columnId: 'title',
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
              <a href={item.url} target='_blank' rel='noreferrer'>
                {item.title}
              </a>
            ) : (
              <>{item.title}</>
            )}
          </TableCellLayout>
        )
      }
    },
    {
      columnId: 'actions',
      compare: () => {
        return
      },
      renderHeaderCell: () => {
        return ''
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
