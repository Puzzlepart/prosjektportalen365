import { createContext } from 'react';
import { useProjectList } from './useProjectList';

export interface IProjectListContext extends ReturnType<typeof useProjectList> {

}

export const ProjectListContext = createContext<IProjectListContext>(null)