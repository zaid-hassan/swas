import Papa from "papaparse";

const CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRBzej5M0bDv8NnJ8xgCxfaEn_FYpdiNZiZMyhed_AMx9BTND-2f90pIk5CWAUiR0MlW4jJHg5ZaHGe/pub?gid=127253953&single=true&output=csv";

export async function fetchSheetProducts() {
  const res = await fetch(CSV_URL, {
    next: { revalidate: 60 },
  });

  const csvText = await res.text();

  const { data } = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  return data;
}
