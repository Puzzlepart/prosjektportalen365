import { IColumn, Link } from '@fluentui/react'
import React from 'react'

export function columns({ renderAsLink = false }): IColumn[] {
  return [
    {
      key: 'Title',
      fieldName: 'Title',
      name: 'Tittel',
      onRender: (item) =>
        renderAsLink ? (
          <Link href={item.SPWebURL} target='_blank' rel='noreferrer'>
            {item.Title}
          </Link>
        ) : (
          item.Title
        ),
      minWidth: 100
    }
  ]
}
