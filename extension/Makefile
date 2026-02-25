# ──────────────────────────────────────────────────────────────────────────────
#  Flompt Extension — Makefile
# ──────────────────────────────────────────────────────────────────────────────

EXTENSION_DIR := $(shell pwd)
DIST_DIR      := $(EXTENSION_DIR)/dist
ZIP_NAME      := flompt-extension.zip

# Fichiers inclus dans le zip final (tout sauf fichiers dev)
PACK_FILES := manifest.json \
              background.js \
              content-script.js \
              content-script.css \
              icons/icon16.png \
              icons/icon32.png \
              icons/icon48.png \
              icons/icon128.png \
              icons/logo.svg

.PHONY: all icons pack clean help

all: icons pack

## icons — Génère les icônes PNG depuis icons/icon.svg
icons:
	@echo "🎨 Génération des icônes PNG…"
	@node generate-icons.js
	@echo ""

## pack — Crée le zip distribuable pour le Chrome Web Store
pack:
	@echo "📦 Packaging de l'extension…"
	@mkdir -p $(DIST_DIR)
	@python3 -c "\
import zipfile, os, sys; \
files = '$(PACK_FILES)'.split(); \
out = '$(DIST_DIR)/$(ZIP_NAME)'; \
zf = zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED); \
[zf.write(f) for f in files]; \
zf.close(); \
size = os.path.getsize(out); \
print(f'✅ Archive créée : dist/$(ZIP_NAME)  ({size/1024:.1f} KB)')"

## clean — Supprime le dossier dist/
clean:
	@echo "🧹 Nettoyage…"
	@rm -rf $(DIST_DIR)
	@echo "✅ dist/ supprimé"

## help — Affiche cette aide
help:
	@echo ""
	@echo "  make icons   Génère les icônes PNG depuis icons/icon.svg"
	@echo "  make pack    Crée dist/flompt-extension.zip"
	@echo "  make all     icons + pack"
	@echo "  make clean   Supprime dist/"
	@echo ""
