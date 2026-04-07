import React, { FC } from 'react'
import { FieldRenderer } from './FieldRenderer'
import { IFieldRendererListProps } from './types'

/**
 * Renders a list of provision fields for a given level, sorted by `order`.
 * Each field is rendered via `FieldRenderer` with optional per-field config
 * from the `configs` map.
 */
export const FieldRendererList: FC<IFieldRendererListProps> = ({ fields, level, configs }) => {
  const levelFields = fields.filter((f) => f.level === level).sort((a, b) => a.order - b.order)

  return (
    <>
      {levelFields.map((field) => (
        <FieldRenderer key={field.fieldName} field={field} config={configs?.[field.fieldName]} />
      ))}
    </>
  )
}
