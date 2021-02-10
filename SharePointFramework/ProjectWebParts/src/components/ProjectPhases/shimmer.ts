import { ShimmerElementType } from 'office-ui-fabric-react/lib/Shimmer'
import { IShimmerElement } from 'office-ui-fabric-react/lib/Shimmer'

/**
 * Get shimmered elements to fill the specified width
 *
 * @param {number} width Width
 */
export const getShimmerElements = (width: number = 0) => {
  if (width === 0) return []
  const widthPerElement = width / 5
  const elements: IShimmerElement[] = []
  for (let i = 0; i < 5; i++) {
    elements.push(
      {
        type: ShimmerElementType.circle,
        width: widthPerElement - 20,
        height: widthPerElement - 20
      },
      { type: ShimmerElementType.gap, width: 20 }
    )
  }
  return elements
}
