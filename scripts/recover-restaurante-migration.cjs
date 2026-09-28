// Recupera únicamente el fallo conocido de la migración de mesas/cierre Z.
// Vercel conserva la conexión de producción; este archivo no contiene credenciales.
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { PrismaClient } = require('@prisma/client');

const migration = '20260925120000_restaurant_tables_daily_z';
const migrationFile = path.join(
  __dirname,
  '..',
  'prisma',
  'migrations',
  migration,
  'migration.sql'
);
const connection = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!connection) {
  console.error('[migration-recovery] Falta DIRECT_URL/DATABASE_URL.');
  process.exit(1);
}

const prisma = new PrismaClient({ datasources: { db: { url: connection } } });

const expectedColumns = {
  Empresa: [['horaCierreNegocio', 'text', 'NO']],
  MesaRestaurante: [
    ['id', 'text', 'NO'],
    ['empresaId', 'text', 'NO'],
    ['nombre', 'text', 'NO'],
    ['activa', 'boolean', 'NO'],
    ['createdAt', 'timestamp without time zone', 'NO'],
  ],
  SesionMesa: [
    ['id', 'text', 'NO'],
    ['empresaId', 'text', 'NO'],
    ['mesaId', 'text', 'NO'],
    ['saloneroId', 'text', 'NO'],
    ['tipo', 'text', 'NO'],
    ['estado', 'text', 'NO'],
    ['items', 'jsonb', 'NO'],
    ['version', 'integer', 'NO'],
    ['abiertaAt', 'timestamp without time zone', 'NO'],
    ['cerradaAt', 'timestamp without time zone', 'YES'],
    ['ventaId', 'text', 'YES'],
  ],
  CierreZDiario: [
    ['id', 'text', 'NO'],
    ['empresaId', 'text', 'NO'],
    ['fecha', 'text', 'NO'],
    ['usuarioId', 'text', 'NO'],
    ['resumen', 'jsonb', 'NO'],
    ['createdAt', 'timestamp without time zone', 'NO'],
  ],
  AlertaOperativa: [
    ['id', 'text', 'NO'],
    ['empresaId', 'text', 'NO'],
    ['clave', 'text', 'NO'],
    ['tipo', 'text', 'NO'],
    ['mensaje', 'text', 'NO'],
    ['createdAt', 'timestamp without time zone', 'NO'],
    ['enviadaAt', 'timestamp without time zone', 'YES'],
    ['resueltaAt', 'timestamp without time zone', 'YES'],
  ],
};

const expectedIndexes = [
  ['MesaRestaurante_empresaId_nombre_key', 'MesaRestaurante', true, ['empresaId', 'nombre']],
  ['MesaRestaurante_empresaId_idx', 'MesaRestaurante', false, ['empresaId']],
  ['SesionMesa_ventaId_key', 'SesionMesa', true, ['ventaId']],
  ['SesionMesa_mesa_abierta_key', 'SesionMesa', true, ['mesaId'], true],
  [
    'SesionMesa_empresaId_estado_abiertaAt_idx',
    'SesionMesa',
    false,
    ['empresaId', 'estado', 'abiertaAt'],
  ],
  ['SesionMesa_mesaId_estado_idx', 'SesionMesa', false, ['mesaId', 'estado']],
  ['CierreZDiario_empresaId_fecha_key', 'CierreZDiario', true, ['empresaId', 'fecha']],
  ['AlertaOperativa_empresaId_clave_key', 'AlertaOperativa', true, ['empresaId', 'clave']],
  ['AlertaOperativa_empresaId_createdAt_idx', 'AlertaOperativa', false, ['empresaId', 'createdAt']],
];

const expectedConstraints = [
  ['MesaRestaurante_pkey', 'MesaRestaurante', 'p'],
  ['MesaRestaurante_empresaId_fkey', 'MesaRestaurante', 'f', 'Empresa'],
  ['SesionMesa_pkey', 'SesionMesa', 'p'],
  ['SesionMesa_empresaId_fkey', 'SesionMesa', 'f', 'Empresa'],
  ['SesionMesa_mesaId_fkey', 'SesionMesa', 'f', 'MesaRestaurante'],
  ['SesionMesa_saloneroId_fkey', 'SesionMesa', 'f', 'Usuario'],
  ['SesionMesa_ventaId_fkey', 'SesionMesa', 'f', 'Venta'],
  ['CierreZDiario_pkey', 'CierreZDiario', 'p'],
  ['CierreZDiario_empresaId_fkey', 'CierreZDiario', 'f', 'Empresa'],
  ['CierreZDiario_usuarioId_fkey', 'CierreZDiario', 'f', 'Usuario'],
  ['AlertaOperativa_pkey', 'AlertaOperativa', 'p'],
  ['AlertaOperativa_empresaId_fkey', 'AlertaOperativa', 'f', 'Empresa'],
];

function assert(condition, message) {
  if (!condition) throw new Error(`[migration-recovery] ${message}`);
}

