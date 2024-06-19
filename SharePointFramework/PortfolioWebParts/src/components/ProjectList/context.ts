import { createContext } from 'react'
import { useProjectList } from './useProjectList'

export type IProjectListContext = ReturnType<typeof useProjectList>

export const ProjectListContext = createContext<IProjectListContext>(null)
