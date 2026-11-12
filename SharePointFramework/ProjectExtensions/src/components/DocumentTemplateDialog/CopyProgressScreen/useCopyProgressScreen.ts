import { useAnnounce } from '@fluentui/react-components'
import { format } from 'pp365-shared-library'
import strings from 'ProjectExtensionsStrings'
import { useEffect } from 'react'
import { ICopyProgressScreenProps } from './types'

/** Announces each template as copying starts, since progress changes are otherwise silent. */
export function useCopyProgressScreen(props: ICopyProgressScreenProps): void {
  const { announce } = useAnnounce()
  useEffect(() => {
    if (props.description) {
      announce(format(strings.CopyProgressAnnouncement, props.description), { polite: true })
    }
  }, [props.description])
}
