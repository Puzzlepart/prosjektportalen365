import React, { FC } from 'react'
import { Commands } from './Commands'
import { ProjectStatusContext } from './context'
import { IProjectStatusProps } from './types'
import { useProjectStatus } from './useProjectStatus'

export const ProjectStatus: FC<IProjectStatusProps> = (props) => {
  const { state, setState } = useProjectStatus(props)
  return (
    <ProjectStatusContext.Provider value={{ props, state, setState }}>
      <div>
        <Commands />
      </div>
    </ProjectStatusContext.Provider>
  )
}

export * from './types'
