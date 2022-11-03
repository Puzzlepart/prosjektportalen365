import React, { FC } from 'react'
import { IRiskMatrixProps } from './types'
import { MatrixRows } from './MatrixRows'
import styles from './RiskMatrix.module.scss'
import { pick } from 'underscore'
import { useRiskMatrix } from './useRiskMatrix'
import { RiskMatrixContext } from './context'

export const RiskMatrix: FC<IRiskMatrixProps> = (props) => {
  const { cells } = useRiskMatrix(props)

  return (
    <RiskMatrixContext.Provider value={{ ...props, cells }}>
      <div className={styles.root} style={pick(props, 'width', 'height')}>
        <MatrixRows />
      </div>
    </RiskMatrixContext.Provider>
  )
}

RiskMatrix.defaultProps = {
  items: [],
  width: 400,
  height: 300,
  customCellsUrl: 'SiteAssets/custom-cells.txt'
}

export * from './types'
