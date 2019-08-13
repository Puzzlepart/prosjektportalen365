import * as React from 'react';
import * as strings from 'BenefitsOverviewWebPartStrings';
import styles from './BenefitMeasurementsModal.module.scss';
import { Modal, IModalProps } from 'office-ui-fabric-react/lib/Modal';
import { DetailsList, IColumn, SelectionMode } from 'office-ui-fabric-react/lib/DetailsList';
import { BenefitMeasurementsModalColumns } from './BenefitMeasurementsModalColumns';
import { BenefitMeasurementIndicator, BenefitMeasurement } from 'models';
import * as objectGet from 'object-get';

export interface IBenefitMeasurementsModalProps extends IModalProps {
    indicator: BenefitMeasurementIndicator;
    columns?: IColumn[];
}

export interface IBenefitMeasurementsModalState {
    isOpen?: boolean;
}

export default class BenefitMeasurementsModal extends React.PureComponent<IBenefitMeasurementsModalProps, IBenefitMeasurementsModalState> {
    public static defaultProps: Partial<IBenefitMeasurementsModalProps> = {
        columns: BenefitMeasurementsModalColumns,
    };

    constructor(props: IBenefitMeasurementsModalProps) {
        super(props);
        this.state = {};
    }

    public render(): React.ReactElement<IBenefitMeasurementsModalProps> {
        if (this.props.indicator.measurements.length === 0) {
            return null;
        }
        return (
            <div>
                <a href='#' onClick={this.onOpenModal}>{strings.ShowAllMeasurementsLinkText}</a>
                <Modal
                    isOpen={this.state.isOpen}
                    isDarkOverlay={true}
                    containerClassName={styles.benefitMeasurementsModal}
                    onDismiss={this.onCloseModal}
                    isBlocking={false}>
                    <div className={styles.header}>
                        <div className={styles.title}>
                            {this.props.indicator.title}
                        </div>
                    </div>
                    <DetailsList
                        items={this.props.indicator.measurements}
                        columns={this.props.columns}
                        onRenderItemColumn={this.onRenderItemColumn}
                        selectionMode={SelectionMode.none} />
                </Modal>
            </div>
        );
    }

    private onOpenModal = () => {
        this.setState({ isOpen: true });
    }

    private onCloseModal = () => {
        this.setState({ isOpen: false });
    }

    private onRenderItemColumn = (item: BenefitMeasurement, index: number, column: IColumn) => {
        const fieldNameDisplay: string = objectGet(column, 'data.fieldNameDisplay');
        return column.onRender ? column.onRender(item, index, column) : objectGet(item, fieldNameDisplay || column.fieldName);
    }
}
