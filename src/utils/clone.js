// Deep copy for plain JSON data (products, orders, users...).
// Services keep their own mutable in-memory stores; anything handed to Redux gets
// deep-frozen by Immer, so services must never return (or store) shared references.
export const deepClone = (value) => {
  if (value === undefined || value === null) return value;
  return JSON.parse(JSON.stringify(value));
};
