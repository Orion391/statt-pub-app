#!/bin/bash

echo "🔄 Ripristino delle righe che contengono 'node_modules' commentate nei file .ts e .tsx..."

# Esegui un backup prima
mkdir -p .backup_node_modules
find . -type f \( -name "*.ts" -o -name "*.tsx" \) -not -path "*/node_modules/*" -exec cp {} .backup_node_modules/ \;

# Ripristina le righe che contengono // e node_modules
find . -type f \( -name "*.ts" -o -name "*.tsx" \) -not -path "*/node_modules/*" -exec sed -i '' '/\/\/.*node_modules/ s|//||' {} \;

echo "✅ Completato. I commenti con 'node_modules' sono stati rimossi."
echo "📁 Backup creato in '.backup_node_modules'"