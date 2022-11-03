import React, { FC } from 'react'
import { RiskMatrixContext } from './context'
import { MatrixRows } from './MatrixRows'
import styles from './RiskMatrix.module.scss'
import { MATRIX_DEFAULT_COLOR_SCALE_CONFIG, IRiskMatrixProps } from './types'
import { useRiskMatrix } from './useRiskMatrix'

export const RiskMatrix: FC<IRiskMatrixProps> = (props) => {
  const { ctxValue } = useRiskMatrix(props)

  return (
    <RiskMatrixContext.Provider value={ctxValue}>
      <div className={styles.root} style={{ width: props.width, minHeight: 300 }}>
        <MatrixRows />
      </div>
    </RiskMatrixContext.Provider>
  )
}

RiskMatrix.defaultProps = {
  items: [],
  width: 400,
  fullWidth: false,
  customConfigUrl: 'SiteAssets/custom-cells.txt',
  size: '5',
  colorScaleConfig: MATRIX_DEFAULT_COLOR_SCALE_CONFIG
}

export * from './types'
