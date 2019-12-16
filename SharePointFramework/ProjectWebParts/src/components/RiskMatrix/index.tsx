import * as React from 'react';
import { IRiskMatrixProps } from './IRiskMatrixProps';
import styles from './RiskMatrix.module.scss';
import { MatrixHeaderCell, MatrixCell, MatrixCellType } from './MatrixCell';
import { RiskElement } from './RiskElement';
import { MatrixRow } from './MatrixRow';
import RISK_MATRIX_CELLS from './RiskMatrixCells';
import { IMatrixCell } from './IMatrixCell';

// tslint:disable-next-line: naming-convention
export const RiskMatrix = ({ items = [] }: IRiskMatrixProps) => {
    /**
     * Get risk elements for cell
     * 
     * @param cell 
     */
    const getRiskElementsForCell = (cell: IMatrixCell) => {
        const itemsForCell = items.filter(risk => cell.probability === risk.probability && cell.consequence === risk.consequence);
        const riskElements = itemsForCell.map((risk, idx) => <RiskElement key={idx} model={risk} />);
        return riskElements;
    };

    const getRiskElementsPostActionForCell = (cell: IMatrixCell) => {
        return [];
        // const itemsForCell = riskItems.filter(risk => cell.probability === risk.probabilityPostAction && cell.consequence === risk.consequencePostAction);
        // const riskElementsStyle: React.CSSProperties = {};
        // if (this.state.postAction && this.props.postActionShowOriginal) {
        //     riskElementsStyle.opacity = 0.5;
        // }
        // const riskElements = itemsForCell.map(risk => {
        //     return (
        //         <RiskElement
        //             key={`${risk.getKey("PostAction")}`}
        //             model={risk}
        //             style={riskElementsStyle} />
        //     );
        // });
        // return riskElements;
    };

    /**
     * Render rows
     */
    const renderRows = () => {
        const riskMatrixRows = RISK_MATRIX_CELLS.map((rows, i) => {
            let cells = rows.map((c, j) => {
                const cell = RISK_MATRIX_CELLS[i][j];
                const riskElements = getRiskElementsForCell(cell);
                const riskElementsPostAction = getRiskElementsPostActionForCell(cell);
                switch (cell.cellType) {
                    case MatrixCellType.Cell: {
                        return (
                            <MatrixCell
                                key={`MatrixCell_${j}`}
                                style={cell.style}
                                className={cell.className}>
                                {riskElements}
                                {riskElementsPostAction}
                            </MatrixCell>
                        );
                    }
                    case MatrixCellType.Header: {
                        return (
                            <MatrixHeaderCell
                                key={`MatrixHeaderCell_${j}`}
                                label={c.cellValue}
                                className={cell.className} />
                        );
                    }
                }
            });
            return (
                <MatrixRow key={i}>
                    {cells}
                </MatrixRow>
            );
        });
        return riskMatrixRows;
    };


    return (
        <div className={styles.riskMatrix}>
            <table>
                <tbody>
                    {renderRows()}
                </tbody>
            </table>
        </div>
    );
};
export * from './IRiskMatrixProps';

