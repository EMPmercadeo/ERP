# ERP Panamá - Guía de Instalación Self-Hosted

## Requisitos
- Docker y Docker Compose
- O: Node.js 20+ y PostgreSQL 16+

## Opción 1: Docker (Recomendado)

```bash
# Clonar repositorio
git clone https://github.com/tu-empresa/erp-panama.git
cd erp-panama

# Copiar y configurar variables
cp docker/env.template .env
# Editar .env con tus valores

# Iniciar servicios
docker-compose -f docker/docker-compose.yml up -d

# Ejecutar migraciones (primera vez)
docker-compose -f docker/docker-compose.yml exec app npx prisma migrate deploy

# Acceder
# App: http://localhost:3000
# DB Admin: http://localhost:8080
```

## Opción 2: Manual

```bash
# Instalar dependencias
npm install

# Configurar .env
cp docker/env.template .env
# Editar DATABASE_URL apuntando a tu PostgreSQL

# Generar Prisma Client
npx prisma generate

# Ejecutar migraciones
npx prisma migrate deploy

# Iniciar
npm run build
npm start
```

## Actualizar

```bash
git pull
docker-compose -f docker/docker-compose.yml down
docker-compose -f docker/docker-compose.yml up -d --build
docker-compose -f docker/docker-compose.yml exec app npx prisma migrate deploy
```

## Soporte
Contacto: soporte@erp-panama.com
