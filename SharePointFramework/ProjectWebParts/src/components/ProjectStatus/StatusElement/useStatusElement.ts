import { useContext } from 'react'
import { SectionContext } from '../Sections/context'
import styles from './StatusElement.module.scss'
import { IStatusElementProps } from './types'
import { useId } from '@fluentui/react-components'
import { format } from 'pp365-shared-library'
import * as strings from 'ProjectWebPartsStrings'

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

  // The name of the icon shown alone: the section and its status, which the icon shows by its
  // colour only (WCAG 1.1.1).
  const iconName = headerProps.value
    ? format(strings.Aria.NameValueLabel, headerProps.label, headerProps.value)
    : headerProps.label

  return {
    commentProps,
    iconSize: props.iconSize ?? headerProps.iconSize,
    useWrapper,
    fluentProviderId,
    iconName
  } as const
}
