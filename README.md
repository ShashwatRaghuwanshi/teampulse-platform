# TeamPulse: Internal Corporate Wellness and Consistency Platform

## 1. Executive Summary & Business Goal
**TeamPulse** is an enterprise corporate wellness and team engagement platform that enables employees to build healthy daily habits, receive smart timing recommendations, and compete in team challenges without exposing personal wellness data broadly across the organization. Managers are strictly restricted to viewing anonymized, aggregated team-level trends.

---

## 2. System Architecture Overview

TeamPulse is architected across three integrated pillars:
1. **Event-Driven Microservices Backend (Node.js / Express + AWS Lambda)**
2. **Modular Reactive Frontend (SvelteKit with Svelte 5 Runes + Reusable Web Components)**
3. **Zero-Trust AWS Cloud Infrastructure (3-Tier VPC, ALB, ECS Fargate, RDS, DynamoDB, EventBridge)**

### 2.1 High-Level Architecture Diagram (Mermaid)
```mermaid
graph TB
    subgraph Public_Internet ["Client Layer & CDN"]
        User["Employee / Manager / Admin Browser"]
        S3["Amazon S3 Static Hosting (SvelteKit SPA + Web Components)"]
    end

    subgraph AWS_VPC ["AWS VPC (10.0.0.0/16)"]
        subgraph Public_Subnets ["Public Subnets (10.0.1.0/24, 10.0.2.0/24)"]
            ALB["Application Load Balancer (HTTPS/TLS)"]
        end

        subgraph Private_App_Subnets ["Private Application Subnets (Amazon ECS Fargate & Lambda)"]
            Identity["Identity Service (:3001)"]
            Habit["Habit Service (:3002)"]
            Challenge["Challenge Service (:3003)"]
            EventTrack["Event Tracking Service (:3004)"]
            Insight["Insight Service (:3005)"]
            Recommend["Recommendation Service (:3006)"]
            Notify["Notification Service (:3007)"]
            EB["AWS EventBridge Custom Bus"]
            Lambda["AWS Lambda (Streak, Badge & Analytics Processor)"]
        end

        subgraph Private_Data_Subnets ["Private Data Subnets & VPC Endpoints"]
            RDS[("Amazon RDS (PostgreSQL)\nTransactional Data")]
            DDB[("Amazon DynamoDB\nAggregated Analytics & Recommendations")]
        end
    end

    User -->|Loads UI| S3
    User -->|HTTPS REST API + JWT| ALB
    ALB --> Identity & Habit & Challenge & EventTrack & Insight & Recommend & Notify
    Identity & Habit & Challenge & EventTrack --> RDS
    EventTrack -->|Publishes ActivityCompleted / ActivityMissed| EB
    EB -->|Triggers| Lambda
    EB -->|Triggers| Recommend
    EB -->|Triggers| Notify
    Lambda -->|Updates Streaks & Badges| RDS
    Lambda -->|Writes Anonymized Team Rollups| DDB
    Insight -->|Reads Aggregated Trends| DDB
    Recommend -->|Reads/Writes Timing Models| DDB
    Recommend -->|Updates Habit Schedule on Accept| Habit