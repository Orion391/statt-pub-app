#!/bin/bash

# Directory root del progetto
PROJECT_DIR="$(pwd)"

# Cerca tutti gli any esclusi i node_modules
grep -rni 'any' . --exclude-dir=node_modules --include=\*.ts --include=\*.tsx | while read -r line ; do
  file=$(echo "$line" | cut -d: -f1)
  linenumber=$(echo "$line" | cut -d: -f2)
  fullpath="$PROJECT_DIR/$file"
  echo "Apro $fullpath alla riga $linenumber"
  code -r -g "$fullpath:$linenumber"
  read -p "Premi Invio per aprire il prossimo file..."
done