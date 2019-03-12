import * as React from "react";
import IProjectPropertyProps, { ProjectPropertyDefaultProps } from "./IProjectPropertyProps";

/**
 * Project Property
 */
export default class ProjectProperty extends React.Component<IProjectPropertyProps, {}> {
    public static displayName = "ProjectProperty";
    public static defaultProps = ProjectPropertyDefaultProps;

    /**
     * Constructor
     *
     * @param {IProjectPropertyProps} props Props
     */
    constructor(props: IProjectPropertyProps) {
        super(props);
    }

    /**
     * Renders the component
     */
    public render(): JSX.Element {
        let labelClassName = ["_label", "ms-fontWeight-semibold"];
        let valueClassName = ["_value"];
        if (this.props.labelSize) {
            labelClassName.push(`ms-font-${this.props.labelSize}`);
        }
        if (this.props.valueSize) {
            valueClassName.push(`ms-font-${this.props.valueSize}`);
        }

        return (
            <div
                className={`${this.props.model.internalName} prop`}
                data-type={this.props.model.type}
                data-required={this.props.model.required}
                title={this.props.model.description}
                style={this.props.style}>
                <div className={labelClassName.join(" ")}>{this.props.model.displayName}</div>
                <div className={valueClassName.join(" ")}>{this.props.model.value}</div>
            </div>
        );
    }
}

export { IProjectPropertyProps };
