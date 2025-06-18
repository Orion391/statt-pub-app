#!/bin/bash

# Script per sostituire useState<unknown> con tipi più specifici nei casi noti

echo "🔍 Scansiono tutti gli useState<unknown>..."

# Tipi noti da sostituire: [pattern] -> [sostituzione]
declare -A replacements
replacements["useState<unknown>(null)"]="useState<ReactNode>(null)"
replacements["useState<unknown>(\"\")"]="useState<string>(\"\")"
replacements["useState<unknown>([])"]="useState<any[]>([])"
replacements["useState<unknown>({})"]="useState<Record<string, any>>({})"

# Cerca ricorsivamente nei .tsx e .ts
find . -type f \( -name "*.tsx" -o -name "*.ts" \) | while read -r file; do
  for pattern in "${!replacements[@]}"; do
    if grep -q "$pattern" "$file"; then
      echo "✏️  $file — sostituisco '$pattern'"
      sed -i '' "s|$pattern|${replacements[$pattern]}|g" "$file"
    fi
  done
done

echo "✅ Refactor completato!"