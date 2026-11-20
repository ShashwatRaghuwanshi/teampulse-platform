# TeamPulse: Local Setup Guide (Docker Compose)

This guide provides step-by-step instructions to build, run, and verify the complete **TeamPulse** platform locally using Docker Compose.

---

## 1. Prerequisites
Ensure the following tools are installed on your machine:
* **Docker Desktop** (v24+ with `docker compose` enabled) — Make sure Docker Desktop is running!
* **Node.js** (v20+ LTS, optional if running frontend outside Docker)
* **Git**

---

## 2. Architecture Running in Docker Compose

Running `docker compose up --build` launches the complete local cloud simulation:

| Container Name | Local Port | Simulates AWS Service | Role |
| :--- | :--- | :--- | :--- |
| `teampulse-postgres` | `5432` | **Amazon RDS (PostgreSQL)** | Transactional storage for users, habits, challenges, and raw activity logs. |
| `teampulse-dynamodb` | `8000` | **Amazon DynamoDB** | High-throughput storage for anonymized manager analytics & timing recommendations. |
| `api-gateway` | `8080` | **AWS Application Load Balancer (ALB)** | Single entry point routing `/api/*` paths to private backend microservices. |
| `identity-service` | `3001` | **Amazon ECS Service** | Employee/Manager registration, login, and RBAC JWT issuance. |
| `habit-service` | `3002` | **Amazon ECS Service** | CRUD for private and team wellness habits & scheduled times. |
| `challenge-service` | `3003` | **Amazon ECS Service** | Team competitions, participant joining, and leaderboards. |
| `event-tracking-service` | `3004` | **Amazon ECS Service** | Logs `COMPLETED`/`DONE`/`MISSED` events to RDS and publishes to EventBridge. |
| `insight-service` | `3005` | **Amazon ECS Service** | Serves personal metrics to Employees and strictly aggregated trends to Managers. |
| `recommendation-service` | `3006` | **Amazon ECS Service** | Generates personalized timing recommendations and updates habit schedules on accept. |
| `notification-service` | `3007` | **Amazon ECS Service** | Stores and dispatches streak reminders, badge alerts, and schedule notifications. |
| `lambda-workers` | `3008` | **AWS EventBridge + AWS Lambda** | Asynchronous event processor calculating streaks, badges, and team rollups. |
| `frontend` | `5173` | **Amazon S3 Hosting (SvelteKit)** | SvelteKit (Svelte 5 Runes) dashboard + 4 Custom Web Components. |

---

## 3. Step-by-Step Instructions to Run Locally

### Step 1: Clone the Repository
```bash
git clone https://github.com/ShashwatRaghuwanshi/teampulse-platform
cd teampulse-platform