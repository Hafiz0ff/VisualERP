# 🛠️ VisualERP

> **Лёгкая, наглядная и модульная ERP-система для малого производственного бизнеса.**
> Современная альтернатива хаотичным Excel-таблицам и перегруженным legacy-системам (вроде 1С) для небольших цехов и мастерских.
>
> **Lightweight, visual, and modular ERP system for small manufacturing businesses.**
> A modern alternative to messy Excel files and bloated legacy workflows for small-scale factories.

---

<div align="center">
  <p>
    <img src="https://img.shields.io/badge/Status-Phase%2013%20Complete-brightgreen?style=for-the-badge&logo=github" alt="Phase 13 Complete" />
    <img src="https://img.shields.io/badge/Version-v0.9.0--beta-orange?style=for-the-badge" alt="Beta Release" />
    <img src="https://img.shields.io/badge/Architecture-Modular%20Monolith-blue?style=for-the-badge" alt="Modular Monolith" />
  </p>
  <p>
    <img src="https://img.shields.io/badge/Backend-Fastify%20%2B%20TS-d13b4f?style=flat-square&logo=fastify" alt="Fastify Backend" />
    <img src="https://img.shields.io/badge/Frontend-React%20%2B%20Vite%20%2B%20TS-61dafb?style=flat-square&logo=react" alt="React Frontend" />
    <img src="https://img.shields.io/badge/Database-PostgreSQL%20%2B%20Prisma-0287d0?style=flat-square&logo=prisma" alt="Database" />
    <img src="https://img.shields.io/badge/Container-Docker%20Compose-2496ed?style=flat-square&logo=docker" alt="Docker Compose" />
  </p>
</div>

---

