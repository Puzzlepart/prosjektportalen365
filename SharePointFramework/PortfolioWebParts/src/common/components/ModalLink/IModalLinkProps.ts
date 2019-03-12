export interface IModalLinkProps extends React.HTMLAttributes<HTMLElement> {
  label?: string;
  showLabel?: boolean;
  title?: string;
  url: string;
  reloadOnSubmit?: boolean;
  reloadOnCancel?: boolean;
  id?: string;
  showModalDialog(): void;
}

export const ModalLinkDefaultProps: Partial<IModalLinkProps> = {
  showLabel: true,
  reloadOnSubmit: false,
  reloadOnCancel: false,
  className: ''
};
