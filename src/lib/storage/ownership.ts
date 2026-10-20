export type StorageOwner = string | null;

export function didStorageOwnerChange(
  previous: StorageOwner | undefined,
  next: StorageOwner,
): boolean {
  return previous !== undefined && previous !== next;
}
