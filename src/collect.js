export default function collect(oas) {
  const collection = {};
  Object.entries(oas.paths).forEach(([path, inner]) => {
    Object.entries(inner).forEach(([method, operation]) => {
      if (!operation.operationId) return;
      collection[operation.operationId] = {
        path,
        method,
        operation
      };
    });
  });
  return collection;
}
