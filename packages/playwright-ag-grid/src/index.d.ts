export declare const filterOperator: Record<string, string>;
export declare const sort: Record<string, string>;

export interface SearchCriteria {
  columnName: string;
  filterValue: string;
  operator?: string;
  searchInputIndex?: number;
  operatorIndex?: number;
  isMultiFilter?: boolean;
}

export interface FilterOptions {
  searchCriteria: SearchCriteria | SearchCriteria[];
  hasApplyButton?: boolean;
  noMenuTabs?: boolean;
  selectAllLocaleText?: string;
}

export declare class PlaywrightAgGrid {
  constructor(rootLocator: any);
  waitForAnimation(options?: object): Promise<void>;
  getData(options?: object): Promise<any>;
  sortColumn(columnName: string, sortDirection: string): Promise<void>;
  pinColumn(columnName: string, pin?: "left" | "right" | null): Promise<void>;
  filterTextMenu(options: FilterOptions): Promise<void>;
  filterTextFloating(options: FilterOptions): Promise<void>;
  filterCheckboxMenu(options: FilterOptions): Promise<void>;
  toggleColumnFromSideBar(columnName: string, doRemove: boolean): Promise<void>;
  getCellLocator(rowMatcher: Record<string, string>, columnName: string): Promise<any>;
}

export declare function createAgGrid(rootLocator: any): PlaywrightAgGrid;
