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
  const ownerPersonaProps: AvatarProps = {
    ...defaultPersonaProps,
    ...context.project.owner,
    role: strings.ProjectOwner
  }
  const managerPersonaProps: AvatarProps = {
    ...defaultPersonaProps,
    ...context.project.manager,
    role: strings.ProjectManager
  }
  return {
    phase: context.project.phase,
    owner: ownerPersonaProps,
    manager: managerPersonaProps
  } as const
}
