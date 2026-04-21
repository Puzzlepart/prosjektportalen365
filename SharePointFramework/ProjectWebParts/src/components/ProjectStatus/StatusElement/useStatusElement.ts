import { useContext } from 'react'
import { SectionContext } from '../Sections/context'
import styles from './StatusElement.module.scss'
import { IStatusElementProps } from './types'
import { useId } from '@fluentui/react-components'

/**
 * Component logic hook for `StatusElement`. Handles truncating of the comment
 * and the icon size.
 */
export function useStatusElement(props: IStatusElementProps) {
  const { headerProps } = useContext(SectionContext)
  let comment = headerProps.comment?.replace(/\n/g, '<br />')

  if (comment && props.truncateComment) {
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

  const useWrapper = !!props.truncateComment || props.iconsOnly

  const fluentProviderId = useId('fp-status-element')

  return { commentProps, iconSize: props.iconSize ?? headerProps.iconSize, useWrapper, fluentProviderId } as const
}
