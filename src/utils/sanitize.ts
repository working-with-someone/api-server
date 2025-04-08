type FieldFilterOptions<T> = {
  exclude?: (keyof T)[];
  include?: (keyof T)[];
};

export function sanitize<T extends Record<string, any>>(
  obj: T,
  options: FieldFilterOptions<T>
) {
  if (options.include) {
    return Object.fromEntries(options.include.map((key) => [key, obj[key]]));
  }

  if (options.exclude) {
    return Object.fromEntries(
      Object.entries(obj).filter(
        ([key]) => !options.exclude!.includes(key as keyof T)
      )
    );
  }

  return obj;
}
