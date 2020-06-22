import * as React from 'react';
import { IMatrixCell } from '../IMatrixCell';
import { MatrixCell, MatrixCellType, MatrixHeaderCell } from '../MatrixCell';
import { RiskElement } from '../RiskElement';
import { RiskElementModel } from '../RiskElementModel';
import RISK_MATRIX_CELLS from '../RiskMatrixCells';
import { IMatrixRowProps } from './IMatrixRowProps';
import styles from './MatrixRow.module.scss';


export const MatrixRow = ({ children }: IMatrixRowProps) => {
    return (
        <tr className={styles.matrixRow}>
            {children}
        </tr>
    );
};

/**
 * Get risk elements for cell 
 */
const getRiskElementsForCell = (items: RiskElementModel[], cell: IMatrixCell, calloutTemplate: string) => {
    const itemsForCell = items.filter(risk => cell.probability === risk.probability && cell.consequence === risk.consequence);
    const riskElements = itemsForCell.map((risk, idx) => <RiskElement key={idx} model={risk} calloutTemplate={calloutTemplate} />);
    return riskElements;
};

/**
 * Get risk elements post action for cell
 */
const getRiskElementsPostActionForCell = (items: RiskElementModel[], cell: IMatrixCell, calloutTemplate: string) => {
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


export const MatrixRows = ({ items, calloutTemplate }) => {
    const children = RISK_MATRIX_CELLS.map((rows, i) => {
        let cells = rows.map((c, j) => {
            const cell = RISK_MATRIX_CELLS[i][j];
            const riskElements = getRiskElementsForCell(items, cell, calloutTemplate);
            const riskElementsPostAction = getRiskElementsPostActionForCell(items, cell, calloutTemplate);
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
    return (
        <>
            {children}
        </>
    );
};