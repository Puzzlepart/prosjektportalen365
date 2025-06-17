import * as strings from 'PortfolioWebPartsStrings'
import { useContext } from 'react'
import { ProjectCardContext } from '../context'
import { AvatarProps } from '@fluentui/react-components'

/**
 * Component logic hook for `ProjectCardFooter`
 */
export function useProjectCardFooter() {
  const context = useContext(ProjectCardContext)
  const defaultPersonaProps: AvatarProps = {
    name: strings.NotSet,
    color: 'brand'
  }
  const primaryUserPersonaProps: AvatarProps = {
    ...defaultPersonaProps,
    ...context.project.owner,
    role: context.project?.data[context.primaryUserField]
  }
  const secondaryUserPersonaProps: AvatarProps = {
    ...defaultPersonaProps,
    ...context.project.manager,
    role: context.project?.data[context.secondaryUserField]
  }
  return {
    phase: context.project.phase,
    primaryUser: primaryUserPersonaProps,
    secondaryUser: secondaryUserPersonaProps
  } as const
}
