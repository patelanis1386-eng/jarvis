#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────────
# JARVIS X - Database Backup Script
# ─────────────────────────────────────────────────
# Usage: ./scripts/backup.sh [s3|local]
#   s3    - Backup to AWS S3 (or S3-compatible storage)
#   local - Backup to local directory (default)
# ─────────────────────────────────────────────────

COLOR_RESET="\033[0m"
COLOR_GREEN="\033[32m"
COLOR_YELLOW="\033[33m"
COLOR_CYAN="\033[36m"
COLOR_RED="\033[31m"

log_info()  { echo -e "${COLOR_CYAN}[INFO]${COLOR_RESET}  $*"; }
log_ok()    { echo -e "${COLOR_GREEN}[OK]${COLOR_RESET}    $*"; }
log_warn()  { echo -e "${COLOR_YELLOW}[WARN]${COLOR_RESET}  $*"; }
log_error() { echo -e "${COLOR_RED}[ERROR]${COLOR_RESET} $*"; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="${PROJECT_ROOT}/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_MODE="${1:-local}"

# Load environment variables
if [ -f "${PROJECT_ROOT}/.env" ]; then
    set -a
    source "${PROJECT_ROOT}/.env"
    set +a
fi

mkdir -p "${BACKUP_DIR}"

log_info "Starting JARVIS X backup (mode: ${BACKUP_MODE})..."
echo ""

# ── Database Backup ────────────────────────────
backup_database() {
    local db_url="${DATABASE_URL:-sqlite+aiosqlite:///./jarvis.db}"

    if [[ "$db_url" == sqlite* ]]; then
        # SQLite backup
        local db_path
        db_path=$(echo "$db_url" | sed 's/sqlite+aiosqlite:\/\///' | sed 's/sqlite:\/\///')
        db_path="${PROJECT_ROOT}/${db_path#./}"

        if [ -f "$db_path" ]; then
            local backup_file="${BACKUP_DIR}/jarvis_db_${TIMESTAMP}.sqlite"
            cp "$db_path" "$backup_file"
            log_ok "SQLite database backed up to: ${backup_file}"

            # Compress
            gzip -f "$backup_file"
            log_ok "Compressed: ${backup_file}.gz"
            BACKUP_FILE="${backup_file}.gz"
        else
            log_warn "SQLite database not found at: ${db_path}"
        fi

    elif [[ "$db_url" == postgresql* ]]; then
        # PostgreSQL backup
        local backup_file="${BACKUP_DIR}/jarvis_db_${TIMESTAMP}.sql"

        PGPASSWORD="${DB_PASSWORD:-jarvis}" pg_dump \
            -h "${DB_HOST:-localhost}" \
            -p "${DB_PORT:-5432}" \
            -U "${DB_USER:-jarvis}" \
            -d "${DB_NAME:-jarvisx}" \
            --clean \
            --if-exists \
            --no-owner \
            --no-acl \
            -f "$backup_file"

        log_ok "PostgreSQL database dumped to: ${backup_file}"

        # Compress
        gzip -f "$backup_file"
        log_ok "Compressed: ${backup_file}.gz"
        BACKUP_FILE="${backup_file}.gz"
    fi
}

# ── Uploads Backup ────────────────────────────
backup_uploads() {
    local uploads_dir="${PROJECT_ROOT}/uploads"
    if [ -d "$uploads_dir" ] && [ "$(ls -A "$uploads_dir" 2>/dev/null)" ]; then
        local backup_file="${BACKUP_DIR}/uploads_${TIMESTAMP}.tar.gz"
        tar -czf "$backup_file" -C "$PROJECT_ROOT" uploads/
        log_ok "Uploads backed up to: ${backup_file}"
        UPLOADS_BACKUP="$backup_file"
    else
        log_warn "No uploads directory or empty, skipping."
    fi
}

# ── S3 Upload ──────────────────────────────────
upload_to_s3() {
    if ! command -v aws &>/dev/null; then
        log_error "AWS CLI not found. Cannot upload to S3."
        return 1
    fi

    local bucket="${S3_BUCKET:-jarvis-x}"
    local region="${S3_REGION:-us-east-1}"

    log_info "Uploading to S3 bucket: ${bucket}..."

    if [ -n "${BACKUP_FILE:-}" ] && [ -f "$BACKUP_FILE" ]; then
        aws s3 cp "$BACKUP_FILE" "s3://${bucket}/backups/database/$(basename "$BACKUP_FILE")" --region "$region"
        log_ok "Database backup uploaded to S3"
    fi

    if [ -n "${UPLOADS_BACKUP:-}" ] && [ -f "$UPLOADS_BACKUP" ]; then
        aws s3 cp "$UPLOADS_BACKUP" "s3://${bucket}/backups/uploads/$(basename "$UPLOADS_BACKUP")" --region "$region"
        log_ok "Uploads backup uploaded to S3"
    fi
}

# ── Cleanup Old Backups ────────────────────────
cleanup_old_backups() {
    local retention_days="${BACKUP_RETENTION_DAYS:-30}"
    log_info "Cleaning up backups older than ${retention_days} days..."

    find "${BACKUP_DIR}" -name "jarvis_*.sql*" -type f -mtime "+${retention_days}" -delete
    find "${BACKUP_DIR}" -name "uploads_*.tar.gz" -type f -mtime "+${retention_days}" -delete

    log_ok "Old backups cleaned"
}

# ── Execute ────────────────────────────────────
backup_database
backup_uploads
cleanup_old_backups

if [ "$BACKUP_MODE" = "s3" ]; then
    upload_to_s3
fi

echo ""
log_ok "Backup completed successfully!"
log_info "Backup directory: ${BACKUP_DIR}"
log_info "Timestamp: ${TIMESTAMP}"
