export const agGridSelector = "#myGrid";
export const agGridElementsSelector = "#myGrid2";

export const expectedFirstPageTableData = [
  { Year: "2020", Make: "Toyota", Model: "Celica", Condition: "fair", Price: "35000" },
  { Year: "2020", Make: "Ford", Model: "Mondeo", Condition: "excellent", Price: "32000" },
  { Year: "2020", Make: "Porsche", Model: "Boxter", Condition: "good", Price: "72000" },
  { Year: "2020", Make: "BMW", Model: "3-series", Condition: "fair", Price: "45000" },
  { Year: "2020", Make: "Mercedes", Model: "GLC300", Condition: "good", Price: "53000" },
];

export const expectedPorscheRowsBeforeEditing = [
  { Year: "2020", Make: "Porsche", Model: "Boxter", Price: "72000" },
  { Year: "2020", Make: "Porsche", Model: "Boxter", Price: "99000" },
];

export const expectedPorscheRowsAfterEditing = [
  { Year: "2020", Make: "Porsche", Model: "Boxter", Price: "66000" },
  { Year: "2020", Make: "Porsche", Model: "Boxter", Price: "99000" },
];
