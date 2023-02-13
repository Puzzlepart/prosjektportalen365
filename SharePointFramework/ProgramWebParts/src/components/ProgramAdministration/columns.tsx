import { IColumn, Link } from '@fluentui/react'
import { Icon } from 'office-ui-fabric-react'
import React from 'react'

/**
 * Returns an array of columns for the ShimmeredDetailsList. If SPPWebURL is not set, the project 
 * is not accessible by the user, but the user can still add it to the program. If renderAsLink is
 * set to true, the project title will be rendered as a link to the project.
 */
export function columns({ renderAsLink = false }) {
  return [
    {
      key: 'Title',
      fieldName: 'Title',
      name: 'Tittel',
      onRender: (item) => {
        if (!item.SPWebURL) {
          return (
            <div style={{ opacity: 0.3 }} title='Du har ikke tilgang til dette prosjektet, men du kan alikevel legge det til i programmet.'>
              <span>{item.Title}</span>
              <Icon style={{ marginLeft: 6 }} iconName='Hide' />
            </div>
          )
        }
        if (renderAsLink) {
          return (
            <Link href={item.SPWebURL} target='_blank' rel='noreferrer'>
              {item.Title}
            </Link>
          )
        }
        else return item.Title
      },
      minWidth: 100
    }
  ] as IColumn[]
}
