#!/bin/bash
# Respaldo automático diario de la base de datos de Montebello
# Guarda los últimos 7 días, borra los más viejos automáticamente

FECHA=$(date +%Y-%m-%d_%H%M)
CARPETA="/home/dockerdata/montebello-diagnostico/db/respaldos"
mkdir -p "$CARPETA"

docker exec montebello-db pg_dump -U montebello -d montebello_diagnostico > "$CARPETA/respaldo_$FECHA.sql"

# Borra respaldos de más de 7 días
find "$CARPETA" -name "respaldo_*.sql" -mtime +7 -delete

echo "Respaldo completado: respaldo_$FECHA.sql"
