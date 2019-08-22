import { DisplayMode } from '@microsoft/sp-core-library';
import { WebPartTitle } from "@pnp/spfx-controls-react/lib/WebPartTitle";
import { ActionButton } from 'office-ui-fabric-react/lib/Button';
import * as React from "react";
import { formatDate } from 'shared/lib/helpers/formatDate';
import * as format from 'string-format';
import { IStatusReportsProps } from "./IStatusReportsProps";
import styles from './StatusReports.module.scss';

export class StatusReports extends React.Component<IStatusReportsProps, {}> {
    public static defaultProps: Partial<IStatusReportsProps> = { iconName: 'PageCheckedin' };

    /**
     * Constructor
     *
     * @param {IStatusReportsProps} props Props
     */
    constructor(props: IStatusReportsProps) {
        super(props);
    }

    /**
     * Renders the component
     */
    public render(): React.ReactElement<IStatusReportsProps> {
        return (
            <div className={styles.statusReports} hidden={this.props.hidden}>
                <WebPartTitle
                    displayMode={DisplayMode.Read}
                    title={this.props.title}
                    updateProperty={_ => { }} />
                <ul>
                    {this.props.statusReports.map((report, idx) => (
                        <li className={styles.item} key={idx}>
                            <ActionButton
                                href={format(`${this.props.webUrl}/${this.props.reportLinkUrlTemplate}&Source=${decodeURIComponent(document.location.href)}`, report.Id.toString())}
                                text={formatDate(report.Created, true)}
                                iconProps={{ iconName: this.props.iconName }} />
                        </li>
                    ))}
                </ul>
            </div>
        );
    }
}

export { IStatusReportsProps };

