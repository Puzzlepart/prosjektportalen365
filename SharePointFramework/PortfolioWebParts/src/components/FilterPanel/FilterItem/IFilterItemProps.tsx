export interface IFilterItemProps {
  name: string
  value: string
  selected?: boolean
  onChanged?: (event: React.FormEvent<HTMLElement | HTMLInputElement>, checked: boolean) => void
}
