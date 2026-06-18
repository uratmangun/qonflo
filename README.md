# AI IDE Template

A starter template for AI-assisted development with standardized rules, skills, and OpenSpec workflows.

## Clone this template

```bash
gh repo create my-new-repo --template uratmangun/ai-ide-template --private --clone
```

## What's included

- `.agents/skills/` — agent skills for AI SDK, Cloudflare, OpenSpec, and more
- `.cursor/` and `.opencode/` — IDE rules and commands
- `openspec/` — change proposals and archived specs
- `scripts/` — skill lock and harness utilities

## Skills

Update skill harnesses:

```bash
./scripts/skills-update-harnesses.sh
```

Create or refresh the skills lock file:

```bash
./scripts/skills-create-lock.sh
```

## TaskFlow

Mini task manager prototype with Express + SQLite backend and React frontend.

### Features

- Create, update, and delete tasks
- Task statuses: `to_do`, `pending`, `in_progress`, `done`
- Hardcoded acting-user dropdown (no auth)
- Immutable audit log with search and field filters
- Backend status-flow validation
- Idempotent status updates (same status does not create a new audit log)
- Only the task creator can update or delete a task

### Status flow

```
to_do → pending → in_progress → done
pending ↔ to_do
in_progress ↔ pending
```

`done` is terminal.

### Stack

- Backend: Express + TypeScript + SQLite (`better-sqlite3`)
- Frontend: React + TypeScript + Vite

### Run

```bash
pnpm install
pnpm dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3001

### Test

```bash
pnpm test
```

### API

- `GET /api/tasks/users`
- `GET /api/tasks`
- `POST /api/tasks`
- `PATCH /api/tasks/:id`
- `DELETE /api/tasks/:id`
- `GET /api/audit-logs?q=&field=all|name|status|date|description`

All write operations require `actingUser` in the request body.

Jawaban atas pertanyaan:

Bagaimana kamu memastikan audit log tidak ter-modifikasi?

hanya ada operasi insert ke sqlite tidak ada update dan delete

Bagian mana dari solusi ini yang paling berisiko jika digunakan oleh banyak user?

pastinya baguan auth karena jika user bisa mengakses auth dia bisa mengubah apa saja

Jika task ini berkembang menjadi sistem besar, bagian mana yang akan kamu refactor terlebih dahulu dan kenapa?

untuk saat ini saya menggunakan sqlite jadi database akan saya ubah ke postgres misal atau database yang bisa mengelola banyak user dengan baik dan yang pasti authentikasi karena itu bagian yang critical karena jika salah akab berakibat fatal

Jika kamu menggunakan AI, jelaskan bagian mana yang dibantu AI dan bagaimana kamu memvalidasinya.

hampir semuanya saya menggunakan ai saya mengetes satu persatu secara manual dan dengan bantuan cursor dan embedded cursor browser juga supaya tahu kalau semua fungsi berjalan dengan benar