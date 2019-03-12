export interface IStatusProperties {
  statusValue?: string;
  statusClassName?: string;
  statusColor?: string;
  statusIconName?: string;
}

export default interface IStatusFieldsConfig {
  [key: string]: {
      statuses: IStatusProperties[],
  };
}
