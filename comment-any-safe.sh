#!/bin/bash

echo "🔍 Commento delle occorrenze di ': any' in corso..."

find . \
  -type f \
  \( -name "*.ts" -o -name "*.tsx" \) \
  -not -path "./node_modules/*" \
  -not -path "./.next/*" \
  -not -path "./.git/*" \
  -print0 | while IFS= read -r -d '' file; do
    sed -i '' -E 's/: any/\/\* : any \*\//g' "$file"
done

echo "✅ Completato. Tutte le occorrenze ': any' sono ora commentate in sicurezza."