export interface AgGridExtractionOptions {
  onlyColumns?: string[];
  valuesArray?: boolean;
  returnElements?: boolean;
  timeoutMs?: number;
}

export declare const filterOperator: Record<string, string>;
export declare const sort: Record<string, string>;
export declare const filterTab: Record<string, string>;

export declare function isRowNotDestroyed(rowElement: Element): boolean;

export declare function waitForAgGridAnimation(
  agGridRootElement: Element,
  options?: AgGridExtractionOptions
): Promise<void>;

export declare function getAgGridHeaders(tableElement: Element): string[];

export declare function extractAgGrid(
  agGridRootElement: Element,
  options?: AgGridExtractionOptions
): Array<Record<string, string | Element>> | { headers: string[]; rows: Array<Array<string | Element>> };

export declare function extractAgGridData(
  agGridRootElement: Element,
  options?: AgGridExtractionOptions
): Promise<Array<Record<string, string>> | { headers: string[]; rows: string[][] }>;

export declare function extractAgGridElements(
  agGridRootElement: Element,
  options?: AgGridExtractionOptions
): Promise<Array<Record<string, Element>> | { headers: string[]; rows: Element[][] }>;

export declare function browserExtractAgGrid(
  agGridRootElement: Element,
  options?: AgGridExtractionOptions
): Array<Record<string, string>> | { headers: string[]; rows: string[][] };

export declare function browserWaitForAgGridAnimation(
  agGridRootElement: Element,
  options?: AgGridExtractionOptions
): Promise<void>;
