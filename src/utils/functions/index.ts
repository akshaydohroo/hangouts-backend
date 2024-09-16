/**
 * Parses a JWT token and extracts specified fields from the token payload.
 * @param token - The JWT token to parse.
 * @param fields - An array of fields to extract from the token payload.
 * @param newFields - An array of new field names to assign to the extracted fields.
 * @returns An object containing the extracted fields as key-value pairs.
 */
export function parseJwtToken(
  token: string,
  fields: Array<string>,
  newFields: Array<string>
): { [key: string]: string } {
  const tokenPayload = JSON.parse(
    Buffer.from(token.split(".")[1], "base64").toString()
  );

  const result: { [key: string]: string } = {};
  fields.forEach((field, index) => {
    if (tokenPayload.hasOwnProperty(field)) {
      result[newFields[index]] = tokenPayload[field];
    }
  });
  return result;
}

/**
 * Converts a JavaScript regular expression to a MySQL regular expression.
 *
 * @param jsRegExp - The JavaScript regular expression to convert.
 * @returns The MySQL regular expression.
 */
export function convertToMySQLRegExp(jsRegExp: RegExp): string {
  // Escape special characters
  const escapedPattern = jsRegExp.source.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // Modify flags for MySQL syntax
  const flags = jsRegExp.flags.includes("i") ? "i" : "";

  return `(?${flags}:${escapedPattern})`;
}

/**
 * Converts a time value from one unit to another.
 *
 * @param value - The value to be converted.
 * @param fromUnit - The unit of the value to be converted from.
 * @param toUnit - The unit to convert the value to.
 * @returns The converted value.
 * @throws Error if the provided time units are invalid.
 */
export function convertTime(
  value: number,
  fromUnit: string,
  toUnit: string
): number {
  const timeUnits: { [key: string]: number } = {
    ms: 1,
    s: 1000,
    min: 60000,
    hr: 3600000,
    d: 86400000,
  };
  if (
    !timeUnits.hasOwnProperty(fromUnit) ||
    !timeUnits.hasOwnProperty(toUnit)
  ) {
    throw new Error("Invalid time unit");
  }

  const conversionFactor = timeUnits[fromUnit] / timeUnits[toUnit];
  const convertedValue = value * conversionFactor;

  return convertedValue;
}

export function inputDateToDate(inputDate: string): Date {
  const parts = inputDate.split("-");
  const year = parseInt(parts[0]);
  const month = parseInt(parts[1]) - 1;
  const day = parseInt(parts[2]);

  return new Date(year, month, day);
}
