import * as React from "react";
import styles from './ProjectProperty.module.scss';
import IProjectPropertyProps from "./IProjectPropertyProps";

/**
 * Project Property
 */
export default class ProjectProperty extends React.Component<IProjectPropertyProps, {}> {
    public static displayName = "ProjectProperty";

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
    public render(): React.ReactElement<IProjectPropertyProps> {
        return (
            <div
                className={styles.projectProperty}
                data-type={this.props.model.type}
                data-required={this.props.model.required}
                title={this.props.model.description}
                style={this.props.style}>
                <div className={styles.projectPropertyLabel}>{this.props.model.displayName}</div>
                <div className={styles.projectPropertyValue}>{this.props.model.value}</div>
            </div>
        );
    }
}

export { IProjectPropertyProps };
