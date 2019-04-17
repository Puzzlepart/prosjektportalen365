import ProjectPropertyModel from "../../models/ProjectPropertyModel";

export default interface IProjectPropertyProps extends React.HTMLAttributes<HTMLElement> {
    model: ProjectPropertyModel;
}