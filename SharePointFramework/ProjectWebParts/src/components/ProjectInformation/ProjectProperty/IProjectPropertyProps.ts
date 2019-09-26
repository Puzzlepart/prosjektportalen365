import { ProjectPropertyModel } from './ProjectPropertyModel';

export interface IProjectPropertyProps extends React.HTMLAttributes<HTMLElement> {
    /**
     * Project property model
     */
    model: ProjectPropertyModel;
}