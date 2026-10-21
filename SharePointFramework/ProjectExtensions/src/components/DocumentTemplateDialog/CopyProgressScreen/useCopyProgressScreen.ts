import { useAnnounce } from '@fluentui/react-components'
import { format } from 'pp365-shared-library'
import strings from 'ProjectExtensionsStrings'
import { useEffect } from 'react'
import { ICopyProgressScreenProps } from './types'

/**
 * Component logic hook for `CopyProgressScreen`: tells each file to a screen reader as its copy
 * starts (WCAG 4.1.3), since the bar and the name change in silence.
 *
 * @param props Props for the component
 */
export function useCopyProgressScreen(props: ICopyProgressScreenProps): void {
  const { announce } = useAnnounce()
  useEffect(() => {
    if (props.description) {
      announce(format(strings.CopyProgressAnnouncement, props.description), { polite: true })
    }
  }, [props.description])
}
