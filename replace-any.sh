find . -name "*.bak" | while read -r f; do
  original="${f%.bak}"
  mv "$f" "$original"
done