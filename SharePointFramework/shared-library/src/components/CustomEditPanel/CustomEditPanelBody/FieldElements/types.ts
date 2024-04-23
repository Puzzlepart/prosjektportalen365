import { FC } from 'react'
import { EditableSPField } from '../../../../models'

interface IFieldElementProps {
  field: EditableSPField
}

interface ITermLabel {
  name: string;
  isDefault: boolean;
  languageTag: string;
}

interface ITagTerm {
  key: string;
  name: string;
}

interface IModernTaxonomyTerm {
  id: string;
  labels: ITermLabel[];
}

export type Term = ITagTerm | IModernTaxonomyTerm;

export type FieldElementComponent = FC<IFieldElementProps>