function getStatements() {
  const sql = fs.readFileSync(migrationFile, 'utf8');
  const statements = sql
    .split(/;\s*(?:\r?\n|$)/)
    .map((part) => part.trim())
    .filter(Boolean);
  assert(statements.length === 14, 'El archivo de migración cambió; se requiere revisión manual.');
  assert(
    statements[0] ===
      'ALTER TABLE "Empresa" ADD COLUMN "horaCierreNegocio" TEXT NOT NULL DEFAULT \'22:00\'',
    'La primera instrucción de la migración cambió; se requiere revisión manual.'
  );
  return statements.map((statement, index) => {
    if (index === 0) return statement.replace('ADD COLUMN ', 'ADD COLUMN IF NOT EXISTS ');
    assert(/^CREATE (TABLE|(?:UNIQUE )?INDEX) /.test(statement), 'Instrucción SQL inesperada.');
    return statement.replace(/^CREATE (TABLE|(?:UNIQUE )?INDEX) /, 'CREATE $1 IF NOT EXISTS ');
  });
}

async function verify(tx) {
  const tables = await tx.$queryRawUnsafe(`
    SELECT table_name AS "name" FROM information_schema.tables
    WHERE table_schema = current_schema() AND table_type = 'BASE TABLE'
  `);
  const tableNames = new Set(tables.map((row) => row.name));
  for (const name of Object.keys(expectedColumns)) {
    assert(tableNames.has(name), `Falta la tabla ${name}.`);
  }

  const columns = await tx.$queryRawUnsafe(`
    SELECT table_name AS "tableName", column_name AS "name", data_type AS "type",
           is_nullable AS "nullable", column_default AS "defaultValue"
    FROM information_schema.columns WHERE table_schema = current_schema()
  `);
  const columnMap = new Map(columns.map((row) => [`${row.tableName}.${row.name}`, row]));
  for (const [table, specs] of Object.entries(expectedColumns)) {
    for (const [name, type, nullable] of specs) {
      const actual = columnMap.get(`${table}.${name}`);
      assert(
        actual && actual.type === type && actual.nullable === nullable,
        `La columna ${table}.${name} no coincide con la migración.`
      );
    }
  }
  const defaults = [
    ['Empresa.horaCierreNegocio', '22:00'],
    ['MesaRestaurante.activa', 'true'],
    ['SesionMesa.tipo', 'normal'],
    ['SesionMesa.estado', 'abierta'],
    ['SesionMesa.items', '[]'],
    ['SesionMesa.version', '0'],
  ];
  for (const [key, value] of defaults) {
    assert(
      String(columnMap.get(key)?.defaultValue || '').includes(value),
      `El valor predeterminado de ${key} no coincide con la migración.`
    );
  }

  const indexes = await tx.$queryRawUnsafe(`
    SELECT indexname AS "name", tablename AS "tableName", indexdef AS "definition"
    FROM pg_indexes WHERE schemaname = current_schema()
  `);
  const indexMap = new Map(indexes.map((row) => [row.name, row]));
  for (const [name, table, unique, fields, partial] of expectedIndexes) {
    const index = indexMap.get(name);
    assert(index && index.tableName === table, `Falta el índice ${name}.`);
    const definition = index.definition.replace(/"/g, '').replace(/\s+/g, ' ').toLowerCase();
    assert(
      definition.includes(unique ? 'create unique index' : 'create index'),
      `El índice ${name} tiene una definición distinta.`
    );
    assert(
      definition.includes(`(${fields.join(', ').toLowerCase()})`),
      `Las columnas del índice ${name} no coinciden.`
    );
    assert(
      partial
        ? definition.includes('where') &&
            definition.includes('estado') &&
            definition.includes('abierta')
        : !definition.includes('where'),
      `La condición del índice ${name} no coincide.`
    );
  }

  const constraints = await tx.$queryRawUnsafe(`
    SELECT c.conname AS "name", t.relname AS "tableName", c.contype AS "type",
           r.relname AS "referencedTable"
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    LEFT JOIN pg_class r ON r.oid = c.confrelid
    WHERE n.nspname = current_schema()
  `);
  const constraintMap = new Map(constraints.map((row) => [row.name, row]));
  for (const [name, table, type, referenced] of expectedConstraints) {
    const actual = constraintMap.get(name);
    assert(
      actual &&
        actual.tableName === table &&
        actual.type === type &&
        (!referenced || actual.referencedTable === referenced),
      `Falta o no coincide la restricción ${name}.`
    );
  }
}

async function main() {
  const rows = await prisma.$queryRaw`
    SELECT id, logs FROM "_prisma_migrations"
    WHERE migration_name = ${migration} AND finished_at IS NULL AND rolled_back_at IS NULL
  `;
  if (rows.length === 0) {
    console.log('[migration-recovery] No hay fallo pendiente de esta migración.');
    return;
  }
  assert(rows.length === 1, 'Hay varios intentos fallidos; se requiere revisión manual.');
  const logs = rows[0].logs || '';
  assert(
    logs.includes('horaCierreNegocio') && /already exists|42701/.test(logs),
    'La migración falló por otro motivo; se requiere revisión manual.'
  );

  const statements = getStatements();
  console.log(
    '[migration-recovery] Se encontró el fallo conocido. Completando y verificando la migración.'
  );
  await prisma.$transaction(
    async (tx) => {
      for (const statement of statements) await tx.$executeRawUnsafe(statement);
      await verify(tx);
    },
    { maxWait: 15000, timeout: 120000 }
  );
  await prisma.$disconnect();

  const result = spawnSync(
    process.execPath,
    [require.resolve('prisma/build/index.js'), 'migrate', 'resolve', '--applied', migration],
    { stdio: 'inherit', env: process.env }
  );
  assert(result.status === 0, 'No se pudo registrar la migración como aplicada.');
  console.log('[migration-recovery] Migración recuperada y verificada.');
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
