import * as React from 'react';
import { Dialog, DialogType } from 'office-ui-fabric-react/lib/Dialog';
import { View } from './Views';
import { Body } from './Body';
import { Footer } from './Footer';
import IChangePhaseDialogProps from './IChangePhaseDialogProps';
import IChangePhaseDialogState from './IChangePhaseDialogState';
import styles from './ChangePhaseDialog.module.scss';
import * as ProjectPhasesWebPartStrings from 'ProjectPhasesWebPartStrings';
import * as format from 'string-format';
import { IPhaseChecklistItem } from 'models';

/**
 * Change phase dialog
 */
export default class ChangePhaseDialog extends React.Component<IChangePhaseDialogProps, IChangePhaseDialogState> {
    /**
     * Constructor
     */
    constructor(props: IChangePhaseDialogProps) {
        super(props);
        const checklistItems = props.activePhase ? props.activePhase.checklistData.items : [];
        this.state = {
            isLoading: false,
            checklistItems,
            currentIdx: this.getNextIndex(checklistItems, 0),
            currentView: checklistItems.filter(this.checkPointOpenFilter).length > 0 ? View.Initial : View.Confirm,
        };
    }

    public render() {
        const dlgCntBaseProps = {
            currentView: this.state.currentView,
            isLoading: this.state.isLoading,
            onDismiss: this.props.onDismiss,
            onChangePhase: this.props.onChangePhase,
            newPhase: this.props.newPhase,
            activePhase: this.props.activePhase,
        };
        return (
            <Dialog
                isOpen={true}
                containerClassName={styles.changePhaseDialog}
                title={ProjectPhasesWebPartStrings.ChangePhaseText}
                subText={this.state.currentView === View.Confirm ? format(ProjectPhasesWebPartStrings.ConfirmChangePhase, this.props.newPhase.name) : ''}
                dialogContentProps={{ type: DialogType.largeHeader }}
                modalProps={{ isDarkOverlay: true, isBlocking: false }}
                onDismiss={this.props.onDismiss}>
                <Body
                    {...dlgCntBaseProps}
                    checklistItems={this.state.checklistItems}
                    currentIdx={this.state.currentIdx}
                    nextCheckPointAction={this.nextCheckPoint.bind(this)} />
                <Footer {...dlgCntBaseProps} onChangeView={this.onChangeView.bind(this)} />
            </Dialog>
        );
    }

    /**
     * Go to next checkpoint
     *
     * @param {string} statusValue Status value
     * @param {string} commentsValue Comments value
     * @param {boolean} updateStatus Should status be updated
     */
    private async nextCheckPoint(statusValue: string, commentsValue: string, updateStatus: boolean = true): Promise<void> {
        this.setState({ isLoading: true });
        const { phaseChecklist } = this.props;
        const { checklistItems, currentIdx } = { ...this.state } as IChangePhaseDialogState;
        const currentItem = checklistItems[currentIdx];
        let updatedValues: { [key: string]: string } = { GtComment: commentsValue };
        if (updateStatus) {
            updatedValues.GtChecklistStatus = statusValue;
        }
        await phaseChecklist.items.getById(currentItem.ID).update(updatedValues);
        checklistItems[currentIdx] = { ...currentItem, ...updatedValues };
        let newState: Partial<IChangePhaseDialogState> = {
            checklistItems,
            isLoading: false,
        };
        const nextIndex = this.getNextIndex();
        if (nextIndex != -1) {
            newState.currentIdx = nextIndex;
        } else {
            newState.currentView = View.Summary;
        }
        this.setState(newState);
    }

    /**
     * Get next index
     * 
     * @param {IPhaseChecklistItem[]} checklistItems Check list items
     * @param {number} currentIdx Current index
     */
    private getNextIndex(checklistItems: IPhaseChecklistItem[] = this.state.checklistItems, currentIdx: number = this.state.currentIdx): number {
        const [nextOpen] = [].concat(checklistItems).splice(currentIdx).filter(this.checkPointOpenFilter);
        return checklistItems.indexOf(nextOpen);
    }

    /**
     * Check point open filter
     * 
     * @param {IPhaseChecklistItem} item Item
     */
    private checkPointOpenFilter(item: IPhaseChecklistItem) {
        return item.GtChecklistStatus === ProjectPhasesWebPartStrings.StatusOpen;
    }

    /**
     * Change view
     *
     * @param {View} newView New view
     */
    private onChangeView(newView: View) {
        this.setState({ currentView: newView });
    }
}

export { IChangePhaseDialogProps };
