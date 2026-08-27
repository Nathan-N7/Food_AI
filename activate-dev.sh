#!/usr/bin/env bash

PROJECT_DIR="/goinfre/uviana-b/Food_AI"
VENV_DIR="/goinfre/uviana-b/.venvs/food_ai"

export YOLO_CONFIG_DIR="/goinfre/uviana-b/.config"
export MPLCONFIGDIR="/goinfre/uviana-b/.cache/matplotlib"

mkdir -p "$YOLO_CONFIG_DIR"
mkdir -p "$MPLCONFIGDIR"

if [[ ! -d "$VENV_DIR" ]]; then
    echo "[ERROR] Venv não encontrado em:"
    echo "  $VENV_DIR"
    echo
    echo "Rode primeiro:"
    echo "  $PROJECT_DIR/setup-dev.sh"
    return 1 2>/dev/null || exit 1
fi

source "$VENV_DIR/bin/activate"

cd "$PROJECT_DIR"

echo
echo "[OK] Ambiente Food AI ativado."
echo
echo "Projeto:"
echo "  $PROJECT_DIR"
echo
echo "Python:"
which python
echo
echo "YOLO_CONFIG_DIR:"
echo "  $YOLO_CONFIG_DIR"
echo
echo "MPLCONFIGDIR:"
echo "  $MPLCONFIGDIR"
echo
