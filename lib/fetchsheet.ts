import Papa from "papaparse";

const CSV_URL =
  "https://docs.google.com/spreadsheets/d/1dvxGw-_Lf9hvF8-MwHEBCgT6vzjMqBVRMF2817P3y58/export?format=csv&gid=127253953";

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