import { IMatrixCell } from './MatrixCell'

export type DynamicMatrixSize = '4' | '5' | '6'

export type DynamicMatrixConfiguration = IMatrixCell[][]

type RGB = [number, number, number]

export type DynamicMatrixColorScaleConfig = { percentage?: number; color: RGB }
