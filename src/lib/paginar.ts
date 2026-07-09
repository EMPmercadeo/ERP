// Helper de paginación cursor para ERP Panamá Superadmin
export async function paginar<T extends { id: string }>(
  model: any,
  { cursor, take = 20, where = {}, orderBy = { createdAt: "desc" }, include }:
  { cursor?: string | null; take?: number; where?: any; orderBy?: any; include?: any }
) {
  const queryArgs: any = {
    take: take + 1,
    where,
    orderBy,
  };

  if (cursor) {
    queryArgs.cursor = { id: cursor };
    queryArgs.skip = 1;
  }

  if (include) {
    queryArgs.include = include;
  }

  const rows: T[] = await model.findMany(queryArgs);
  const hasMore = rows.length > take;
  const items = hasMore ? rows.slice(0, take) : rows;
  const nextCursor = hasMore && items.length > 0 ? items[items.length - 1].id : null;

  return { items, nextCursor };
}
