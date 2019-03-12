import * as React from "react";
import { PrimaryButton, IButtonProps } from "office-ui-fabric-react/lib/Button";
import { TextField } from "office-ui-fabric-react/lib/TextField";
import { autobind } from "office-ui-fabric-react/lib/Utilities";
import IInitialViewProps, { InitialViewDefaultProps } from "./IInitialViewProps";
import IInitialViewState from "./IInitialViewState";
import * as strings from 'ProjectPhasesWebPartStrings';

/**
 * Initial view
 */
export default class InitialView extends React.Component<IInitialViewProps, IInitialViewState> {
    public static defaultProps = InitialViewDefaultProps;

    /**
     * Constructor
     *
     * @param {IInitialViewProps} props Props
     */
    constructor(props: IInitialViewProps) {
        super(props);
        this.state = { comment: props.currentChecklistItem ? (props.currentChecklistItem.GtComment || "") : "" };
    }

    public render(): JSX.Element {
        if (!this.props.currentChecklistItem) {
            return null;
        }
        return (
            <div className={this.props.className}>
                <h3>{this.props.currentChecklistItem.Title}</h3>
                <div style={{ marginTop: 10 }}>
                    <TextField
                        onChanged={this.onCommentUpdate}
                        placeholder={strings.CommentLabel}
                        multiline
                        value={this.state.comment}
                        resizable={false}
                        style={{ height: 100 }} />
                </div>
                {this.renderStatusOptions()}
            </div>
        );
    }

    /**
     * Render status options
     */
    private renderStatusOptions() {
        const { isLoading, commentMinLength } = this.props;
        const { comment } = this.state;
        const isCommentValid = (comment.length >= commentMinLength) && /\S/.test(comment);
        const statusOptions: IButtonProps[] = [
            {
                text: strings.StatusNotRelevant,
                disabled: (isLoading || !isCommentValid),
                title: !isCommentValid ? strings.CheckpointNotRelevantTooltipCommentEmpty : strings.CheckpointNotRelevantTooltip,
                onClick: () => this.onNextCheckPoint(strings.StatusNotRelevant, comment),
            },
            {
                text: strings.StatusStillOpen,
                disabled: (isLoading || !isCommentValid),
                title: !isCommentValid ? strings.CheckpointStillOpenTooltipCommentEmpty : strings.CheckpointStillOpenTooltip,
                onClick: () => this.onNextCheckPoint(strings.StatusStillOpen, comment, false),
            },
            {
                text: strings.StatusClosed,
                disabled: isLoading,
                title: strings.CheckpointDoneTooltip,
                onClick: () => this.onNextCheckPoint(strings.StatusClosed, comment),
            }];
        return (
            <div style={{ marginTop: 20, marginBottom: 25 }}>
                {statusOptions.map((statusOpt, key) => (
                    <span key={key} >
                        <PrimaryButton style={{ marginRight: 5 }} {...statusOpt} />
                    </span>
                ))}
            </div>
        );
    }

    /**
    * Next checkpoint action
    *
    * @param {string} status Status value
    * @param {string} comment Comment value
    * @param {boolean} updateStatus Update status
    */
    @autobind
    private onNextCheckPoint(status: string, comment: string, updateStatus: boolean = true) {
        this.props.nextCheckPointAction(status, comment, true);
        this.setState({ comment: "" });
    }

    /**
    * On comment update
    *
    * @param {string} newValue New value
    */
    @autobind
    private onCommentUpdate(newValue: string) {
        this.setState({ comment: newValue });
    }
}
