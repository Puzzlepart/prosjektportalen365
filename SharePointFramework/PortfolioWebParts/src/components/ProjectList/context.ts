import { createContext } from 'react'
import { useProjectList } from './useProjectList'

/** Shared project-list state and actions returned by the main hook. */
export type IProjectListContext = ReturnType<typeof useProjectList>

/** State shared by project-list tabs, commands and renderers. */
export const ProjectListContext = createContext<IProjectListContext>(null)
