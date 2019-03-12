import { SearchResult } from "@pnp/sp";

export interface ILatestProjectsState {
  isLoading: boolean;
  sites: SearchResult[];
  showList: boolean;
}
