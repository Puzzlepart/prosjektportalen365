import React, { FC } from 'react'
import { RiskMatrixContext } from './context'
import { MatrixRows } from './MatrixRows'
import styles from './RiskMatrix.module.scss'
import { IRiskMatrixProps } from './types'
import { useRiskMatrix } from './useRiskMatrix'

export const RiskMatrix: FC<IRiskMatrixProps> = (props) => {
  const { configuration, style } = useRiskMatrix(props)

  return (
    <RiskMatrixContext.Provider value={{ ...props, configuration }}>
      <div className={styles.root} style={style}>
        <MatrixRows />
      </div>
    </RiskMatrixContext.Provider>
  )
}

RiskMatrix.defaultProps = {
  items: [],
  width: 400,
  height: 300,
  customConfigUrl: 'SiteAssets/custom-cells.txt'
}

export * from './types'
