#!/usr/bin/env bash
set -euo pipefail

# Food AI / ft_transcendence launcher

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

ENV_FILE="backend/.env"
ENV_EXAMPLE="backend/.env.example"

info()  { printf '\033[1;34m[INFO]\033[0m %s\n' "$*"; }
ok()    { printf '\033[1;32m[OK]\033[0m %s\n' "$*"; }
warn()  { printf '\033[1;33m[WARN]\033[0m %s\n' "$*"; }
error() { printf '\033[1;31m[ERROR]\033[0m %s\n' "$*" >&2; }

command_exists() {
    command -v "$1" >/dev/null 2>&1
}

check_requirements() {
    if ! command_exists docker; then
        error "Docker não foi encontrado."
        exit 1
    fi

    if ! docker compose version >/dev/null 2>&1; then
        error "Docker Compose não foi encontrado."
        exit 1
    fi

    if ! docker info >/dev/null 2>&1; then
        error "O daemon do Docker não está acessível."
        exit 1
    fi
}

check_env() {
    if [[ ! -f "$ENV_FILE" ]]; then
        if [[ -f "$ENV_EXAMPLE" ]]; then
            cp "$ENV_EXAMPLE" "$ENV_FILE"

            warn "backend/.env não existia."
            warn "backend/.env foi criado a partir do .env.example."
            echo
            error "Preencha os valores reais em backend/.env e rode novamente."
            exit 1
        else
            error "backend/.env.example não encontrado."
            exit 1
        fi
    fi
}

start_project() {
    info "Validando Docker Compose..."
    docker compose config >/dev/null
    ok "Docker Compose válido."

    info "Construindo e iniciando containers..."
    docker compose up --build -d

    echo
    info "Estado dos serviços:"
    docker compose ps

    echo
    ok "Food AI iniciado."
    echo
    printf 'HTTPS: \033[1mhttps://localhost:8443\033[0m\n'
    printf 'HTTP:  \033[1mhttp://localhost:8080\033[0m\n'
    echo

    warn "O certificado HTTPS local é self-signed."
    warn "O navegador pode exibir um aviso de segurança."

    echo
    info "Backend:  docker compose logs -f backend"
    info "Frontend: docker compose logs -f frontend"
    info "Parar:    docker compose down"
}

check_requirements
check_env
start_project
