<div align="center">

  <h1>🤖 AI Automation Request Platform</h1>

  ### Enterprise AI Agent Workflow & Automation Request Management System

  <p align="center">
    A flagship full-stack platform enabling organizations to submit, triage, execute, and monitor AI automation workflows. Built with Next.js 16, React 19, LangChain, LangGraph stateful agent graphs, Anthropic Claude SDK, and MongoDB.
  </p>

  <p align="center">
    <a href="#-key-features"><strong>Key Features »</strong></a>
    &nbsp;•&nbsp;
    <a href="#%EF%B8%8F-tech-stack"><strong>Tech Stack</strong></a>
    &nbsp;•&nbsp;
    <a href="#-architecture"><strong>Architecture</strong></a>
    &nbsp;•&nbsp;
    <a href="#-quick-start"><strong>Quick Start</strong></a>
  </p>

  <br />

  <!-- Badges -->
  <img src="https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/LangChain-v1-1C3C3C?style=for-the-badge&logo=langchain&logoColor=white" alt="LangChain" />
  <img src="https://img.shields.io/badge/LangGraph-Agent_Workflow-0052CC?style=for-the-badge" alt="LangGraph" />
  <img src="https://img.shields.io/badge/Anthropic-Claude_3.5-D97706?style=for-the-badge&logo=anthropic&logoColor=white" alt="Anthropic Claude" />
  <img src="https://img.shields.io/badge/MongoDB-Mongoose_v9-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />

</div>

---

## 🌟 Key Features

<div align="center">
<table>
  <tr>
    <td width="50%">
      <h3 align="center">🕸️ LangGraph Agent Workflows</h3>
      <p>Stateful multi-actor agent graph execution using LangGraph, Anthropic Claude SDK, and Groq LLMs for complex task automation.</p>
    </td>
    <td width="50%">
      <h3 align="center">📝 Request Intake & Triage</h3>
      <p>Rich automation request submission form with urgency scoring, asset upload attachments, and automated priority triage routing.</p>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <h3 align="center">📊 Real-Time Execution Telemetry</h3>
      <p>Step-by-step visual timeline of agent reasoning, token usage analytics, and latency monitoring logs.</p>
    </td>
    <td width="50%">
      <h3 align="center">🔐 NextAuth v5 & RBAC Security</h3>
      <p>Role-based access control with MongoDB adapter session storage, bcryptjs encryption, and secure API middleware.</p>
    </td>
  </tr>
</table>
</div>

---

## 🛠️ Tech Stack & Architecture

| Layer | Technology | Description |
|---|---|---|
| **Framework** | Next.js 16 (App Router + Server Actions) | React 19 server-side rendering and API routes |
| **Agent Engine** | [LangGraph](https://langchain-ai.github.io/langgraph/) + [LangChain](https://www.langchain.com/) | Stateful agent graphs, tool calling & memory |
| **LLM Providers** | [Anthropic Claude SDK](https://www.anthropic.com/) + Groq LLM | High-precision reasoning and fast inference |
| **Database** | [MongoDB](https://www.mongodb.com/) + Mongoose v9 | Request logs, agent execution state & user sessions |
| **Auth** | [NextAuth.js v5](https://next-auth.js.org/) + `@auth/mongodb-adapter` | Session token storage & RBAC middleware |
| **Styling & Motion** | Tailwind CSS v4 + Motion + GSAP | Dark mode UI with GSAP scroll entrance animations |

---

## 📂 Project Architecture

```bash
ai-automation-request-platform/
├── frontend/
│   ├── src/
│   │   ├── app/                # Next.js App Router (dashboard, requests, admin)
│   │   ├── components/         # Request cards, agent status loaders, charts
│   │   ├── lib/                # LangGraph agent workflows, Anthropic client
│   │   └── models/             # Mongoose schemas for Requests, Users, Logs
│   ├── package.json
│   └── tailwind.config.ts
└── docs/                       # Architecture diagrams & API endpoints
```

---

## 🚀 Quick Start Guide

### 1. Installation
```bash
git clone https://github.com/Rishu7011/ai-automation-request-platform.git
cd ai-automation-request-platform/frontend
npm install
```

### 2. Environment Setup
Create `.env.local` in the `frontend/` directory:
```env
MONGODB_URI=your_mongodb_connection_string
AUTH_SECRET=your_nextauth_secret
ANTHROPIC_API_KEY=your_anthropic_claude_api_key
GROQ_API_KEY=your_groq_api_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for details.

<div align="center">
  <sub>Powering enterprise productivity through intelligent AI automation.</sub>
</div>
