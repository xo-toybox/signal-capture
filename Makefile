SHELL := /bin/bash
.DEFAULT_GOAL := help

.PHONY: help dev dev-mobile dev-docker dev-browse dev-browse-docker setup test test-e2e test-e2e-headed test-e2e-ui test-e2e-report test-e2e-install typecheck lint check build icons clean nuke db-push db-reset _ensure-docker _ensure-supabase _ensure-unlinked

ifdef SPEC
  PLAYWRIGHT_SPEC := tests/e2e/$(SPEC).spec.ts
else
  PLAYWRIGHT_SPEC :=
endif

# --- Help ---

help: ## Show available commands
	@grep -E '^[a-zA-Z0-9_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

# Ports: dev=3000  dev-mobile=3001  dev-docker=3002  e2e/browse=3100

# --- Dev ---

dev: ## Start dev server on :3000 with mock data (no database)
	NEXT_PUBLIC_SUPABASE_URL= NEXT_PUBLIC_SUPABASE_ANON_KEY= SUPABASE_SERVICE_ROLE_KEY= \
		bun run dev

dev-mobile: ## Start dev server on :3001 for mobile side-by-side testing
	NEXT_DIST_DIR=.next-mobile NEXT_PUBLIC_SUPABASE_URL= NEXT_PUBLIC_SUPABASE_ANON_KEY= SUPABASE_SERVICE_ROLE_KEY= \
		bun run dev --port 3001

dev-docker: db-reset ## Start dev server on :3002 with local Supabase (requires Docker)
	eval "$$(supabase status -o env \
			--override-name api.url=NEXT_PUBLIC_SUPABASE_URL \
			--override-name auth.anon_key=NEXT_PUBLIC_SUPABASE_ANON_KEY \
			--override-name auth.service_role_key=SUPABASE_SERVICE_ROLE_KEY \
		| sed 's/^/export /')" && \
		NEXT_DIST_DIR=.next-docker ALLOWED_EMAIL= bun run dev --port 3002

dev-browse: ## Dev server on :3100 for Playwright/MCP browsing (mock)
	NEXT_DIST_DIR=.next-e2e NEXT_PUBLIC_SUPABASE_URL= NEXT_PUBLIC_SUPABASE_ANON_KEY= SUPABASE_SERVICE_ROLE_KEY= \
		bun run dev --port 3100

dev-browse-docker: _ensure-supabase ## Dev server on :3100 for Playwright/MCP browsing (Docker)
	eval "$$(supabase status -o env \
			--override-name api.url=NEXT_PUBLIC_SUPABASE_URL \
			--override-name auth.anon_key=NEXT_PUBLIC_SUPABASE_ANON_KEY \
			--override-name auth.service_role_key=SUPABASE_SERVICE_ROLE_KEY \
		| sed 's/^/export /')" && \
		NEXT_DIST_DIR=.next-e2e ALLOWED_EMAIL= bun run dev --port 3100

# --- Test ---

test: ## Run unit tests
	bun run test

test-e2e: _ensure-supabase ## Run E2E tests (headless). SPEC=auth for single file
	bun run test:e2e $(PLAYWRIGHT_SPEC)

test-e2e-headed: _ensure-supabase ## Run E2E tests with visible browser
	bunx playwright test --headed $(PLAYWRIGHT_SPEC)

test-e2e-ui: _ensure-supabase ## Open Playwright interactive UI mode
	bunx playwright test --ui

test-e2e-report: ## Open last Playwright HTML report
	bunx playwright show-report

test-e2e-install: ## Install Playwright browsers (first-time setup)
	bunx playwright install

# --- Quality ---

typecheck: ## Type-check with TypeScript
	bun run typecheck

lint: ## Run ESLint
	bun run lint

check: lint typecheck test build ## CI gate — run all checks

# --- Build ---

build: ## Production build
	bun run build

# --- Setup ---

setup: ## First-time project setup
	bun install --frozen-lockfile
	cp -n .env.example .env.local || true
	@echo "Next: fill in .env.local, run 'make db-push', enable Google OAuth in Supabase Dashboard > Auth > Providers"

db-push: ## Show instructions for applying schema
	@echo "Paste supabase/schema.sql into the Supabase SQL Editor:"
	@echo "https://supabase.com/dashboard/project/$${SUPABASE_PROJECT_REF:-<your-project-ref>}/sql"

db-reset: _ensure-supabase _ensure-unlinked ## Reset local database with seed data
	echo y | supabase db reset --local && \
	psql "$$(supabase status -o json | jq -r .DB_URL)" < .dev-docker/seed-local.sql

icons: ## Regenerate PWA icons from src/app/icon.svg
	rsvg-convert -w 192 -h 192 src/app/icon.svg -o public/icons/icon-192.png
	rsvg-convert -w 512 -h 512 src/app/icon.svg -o public/icons/icon-512.png

clean: ## Remove build artifacts
	rm -rf .next .next-* .coverage .test-results .tsbuildinfo

nuke: ## Remove build artifacts and node_modules
	rm -rf .next .next-* .coverage .test-results .tsbuildinfo node_modules

# --- Internal ---

_ensure-docker:
	@if ! docker info >/dev/null 2>&1; then \
		echo "Starting Docker Desktop..."; \
		open -a Docker; \
		remaining=60; \
		while ! docker info >/dev/null 2>&1; do \
			sleep 1; \
			remaining=$$((remaining - 1)); \
			if [ $$remaining -le 0 ]; then echo "Docker failed to start within 60s" >&2; exit 1; fi; \
		done; \
		echo "Docker is ready."; \
	fi

_ensure-supabase: _ensure-docker
	@if ! supabase status >/dev/null 2>&1; then \
		echo "Starting local Supabase..."; \
		supabase start; \
	fi

_ensure-unlinked:
	@if [ -f supabase/.temp/project-ref ]; then \
		echo "ERROR: Supabase CLI is linked to a remote project." >&2; \
		echo "This is dangerous — db reset/push could wipe production." >&2; \
		echo "Run: rm supabase/.temp/project-ref" >&2; \
		exit 1; \
	fi
