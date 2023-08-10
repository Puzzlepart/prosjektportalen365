import { useContext } from 'react'
import { ProjectCardContext } from '../context'
import _ from 'underscore'

/**
 * Component logic hook for `ProjectCardContent`
 */
export function useProjectCardContent() {
  const context = useContext(ProjectCardContext)

  return {
    phase: context.project.phase,
    serviceArea:
      !_.isEmpty(context.project.serviceArea) &&
      context.project.serviceArea.map((area, idx) => {
        return {
          key: area + idx,
          value: area,
          primaryText: area,
          children: area,
          type: 'Tjenesteområde'
        }
      }),
    type:
      !_.isEmpty(context.project.type) &&
      context.project.type.map((type, idx) => {
        return {
          key: type + idx,
          value: type,
          primaryText: type,
          children: type,
          type: 'Prosjekttype'
        }
      }),
    template: context.project.template,
    isProgram: context.project.isProgram,
    isParent: context.project.isParent
  } as const
}
