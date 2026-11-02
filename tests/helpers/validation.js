/** Run mongoose validation; resolves with the ValidationError, or undefined if valid. */
export function validationError(doc) {
  return doc.validate().then(
    () => undefined,
    (error) => error
  );
}
