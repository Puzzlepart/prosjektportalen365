import { IStatusShape } from 'pp365-shared-library'

/** A status section's value as one tile of the strip. */
export interface IStatusTileProps {
  /** The shape the value is drawn with. */
  shape: IStatusShape

  /** The value's colour in `Prosjektkolonnekonfigurasjon`, where it has one. */
  color?: string
}
