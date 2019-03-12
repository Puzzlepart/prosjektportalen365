import * as React from 'react';
import styles from './NewStatusReportModal.module.scss';
import { INewStatusReportModalProps, INewStatusReportModalField } from './INewStatusReportModalProps';
import { INewStatusReportModalState } from './INewStatusReportModalState';
import { Modal } from 'office-ui-fabric-react/lib/Modal';
import { TextField } from 'office-ui-fabric-react/lib/TextField';
import { Dropdown } from 'office-ui-fabric-react/lib/Dropdown';
import { PrimaryButton } from 'office-ui-fabric-react/lib/Button';
import { autobind } from 'office-ui-fabric-react/lib/Utilities';
import * as strings from 'ProjectStatusWebPartStrings';

export default class NewStatusReportModal extends React.Component<INewStatusReportModalProps, INewStatusReportModalState> {
    constructor(props: INewStatusReportModalProps) {
        super(props);
        this.state = { model: {} };
    }

    public render(): React.ReactElement<INewStatusReportModalProps> {
        return (
            <Modal isOpen={true} onDismiss={this.props.onDismiss}>
                <div className={styles.newStatusReportModal}>
                    <div className={styles.newStatusReportModalHeader}>{strings.NewStatusReportModalHeaderText}</div>
                    {this.renderFields()}
                    <div className={styles.newStatusReportModalFooter}>
                        <PrimaryButton
                            text={strings.SaveText}
                            style={{ width: '100%' }}
                            onClick={this.onSave}
                            disabled={!this.isSaveButtonEnabled()} />
                    </div>
                </div>
            </Modal>
        );
    }

    private renderFields() {
        return this.props.fields.map(fld => {
            switch (fld.fieldType) {
                case 'text': {
                    return (
                        <div className={styles.newStatusReportModalField}>
                            <TextField label={fld.title} onChanged={value => this.onFieldUpdated(fld, value)} />
                        </div>
                    );
                }
                case 'note': {
                    const [relatedChoiceField] = this.props.fields.filter(_fld => _fld.fieldName.indexOf('GtStatus') !== -1 && _fld.fieldName === fld.fieldName.replace('Comment', ''));
                    const relatedChoiceFieldValue = relatedChoiceField ? this.state.model[relatedChoiceField.fieldName] : null;
                    return (
                        <div className={styles.newStatusReportModalField} hidden={relatedChoiceField && (!relatedChoiceFieldValue || relatedChoiceFieldValue === '')}>
                            <TextField
                                label={fld.title}
                                multiline={true}
                                onChanged={value => this.onFieldUpdated(fld, value)} />
                        </div>
                    );
                }
                case 'choice': {
                    const options = [
                        {
                            key: '',
                            text: '',
                        },
                        ...fld.choices.map(text => ({ key: text, text })),
                    ];
                    return (
                        <div className={styles.newStatusReportModalField}>
                            <Dropdown
                                label={fld.title}
                                options={options}
                                onChanged={opt => this.onFieldUpdated(fld, opt.key.toString())} />
                        </div>
                    );
                }
                default: {
                    return null;
                }
            }
        });
    }

    @autobind
    private isSaveButtonEnabled() {
        if (localStorage.newstatusreportmodal_issavebuttonenabled) {
            return true;
        }
        const statusChoiceFields = this.props.fields.filter(fld => fld.fieldName.indexOf('GtStatus') !== -1 && fld.fieldName.indexOf('Comment') === -1);
        const statusChoiceFieldsWithValue = statusChoiceFields.filter(fld => this.state.model[fld.fieldName] && this.state.model[fld.fieldName] !== '');
        return statusChoiceFields.length === statusChoiceFieldsWithValue.length;
    }

    @autobind
    private onFieldUpdated(field: INewStatusReportModalField, value: string) {
        const model = { ...this.state.model };
        model[field.fieldName] = value;
        this.setState({ model });
    }

    @autobind
    private onSave() {
        this.props.onSave(this.state.model);
    }
}
