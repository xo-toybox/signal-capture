SHELL := /bin/bash
.DEFAULT_GOAL := help

.PHONY: help dev dev-mobile dev-docker setup test test-e2e typecheck lint check build clean nuke db-push db-pull db-reset _ensure-docker _ensure-supabase _ensure-unlinked

# --- Help ---

help: ## Show available commands
	@grep -E '^[a-zA-Z0-9_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

# --- Dev ---

dev: ## Start dev server with mock data (no database)
	NEXT_PUBLIC_SUPABASE_URL= NEXT_PUBLIC_SUPABASE_ANON_KEY= SUPABASE_SERVICE_ROLE_KEY= \
		bun run dev

dev-mobile: ## Start dev server on port 3001 for mobile side-by-side testing
	NEXT_DIST_DIR=.next-mobile NEXT_PUBLIC_SUPABASE_URL= NEXT_PUBLIC_SUPABASE_ANON_KEY= SUPABASE_SERVICE_ROLE_KEY= \
		bun run dev --port 3001

dev-docker: db-reset ## Start dev server with local Supabase (requires Docker)
	eval "$$(supabase status -o env \
			--override-name api.url=NEXT_PUBLIC_SUPABASE_URL \
			--override-name auth.anon_key=NEXT_PUBLIC_SUPABASE_ANON_KEY \
			--override-name auth.service_role_key=SUPABASE_SERVICE_ROLE_KEY \
		| sed 's/^/export /')" && \
		NEXT_DIST_DIR=.next-docker ALLOWED_EMAIL= bun run dev --port 3002

# --- Test ---

test: ## Run unit tests
	bun run test

test-e2e: _ensure-supabase ## Run E2E tests (requires Docker)
	bun run test:e2e

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

db-pull: _ensure-supabase _ensure-unlinked ## Pull production data into local Supabase
	@if [ -z "$${SUPABASE_PROJECT_REF}" ]; then echo "SUPABASE_PROJECT_REF not set" >&2; exit 1; fi
	supabase db dump --data-only --db-url "postgresql://postgres:postgres@db.$${SUPABASE_PROJECT_REF}.supabase.co:5432/postgres" -f /tmp/claude/prod-data.sql
	supabase db reset --local
	psql "$$(supabase status -o json | jq -r .DB_URL)" < /tmp/claude/prod-data.sql
	rm -f /tmp/claude/prod-data.sql
	@echo "Done. Local database now has production data."

db-reset: _ensure-supabase _ensure-unlinked ## Reset local database with seed data
	echo y | supabase db reset --local && \
	psql "$$(supabase status -o json | jq -r .DB_URL)" < .dev-docker/seed-local.sql

clean: ## Remove build artifacts
	rm -rf .next .next-* .coverage .test-results .tsbuildinfo

nuke: ## Remove build artifacts and node_modules
	@echo "This will delete .next/ and node_modules/."
	@read -p "Continue? [y/N] " confirm && [ "$$confirm" = y ] || { echo "Aborted."; exit 1; }
	rm -rf .next node_modules

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
