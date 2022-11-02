import { useContext } from 'react'
import { SectionContext } from '../Sections/context'
import styles from './StatusElement.module.scss'
import { IStatusElementProps } from './types'

export function useStatusElement(props: IStatusElementProps) {
  const { headerProps } = useContext(SectionContext)
  let comment = headerProps.comment?.replace(/\n/g, '<br />')
  if (props.truncateComment) {
    comment =
      comment.length > props.truncateComment
        ? comment.slice(0, props.truncateComment) + '...'
        : comment
  }
  const commentProps = {
    className: styles.comment,
    dangerouslySetInnerHTML: {
      __html: comment
    }
  }
  return { commentProps } as const
}
