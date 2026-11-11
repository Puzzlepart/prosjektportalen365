import { WebPartTitle } from 'pp365-shared-library'
import React, { FC } from 'react'
import { useHeader } from './useHeader'

/**
 * The status report's title. On the status page it is the web part's `h2`; where the report is a
 * section of another web part, as in the project information, it is given level 3.
 */
export const Header: FC<{ headingLevel?: 2 | 3 }> = ({ headingLevel }) => {
  const { title, description } = useHeader()
  return <WebPartTitle title={title} description={description} headingLevel={headingLevel} />
}
