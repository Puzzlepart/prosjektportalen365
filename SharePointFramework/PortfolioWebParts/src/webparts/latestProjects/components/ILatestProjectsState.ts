import { SearchResult } from "@pnp/sp";

export interface ILatestProjectsState {
  isLoading: boolean;
  projects: SearchResult[];
  showList: boolean;
}
