// Helper de paginación cursor para ERP Panamá Superadmin
type PaginarWhere = Record<string, unknown>;
type PaginarOrderBy = Record<string, unknown> | Record<string, unknown>[];
type PaginarInclude = Record<string, unknown>;

interface PaginarFindManyArgs {
  take?: number;
  skip?: number;
  cursor?: { id: string };
  where?: PaginarWhere;
  orderBy?: PaginarOrderBy;
  include?: PaginarInclude;
}

interface PaginableDelegate<T> {
  findMany(args: PaginarFindManyArgs): Promise<T[]>;
}

export async function paginar<T extends { id: string }>(
  model: PaginableDelegate<T>,
  { cursor, take = 20, where = {}, orderBy = { createdAt: "desc" }, include }:
  { cursor?: string | null; take?: number; where?: PaginarWhere; orderBy?: PaginarOrderBy; include?: PaginarInclude }
) {
  const queryArgs: PaginarFindManyArgs = {
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
