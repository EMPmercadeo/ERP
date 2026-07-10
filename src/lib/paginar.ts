// Helper de paginación cursor para ERP Panamá Superadmin

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PaginarWhere = Record<string, any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PaginarOrderBy = Record<string, any> | Record<string, any>[];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PaginarInclude = Record<string, any>;

interface PaginarFindManyArgs {
  take?: number;
  skip?: number;
  cursor?: { id: string };
  where?: PaginarWhere;
  orderBy?: PaginarOrderBy;
  include?: PaginarInclude;
}

// Usamos `any` para que sea compatible con todos los delegates de Prisma
// sin importar si el modelo tiene relaciones o no.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PaginableDelegate = { findMany: (args: any) => Promise<any[]> };

export async function paginar<T extends { id: string }>(
  model: PaginableDelegate,
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
