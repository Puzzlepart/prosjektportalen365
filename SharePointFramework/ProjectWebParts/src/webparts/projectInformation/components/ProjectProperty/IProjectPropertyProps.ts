import ProjectPropertyDefaultStyle from "./ProjectPropertyDefaultStyle";
import ProjectPropertyModel from "../../models/ProjectPropertyModel";

export default interface IProjectPropertyProps extends React.HTMLAttributes<HTMLElement> {
    model: ProjectPropertyModel;
    truncateLength?: number;
    labelSize?: "mi" | "xs" | "s" | "s-plus" | "m" | "m-plus" | "l" | "xl" | "xxl";
    valueSize?: "mi" | "xs" | "s" | "s-plus" | "m" | "m-plus" | "l" | "xl" | "xxl";
}

export const ProjectPropertyDefaultProps: Partial<IProjectPropertyProps> = { style: ProjectPropertyDefaultStyle, };

