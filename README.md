# ⚡ AI Automation Request & Prioritization Platform

[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.0-47A248?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)

An enterprise-grade internal platform designed to collect, evaluate, calculate ROI, and stack-rank AI automation requests across departments using a multi-agent AI intake workflow and a deterministic calculation engine.

---

## 🌟 Key Features

### 💬 1. Interactive Multi-Agent AI Intake Interview
- **8-Stage Conversational Agent**: Guides non-technical requesters step-by-step through business problem definition, current workflow steps, existing tools, pain points, metrics, ROI inputs, compliance rules, and review.
- **Document & PDF Attachment Parser**: Staged document chips allow requesters to attach workflow PDFs/docs which are text-parsed and injected into the AI context upon clicking Send.
- **Dynamic Slot Filling & Validation**: Real-time progress tracker validates collected requirements before enabling stage completion.

### 📈 2. Deterministic ROI Calculation Engine
- **Accurate Financial Formulas**:
  - `Annual Hours Saved` = `Hours / Occurrence` × `Frequency / Year` × `People Involved`
  - `Annual $ Saved` = `Annual Hours Saved` × `Department Loaded Hourly Rate`
  - `Build Cost Estimate` = `T-Shirt Size Hours` × `Engineering Hourly Rate` ($150/hr)
  - `Simple ROI %` = `(Annual $ Saved − Build Cost) / Build Cost`
  - `Payback Months` = `(Build Cost / Annual $ Saved) × 12`
- **Configurable Settings**: Admins can customize loaded labor rates per department ($45/hr to $85/hr) and T-shirt size hour ranges (**S**: 20-40h, **M**: 40-100h, **L**: 100-250h, **XL**: 250-500h).

### ⚖️ 3. 6-Factor Weighted Priority Scoring
- **0–100 Priority Formula**: Combines **ROI ($ Saved)**, **Strategic Value**, **Urgency**, **Organizational Impact**, **Effort Cost**, and **Risk Level** with confidence multipliers (**HIGH**: 1.0x, **MEDIUM**: 0.85x, **LOW**: 0.70x).
- **Priority Tiers**: Categorizes requests into **Critical** (≥70), **High** (50-69), **Medium** (30-49), and **Low** (<30).

### 🛠️ 4. Engineering Admin Console & Overrides
- **Backlog Dashboard** (`/admin/requests`): Track requests through pipeline statuses (`submitted`, `ai_reviewing`, `engineering_review`, `approved`, `in_development`, `completed`).
- **Interactive Review Panel** (`/admin/requests/[id]`):
  - **Priority Score Gauge**: Real-time visual ROI and score indicator.
  - **Manual Override Controls**: Adjust labor rates, hour ranges, and 1-5 strategic sliders with instant score recalculation.
  - **Comment Discussion Thread**: Live dark glass comment thread supporting author avatars and `@mentions`.
  - **Audit History**: Complete timestamped log of status changes and estimate modifications.

### 👁️ 5. Company-Wide Transparency Ledger
- **Public Request Ledger** (`/ledger`): Empowers all employees to search across departments, view status badges, inspect ROI metrics, and **stack-rank requests by priority score**.

### 🔍 6. AI Duplicate Detection Engine
- Vector & similarity detection agent automatically compares new intake proposals against existing backlog items to prevent duplicate engineering effort.

---

## 🎨 Design System & Aesthetics

Built adhering to the **Dark Stitch Glassmorphism Theme**:
- **Canvas Background**: Sleek dark space (`#13131b`)
- **Container Surfaces**: Glassmorphic panels (`#191924`/80 with 30% border opacity)
- **Primary Accents**: Vibrant periwinkle & indigo gradients (`from-indigo-600 to-[#8083ff]`)
- **Typography**: Google Fonts **Outfit** for headers & **Inter** for body text

---

## 🏗️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Server Actions & Turbopack)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) & Vanilla CSS custom tokens
- **Database**: [MongoDB](https://www.mongodb.com/) via [Mongoose ORM](https://mongoosejs.com/)
- **Authentication**: [NextAuth.js](https://next-auth.js.org/) (Credentials Provider with `bcryptjs`)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Testing**: [Vitest](https://vitest.dev/)

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+ or Bun
- Local or MongoDB Atlas URI

### 2. Installation & Setup

Clone the repository and install dependencies:

```bash
git clone https://github.com/Rishu7011/ai-automation-request-platform.git
cd ai-automation-request-platform/frontend
npm install
```

### 3. Environment Configuration

Create a `.env` file inside the `frontend` directory:

```env
MONGODB_URI=mongodb://localhost:27017/ai-automation
NEXTAUTH_SECRET=your-random-secret-key-here
NEXTAUTH_URL=http://localhost:3000

INITIAL_ADMIN_EMAIL=admin@internal.com
INITIAL_ADMIN_PASSWORD=AdminPass123!
```

### 4. Seed Database (Optional)

Populate default system settings (effort ranges, blended rates, and priority weights):

```bash
npx tsx scripts/seed.ts
```

### 5. Run Development Server

```bash
npm run dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing

Run unit tests for the deterministic calculation engine and duplicate detection agent:

```bash
npx vitest run
```

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
