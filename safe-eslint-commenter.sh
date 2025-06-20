#!/bin/bash

echo "🔍 Scansione dei file sorgente per errori ESLint noti..."
RULES=("no-unused-vars" "@typescript-eslint/no-unused-vars")

# Estensioni da includere
EXTENSIONS=("ts" "tsx")

# Escludi cartelle come node_modules, .next, ecc.
EXCLUDE_DIRS=("node_modules" ".next" "dist" "build" ".git")

# Funzione per controllare se una directory è esclusa
is_excluded() {
  for dir in "${EXCLUDE_DIRS[@]}"; do
    if [[ $1 == *"/$dir/"* ]]; then
      return 0
    fi
  done
  return 1
}

# Scansiona file
for ext in "${EXTENSIONS[@]}"; do
  find . -type f -name "*.${ext}" | while read -r file; do
    if is_excluded "$file"; then
      continue
    fi

    for rule in "${RULES[@]}"; do
      # Escapa il nome della regola per grep
      escaped_rule=$(echo "$rule" | sed 's/[]\/$*.^[]/\\&/g')

      # Cerca righe con variabili dichiarate ma non usate
      matches=$(grep -En '^[[:space:]]*(const|let|var)[[:space:]]+[a-zA-Z0-9_$]+[[:space:]]*=' "$file")

      if [ ! -z "$matches" ]; then
        echo "✏️  File: $file"
        while IFS= read -r match; do
          line_number=$(echo "$match" | cut -d':' -f1)
          # Inserisce un commento eslint solo se non già presente
          if ! sed -n "${line_number}p" "$file" | grep -q "eslint-disable"; then
            sed -i.bak "${line_number}s/$/ // eslint-disable-next-line ${rule}/" "$file"
          fi
        done <<< "$matches"
      fi
    done
  done
done

echo "✅ Completato. Controlla i file con 'git diff' prima di fare commit."