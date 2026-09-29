/**
 * The icon a benefit measurement shows for its trend, as the portfolio data adapter computes it and
 * `TrendColumn` renders it.
 *
 * Replaces the Fluent UI v8 `IIconProps` that used to travel from `BenefitMeasurement` through the
 * item payload to the renderer. It names an icon in the shared catalog rather than a UI Fabric
 * icon, and carries the colour separately instead of as a style object.
 */
export interface ITrendIcon {
  /**
   * Name of the icon in the shared catalog.
   */
  iconName: 'Trophy' | 'ChevronUp' | 'ChevronDown'

  /**
   * CSS colour the icon is drawn in.
   */
  color: string
}
