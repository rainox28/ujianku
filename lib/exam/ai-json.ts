export function parseAIJson(text: string): unknown {
  const clean = text
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/gi, "")
    .trim();

  try {
    return JSON.parse(clean);
  } catch {
    const objStart = clean.indexOf("{");
    const objEnd = clean.lastIndexOf("}");
    const arrStart = clean.indexOf("[");
    const arrEnd = clean.lastIndexOf("]");

    // Take whichever structure opens first, so an array of objects is not cut down to its first element.
    const useArray =
      arrStart !== -1 && arrEnd > arrStart && (objStart === -1 || arrStart < objStart);

    if (useArray) return JSON.parse(clean.substring(arrStart, arrEnd + 1));
    if (objStart !== -1 && objEnd > objStart) {
      return JSON.parse(clean.substring(objStart, objEnd + 1));
    }
    throw new Error("Cannot parse AI response as JSON");
  }
}
