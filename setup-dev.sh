```bash
#!/usr/bin/env bash

set -euo pipefail

# Diretório onde este script está localizado.
# Assim o projeto pode ser movido para qualquer lugar.
PROJECT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
VENV_DIR="$PROJECT_DIR/.env"

info() {
    printf '\033[1;34m[INFO]\033[0m %s\n' "$*"
}

ok() {
    printf '\033[1;32m[OK]\033[0m %s\n' "$*"
}

warn() {
    printf '\033[1;33m[WARN]\033[0m %s\n' "$*"
}

error() {
    printf '\033[1;31m[ERROR]\033[0m %s\n' "$*" >&2
}

check_requirements() {
    info "Verificando ferramentas necessárias..."

    if ! command -v python3 >/dev/null 2>&1; then
        error "python3 não encontrado."
        exit 1
    fi

    if ! command -v npm >/dev/null 2>&1; then
        error "npm não encontrado."
        exit 1
    fi

    if [[ ! -f "$PROJECT_DIR/backend/requirements.txt" ]]; then
        error "backend/requirements.txt não encontrado."
        exit 1
    fi

    if [[ ! -f "$PROJECT_DIR/frontend/web/package.json" ]]; then
        error "frontend/web/package.json não encontrado."
        exit 1
    fi

    ok "Ferramentas básicas encontradas."
}

setup_python() {
    info "Preparando ambiente virtual Python..."

    if [[ ! -d "$VENV_DIR" ]]; then
        python3 -m venv "$VENV_DIR"
        ok "Venv criado em:"
        echo "  $VENV_DIR"
    else
        ok "Venv já existe:"
        echo "  $VENV_DIR"
    fi

    source "$VENV_DIR/bin/activate"

    info "Atualizando pip..."
    python -m pip install --upgrade pip

    info "Instalando dependências Python..."
    python -m pip install -r "$PROJECT_DIR/backend/requirements.txt"

    ok "Dependências Python instaladas."
}

setup_frontend() {
    info "Instalando dependências React..."

    cd "$PROJECT_DIR/frontend/web"

    if [[ -f package-lock.json ]]; then
        npm ci
    else
        npm install
    fi

    cd "$PROJECT_DIR"

    ok "Dependências do frontend instaladas."
}

setup_env() {
    cd "$PROJECT_DIR"

    if [[ -f backend/.env ]]; then
        ok "backend/.env já existe."
        return
    fi

    if [[ -f backend/.env.example ]]; then
        cp backend/.env.example backend/.env

        warn "backend/.env criado a partir do .env.example."
        warn "Preencha os secrets antes de rodar o backend."
    else
        warn "backend/.env.example não encontrado."
    fi
}

finish() {
    echo
    ok "Ambiente de desenvolvimento preparado!"
    echo

    echo "Projeto:"
    echo "  $PROJECT_DIR"
    echo

    echo "Venv:"
    echo "  $VENV_DIR"
    echo

    echo "Para ativar:"
    echo "  source $VENV_DIR/bin/activate"
    echo

    echo "Para rodar o backend:"
    echo "  cd $PROJECT_DIR/backend"
    echo "  python manage.py check"
    echo "  python manage.py migrate"
    echo "  python manage.py runserver"
    echo

    echo "Para rodar o frontend em outro terminal:"
    echo "  cd $PROJECT_DIR/frontend/web"
    echo "  npm run dev"
    echo

    echo "Para desativar o ambiente Python:"
    echo "  deactivate"
}

check_requirements
setup_python
setup_frontend
setup_env
finish
```