## 🇷🇺 Содержание / Russian Version
1. [Обзор проекта](#описание-проекта)
2. [Архитектурная формула](#архитектурная-формула)
3. [Бизнес-логика и складской учёт](#бизнес-логика-и-складской-учёт)
4. [Технологический стек](#технологический-стек)
5. [Карта документации](#карта-документации)
6. [Инструкция по запуску](#инструкция-по-быстрому-запуску)
7. [История фаз и прогресс](#история-фаз-и-прогресс)

## 🇬🇧 Table of Contents / English Version
1. [Project Overview](#project-overview)
2. [Architectural Formula](#architectural-formula-1)
3. [Business Logic & Stock Accounting](#business-logic---stock-accounting)
4. [Tech Stack](#tech-stack-1)
5. [Documentation Map](#documentation-map-1)
6. [Quick Start Guide](#quick-start-guide)
7. [Phase Progress & Roadmap](#phase-progress--roadmap)

---

# 🇷🇺 РУССКАЯ ВЕРСИЯ

## Описание проекта

**VisualERP** создана для малых производственных компаний, которым нужен порядок в операциях без избыточной бюрократии корпоративных систем. Она помогает видеть реальные остатки по складам и партиям, оформлять перемещения, планировать производство по рецептурам и отслеживать отгрузки клиентам.

### Для кого подходит:
* 🧱 Производство строительных смесей (целевой пилотный кейс)
* 🧀 Пищевые цеха (сыроварни, мясное производство, снеки)
* 🪑 Небольшие сборочные мастерские (мебель, инструменты, упаковка)
* 👕 Текстильные и швейные производства

---

## Архитектурная формула

Система строится по принципу:
$$\text{VisualERP Core} + \text{Отраслевые профили (Profiles)} + \text{Дополнительные модули (Modules)}$$

Ядро системы полностью изолировано от отраслевой специфики. Любые изменения терминологии (например, переименование «Сырья» в «Компоненты» или «Второго склада» в «Сушильный цех») выполняются через файл конфигурации профиля, не затрагивая структуру базы данных.

---

## Бизнес-логика и складской учёт

### 📈 Движение запасов через Ledger-архитектуру
В отличие от простых систем, где баланс товара хранится в виде одного перезаписываемого числа, в VisualERP используется **метод двойной записи (Stock Ledger)**.
* Любое действие (приёмка, перемещение, списание, выпуск, отгрузка) рождает неизменяемую запись в таблице `StockMovement`.
* Текущие остатки на складах рассчитываются динамически путём суммирования всех исторических движений.
* Предотвращаются любые расхождения данных: баланс невозможно изменить в обход документа.

### 🔄 Жизненный цикл документов:
Все складские документы проходят строгий жизненный цикл:
$$\text{Черновик (DRAFT)} \longrightarrow \text{Проведён (POSTED)} \longrightarrow \text{Отменён (CANCELLED)}$$
При отмене документа система автоматически делает компенсирующие записи в реестре, предварительно проверяя, не приведёт ли это к отрицательным остаткам на складе.

### 🏭 Базовый бизнес-процесс:
```text
[Поступление сырья (PR)] ➔ Накопление на складе ➔ [Перемещение в цех (TR)] ➔
➔ [Производство (PRD)] ➔ Списание компонентов по рецептуре (BOM) + Выпуск готовой продукции ➔
➔ Накопление на складе ГП ➔ [Отгрузка клиенту (SHP)]
```

---

## Технологический стек

* **Backend:** Node.js, Fastify (быстрый веб-фреймворк с минимальными накладными расходами), TypeScript.
* **ORM & БД:** Prisma ORM, СУБД PostgreSQL.
* **Валидация:** Zod (строгая валидация входящих DTO на уровне маршрутов).
* **Idempotency:** База данных хранит ключи идемпотентности (`IdempotencyKey`) для предотвращения двойных списаний при сетевых сбоях.
* **Frontend:** React, TypeScript, Vite. Использован красивый интерфейс с адаптивной сеткой и микро-анимациями.
* **Контейнеризация:** Docker Compose, мульти-стадийные `Dockerfile`. Веб-сервер Nginx встроен в контейнер фронтенда для проксирования запросов к API, что полностью снимает проблему CORS.

---

## Карта документации

Все проектные требования, спецификации и руководства хранятся в папке [docs/](docs):

| Путь к файлу | Назначение документа |
| :--- | :--- |
| [docs/PROJECT-CONTEXT.md](docs/PROJECT-CONTEXT.md) | Контекст проекта, бизнес-проблематика и цели |
| [docs/STATUS.md](docs/STATUS.md) | Текущий статус разработки и завершённые фазы |
| [docs/product/PRODUCT-SPEC.md](docs/product/PRODUCT-SPEC.md) | Подробное описание продуктовых требований и ролей |
| [docs/architecture/DATA-MODEL.md](docs/architecture/DATA-MODEL.md) | Описание доменных сущностей и структуры складского учёта |
| [docs/architecture/API-CONTRACT.md](docs/architecture/API-CONTRACT.md) | Единый стандарт ответов API, структуры запросов и DTO |
| [docs/architecture/API-ERRORS.md](docs/architecture/API-ERRORS.md) | Полный каталог ошибок и HTTP-статусов системы |
| [docs/deployment/INSTALL.md](docs/deployment/INSTALL.md) | Инструкция по развёртыванию Docker Compose на VPS-сервер |
| [docs/deployment/BACKUP.md](docs/deployment/BACKUP.md) | Настройка регулярного резервного копирования базы данных |

---

## Инструкция по быстрому запуску

### 1. Локальный запуск в режиме разработки (dev)

#### Требования:
* Node.js версии 18 или выше
* Установленный PostgreSQL (или запущенный локальный контейнер с PostgreSQL)

#### Настройка БД:
Создайте файл `.env` в корневом каталоге на основе шаблона `.env.example`:
```bash
DATABASE_URL="postgresql://postgres:password@localhost:5432/visualerp?schema=public"
JWT_SECRET="develop-key-change-me"
```

#### Запуск backend-сервера:
```bash
# Установка зависимостей ядра
npm install

# Применение структуры БД и генерация Prisma-клиента
npx prisma db push
npx prisma generate

# Заполнение БД реалистичными демо-данными
npm run db:seed

# Запуск backend в dev-режиме
npm run dev
```
Интерфейс API будет доступен по адресу `http://localhost:3000`.

#### Запуск frontend-клиента:
В новом терминале:
```bash
cd app
npm install
npm run dev
```
Интерфейс будет доступен по адресу `http://localhost:5173`.

---

### 2. Реалистичные демо-данные
Seed заполняет не только справочники, но и живой демонстрационный сценарий: закупки сырья, перемещения в цех, производственные заказы в разных статусах, выпуск готовой продукции, отгрузки, списания, инвентаризации, складские остатки и журнал действий. Повторный запуск seed очищает только операционные документы демо-организации и создает сценарий заново, поэтому демо можно безопасно переинициализировать.

---

### 2.1. Памятка для показа
В веб-приложение добавлена отдельная красочная инструкция для демонстрации: [app/public/demo-guide.html](app/public/demo-guide.html). При запуске через Docker или временную ссылку Cloudflare она открывается по адресу `/demo-guide.html` и простым языком объясняет, где что находится и как провести показ.

---

### 3. Запуск E2E авто-теста бизнес-процесса
В системе присутствует сквозной автоматический скрипт тестирования [verify_e2e.ts](verify_e2e.ts). Он полностью имитирует действия пользователей: делает закупки сырья, перемещения в цех, запускает рецептурное производство, отгружает товар и проводит аудит склада, сверяя балансы в БД на каждом шаге.

Для запуска теста (при работающем бэкенде):
```bash
npx ts-node verify_e2e.ts
```

---

### 4. Запуск через Docker Compose (Production-ready)
Для имитации полноценного боевого сервера (или развёртывания на VPS):
```bash
# Копирование переменных среды для продакшена
cp .env.production.example .env

# Сборка и запуск контейнеров в фоне
docker compose up --build -d
```
После этого система будет запущена на едином **порту 80** (вход через Nginx с проксированием к API). Вы сможете зайти на `http://localhost`.

Для локального демо-показа удобнее использовать отдельный порт `8080`:
```bash
FRONTEND_PORT=8080 docker compose --env-file .env.production.example up --build -d
docker compose --env-file .env.production.example exec backend npx prisma db push
docker compose --env-file .env.production.example exec backend npm run db:seed:compiled
```

### 5. Быстрая временная ссылка через Cloudflare Tunnel
Для показа MVP внешним пользователям без VPS можно открыть локальный Docker-стек через временную ссылку Cloudflare:
```bash
cloudflared tunnel --no-autoupdate --url http://localhost:8080
```

Cloudflare выдаст временный адрес вида `https://...trycloudflare.com`. Ссылка работает, пока запущены Docker-контейнеры и процесс `cloudflared`.

---

## История фаз и прогресс

* **Фаза 0** — Базовые правила, дорожная карта, стандарты работы агентов.
* **Фаза 1** — Доменная модель, правила расчёта запасов по Ledger, спецификации сущностей.
* **Фаза 2** — База данных. Реализована схема Prisma, индексы и демо-сид данных.
* **Фаза 3** — Спецификации контракта API, каталога ошибок и матрицы доступов.
* **Фаза 4** — Настройка Fastify, логирование запросов, CRUD-справочники мастер-данных.
* **Фаза 5** — Инфраструктурные сервисы: менеджер транзакций БД, нумератор документов, расчёт балансов FIFO/FEFO.
* **Фаза 6** — Документы склада: Закупки сырья, Перемещения, Списания с транзакционными проводками.
* **Фаза 7** — Производство и отгрузки: Заказы на производство, списание по рецептурам BOM с waste-коэффициентами, выпуск готовой продукции, расходные накладные.
* **Фаза 8** — Инвентаризация и складские отчёты: сличительные ведомости, корректировка излишков и недостач, матричные отчёты остатков.
* **Фаза 9** — Интерактивный дашборд руководителя: сводные графики, метрики за месяц, журнал последних событий аудита.
* **Фаза 10** — Детальный план интеграции фронтенда, маппинг экранов прототипа на DTO.
* **Фаза 11** — Интеграция API-клиента на фронтенд, перевод всех 11 экранов в режим реального чтения данных.
* **Фаза 12** — Реализация форм создания и кнопок изменения статуса документов с подтверждениями и сквозными ключами идемпотентности.
* **Фаза 13** — Docker-контейнеризация стека, скрытие паролей в логах (Fastify redaction), написание инструкций по бэкапам, миграциям и восстановлению СУБД.

---

# 🇬🇧 ENGLISH VERSION

## Project Overview

**VisualERP** is a lightweight, visual, and modular ERP system designed for small manufacturing businesses that need clear, transparent operations without enterprise overhead. It helps teams track real stock balances, control raw material inputs, manage batch allocations, plan recipes, and run shipments.

### Target Audiences:
* 🧱 Dry construction mixes (initial pilot case)
* 🧀 Food and beverage workshops (dairies, meat, snacks)
* 🪑 Assembly shops (furniture, wooden items, packaging)
* 👕 Textiles and apparel workshops

---

## Architectural Formula

The project enforces a strict architectural split:
$$\text{VisualERP Core} + \text{Industry Profiles} + \text{Optional Modules}$$

The core engine is industry-agnostic. All specific naming conventions, screen layouts, or measurement units are injected via configuration profiles, keeping the database schema universally reusable.

---

## Business Logic & Stock Accounting

### 📈 Stock Ledger Architecture
Instead of using direct, mutable fields to store quantity numbers, VisualERP uses an immutable **Stock Ledger**:
* Every action (receipt, transfer, write-off, production completion, shipment) writes a record to `StockMovement`.
* Current stock balances at any warehouse or workshop are dynamically derived by summing historical ledger movements.
* This guarantees zero database inconsistency: numbers cannot be modified outside of auditable documents.

### 🔄 Document Lifecycle:
Every business document goes through three strict states:
$$\text{DRAFT} \longrightarrow \text{POSTED} \longrightarrow \text{CANCELLED}$$
Posting runs database ledger adjustments. Cancelling makes compensating reverse movements, but only after asserting that no negative stock balances will occur.

### 🏭 Standard Workflow:
```text
[Purchase Receipt (PR)] ➔ Warehouse Stock ➔ [Transfer to Workshop (TR)] ➔
➔ Workshop Stock ➔ [Production Order (PRD)] ➔ Recipe BOM consumption + Finished Goods output ➔
➔ Finished Product Stock ➔ [Shipment (SHP)]
```

---

## Tech Stack

* **Backend:** Node.js, Fastify (fast, low-overhead web framework), TypeScript.
* **ORM & Database:** Prisma ORM, PostgreSQL database.
* **Validation:** Zod (strict schema validation of payload DTOs on route hooks).
* **Idempotency:** A database-backed `IdempotencyKey` table prevents duplicate actions during network retries.
* **Frontend:** React, TypeScript, Vite. A responsive layout featuring interactive cards, shimmers, and micro-animations.
* **Docker Infrastructure:** Multi-stage Dockerfiles and `docker-compose.yml` configuration. Nginx is embedded within the frontend container to reverse proxy `/api` calls, preventing CORS errors.

---

## Documentation Map

Full details on specifications, schemas, and requirements are structured in the [docs/](docs) directory:

| Document Path | Description |
| :--- | :--- |
| [docs/PROJECT-CONTEXT.md](docs/PROJECT-CONTEXT.md) | Business background, motivations, and goals |
| [docs/STATUS.md](docs/STATUS.md) | Current project completion status |
| [docs/product/PRODUCT-SPEC.md](docs/product/PRODUCT-SPEC.md) | Product specs, user roles, and workflows |
| [docs/architecture/DATA-MODEL.md](docs/architecture/DATA-MODEL.md) | Core database entities and stock ledger specifications |
| [docs/architecture/API-CONTRACT.md](docs/architecture/API-CONTRACT.md) | Unified REST API formats and request/response envelopes |
| [docs/architecture/API-ERRORS.md](docs/architecture/API-ERRORS.md) | Complete catalog of application errors and HTTP statuses |
| [docs/deployment/INSTALL.md](docs/deployment/INSTALL.md) | Guide for single-port Docker Compose VPS deployment |
| [docs/deployment/BACKUP.md](docs/deployment/BACKUP.md) | Guide for setting up automated db backups and dumps |

---

## Quick Start Guide

### 1. Running Locally in Development Mode

#### Prerequisites:
* Node.js version 18 or higher
* PostgreSQL database instance running locally or via Docker

#### Database Configuration:
Create a `.env` file in the root directory based on `.env.example`:
```bash
DATABASE_URL="postgresql://postgres:password@localhost:5432/visualerp?schema=public"
JWT_SECRET="develop-key-change-me"
```

#### Starting the Backend:
```bash
# Install core workspace packages
npm install

# Push database schema & generate Prisma client
npx prisma db push
npx prisma generate

# Populate database with realistic demo data
npm run db:seed

# Launch backend dev server
npm run dev
```
The API backend will run at `http://localhost:3000`.

#### Starting the Frontend:
In a new terminal tab:
```bash
cd app
npm install
npm run dev
```
The React frontend will be accessible at `http://localhost:5173`.

---

### 2. Realistic Demo Data
The seed script now creates a full demo story, not only dictionaries: raw material receipts, warehouse-to-workshop transfers, production orders in multiple states, finished goods output, shipments, write-offs, inventory audits, stock balances, and audit log events. Re-running the seed clears only operational demo documents for the demo organization and recreates the scenario from scratch.

---

### 2.1. Demo Walkthrough Guide
The web app includes a standalone visual walkthrough for stakeholders: [app/public/demo-guide.html](app/public/demo-guide.html). In Docker or Cloudflare demo mode it is available at `/demo-guide.html` and explains the demo flow in plain Russian.

---

### 3. Running the E2E Validation Script
We ship a programmatic E2E script [verify_e2e.ts](verify_e2e.ts) in the workspace root. It runs a full factory cycle (materials receipt, transfer, recipe completion with waste, shipment, inventory audit adjustments) and validates data accuracy:
```bash
npx ts-node verify_e2e.ts
```

---

### 4. Production Deployment with Docker Compose
To run the full stack as a unified containerized system:
```bash
# Setup production environment template
cp .env.production.example .env

# Build and start services in detached mode
docker compose up --build -d
```
The application will serve static assets and proxy API endpoints on host **port 80**. Access it at `http://localhost`.

For a local demo session, use port `8080`:
```bash
FRONTEND_PORT=8080 docker compose --env-file .env.production.example up --build -d
docker compose --env-file .env.production.example exec backend npx prisma db push
docker compose --env-file .env.production.example exec backend npm run db:seed:compiled
```

### 5. Quick Temporary Link with Cloudflare Tunnel
To share the MVP without touching a VPS, expose the local Docker stack through a temporary Cloudflare URL:
```bash
cloudflared tunnel --no-autoupdate --url http://localhost:8080
```

Cloudflare will print a temporary `https://...trycloudflare.com` address. The link works while Docker and `cloudflared` are running.

---

## Phase Progress & Roadmap

* **Phase 0** — Repository layout, roadmaps, coding rules, and constraints setup.
* **Phase 1** — Universal domain model, multi-tenancy design, and stock ledger specs.
* **Phase 2** — Prisma PostgreSQL schemas, indices, and sample seeding datasets.
* **Phase 3** — REST API contracts, standard success/error wrappers, and role matrices.
* **Phase 4** — Fastify server setup, global tenant hook wrappers, and core master CRUD controllers.
* **Phase 5** — Database transactional manager, ledger balance calculator, and in-process Event Bus.
* **Phase 6** — Purchase Receipts, Transfers, and Write-off transactional routes.
* **Phase 7** — Production completion (BOM recipes component consumption + output) and Shipment documents.
* **Phase 8** — Inventory Audits page, counted adjustments, and stock reports.
* **Phase 9** — Dashboard page backend aggregation, E2E curl script demo guides.
* **Phase 10** — Frontend integration design mapping React screens to REST routes.
* **Phase 11** — Shared fetch client, envelope parsers, organization switcher, and read-only screens.
* **Phase 12** — Creation forms, dynamic option lists, and action mutations with idempotency.
* **Phase 13** — Docker configurations (Fastify + Nginx reverse proxy), Fastify log redactions, VPS installation guides, backup scripts, and pilot checklists.
* **Phase 14 (Next Phase)** — User JWT sessions, password hashing, and endpoint roles security middleware.
