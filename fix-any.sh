#!/bin/bash

# Percorso del progetto (modifica se non sei nella root)
PROJECT_DIR="."

# Trova tutti i file TypeScript con .data() as any e sostituisce
grep -rl --include=\*.tsx ".data() as any" "$PROJECT_DIR" | while read -r file; do
  echo "🔧 Modificando $file"

  # Aggiunge import se manca
  grep -q "BaseDoc" "$file" || sed -i '' '1s;^;import { BaseDoc } from "@/lib/types";\' "$file"

  # Sostituisce .data() as any con .data() as BaseDoc
  sed -i '' 's/\.data() as any/\.data() as BaseDoc/g' "$file"
done