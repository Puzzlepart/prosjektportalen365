export interface IStatusMarkProps {
  /**
   * The status colour, which gives the shape where the status value has no icon of its own.
   */
  color?: string

  /**
   * The status value's own icon (`GtPortfolioColumnIconName` in `Prosjektkolonnekonfigurasjon`).
   * `CircleFill`, the hub template's, counts as none.
   */
  iconName?: string

  /**
   * The size in px of the icon the mark sits beside. The mark is 40 % of it, and no smaller than
   * 12 px.
   */
  iconSize?: number
}
