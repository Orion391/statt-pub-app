#!/bin/bash

# Commento da aggiungere
COMMENT="// by Orion"

# Trova tutti i file .tsx escluso node_modules
FILES=$(find . -type f -name "*.tsx" ! -path "*/node_modules/*")

for file in $FILES; do
  # Verifica che il commento non sia già presente
  if ! grep -qF "$COMMENT" "$file"; then
    echo "Modifico: $file"
    # Usa sed per aggiungere il commento all'inizio (compatibile con macOS)
    tmpfile=$(mktemp)
    echo -e "$COMMENT\n" | cat - "$file" > "$tmpfile" && mv "$tmpfile" "$file"
  fi
done

echo "✅ Commenti aggiunti a tutti i file .tsx"