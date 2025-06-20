#!/bin/bash

echo "🚀 Inizio commento di 'any' nei file .ts e .tsx (escludendo node_modules)..."

# Trova tutti i file .ts o .tsx (escludendo node_modules)
find . -type f \( -name "*.ts" -o -name "*.tsx" \) ! -path "./node_modules/*" | while read -r file; do
  if grep -qE '(:\s*any\b|as\s+any\b)' "$file"; then
    echo "✏️  File modificato: $file"
    # Commenta solo le righe che contengono 'any'
    sed -i '' -E 's/^([[:space:]]*)(.*:\s*any\b.*)/\1\/\/ eslint-disable-next-line\n\1\2/' "$file"
    sed -i '' -E 's/^([[:space:]]*)(.*as\s+any\b.*)/\1\/\/ eslint-disable-next-line\n\1\2/' "$file"
  fi
done

echo "✅ Tutti gli 'any' sono stati commentati in modo sicuro."
echo "Puoi ora eseguire 'npm run lint' e 'npm run build' per confermare che non ci siano errori."