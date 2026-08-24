# Operra Nexus — Enterprise Inventory & POS Management Platform

An enterprise-grade, full-stack Inventory Management and Point-of-Sale (POS) platform engineered with **TypeScript**, **React 19**, **tRPC v11**, **Drizzle ORM**, and **Tailwind CSS v4**.

Designed for high-throughput retail, warehouse logistics, and supply chain operations with real-time stock safeguards, audit logging, and financial telemetry.

---

## ✨ Features & Capabilities

### ⚡ 1. Real-Time Command Center & Dashboard
- **Operational Telemetry**: Real-time KPI pods tracking Gross Sales Revenue, Low-Stock Alerts, SKU Catalog count, and Total Daily Transactions.
- **Dynamic Ledger Feed**: Live recent transaction streaming with walk-in customer attribution.
- **Low-Stock Radar**: Automatic warning alerts for items at or below the safety threshold.

### 📦 2. Comprehensive Product Catalogue
- **SKU & Variant Management**: Full lifecycle management for products, barcodes, SKUs, categories, and unit pricing.
- **Supplier Linkages**: Direct relational mapping of products to authorized supplier partners.
- **Instant Search & Multi-Filters**: Debounced search by title/SKU, category filtering, low-stock filter toggles, and ascending/descending column sorting.

### 💳 3. Multi-Line POS Checkout & Sales Ledger
- **Point-of-Sale Terminal**: Dynamic multi-item checkout with live subtotal calculation.
- **Inventory Safeguards**: Transaction-level checks preventing stock overdrafts.
- **Audit-Ready History**: Searchable and filterable sales ledger with customer references, staff attribution, and timestamps.

### 🔄 4. Stock Movement & Inventory Audit Trail
- **Directional Movement Tracking**: Inbound stock deliveries (`+`) and outbound manual adjustments (`−`).
- **Balance Change Auditing**: Transparent `Before → After` quantity transitions.
- **Reason & Batch Annotation**: Detailed tracking for restocks, damages, count corrections, and returns.

### 🏢 5. Supplier & Vendor Partner Directory
- **Vendor Profiles**: Contact names, verified business emails, phone numbers, and physical facility addresses.
- **Associated Inventory**: Automatic tracking of active product catalog lines associated with each supplier.

### 📊 6. Analytics & Intelligence Reports
- **Revenue Velocity**: Interactive Recharts area chart illustrating daily sales revenue over customizable time windows.
- **Demand Ranking**: Ranked horizontal bar charts displaying top-selling products by SKU volume.
- **Net Inventory Dynamics**: Daily balance change trends monitoring warehouse throughput.

### 🔒 7. Role-Based Access Control (RBAC) & Security
- **Three-Tier Privilege Model**:
  - **Administrator**: Full system authority, team privilege management, and safety threshold configuration.
  - **Manager**: Inventory adjustments, catalog curation, supplier contracts, and analytical reports.
  - **Staff**: Point-of-sale customer checkout and catalog lookup.
- **Configurable Safety Thresholds**: Dynamic global low-stock quantity trigger.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | React 19 (SPA with Wouter routing) |
| **Styling & Design System** | Tailwind CSS v4, Lucide Icons, Radix UI Primitives |
| **Typography** | Plus Jakarta Sans, Outfit, JetBrains Mono |
| **Data Visualizations** | Recharts v2.15 |
| **API Layer** | tRPC v11 (End-to-end type safety) & React Query (@tanstack/react-query v5) |
| **Backend Runtime** | Node.js with Express & TSX |
| **ORM & Database** | Drizzle ORM with MySQL2 driver |
| **Validation** | Zod v4 (Schema & Input validation) |
| **Testing** | Vitest v2.1 (21/21 Unit & Integration tests) |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0+ or v20.0+ recommended
- **npm** / **pnpm** / **yarn**

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/usamahassan-IT/Inventory-Sales-Management.git
   cd Inventory-Sales-Management
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory:
   ```env
   PORT=3000
   NODE_ENV=development
   DATABASE_URL=mysql://user:password@localhost:3306/inventory_db
   ```

4. **Launch Development Server**:
   ```bash
   npm run dev
   ```
   The application will be accessible at [http://localhost:3000/](http://localhost:3000/).

---

## 🧪 Testing & Code Quality

Run the comprehensive automated test suite (includes authentication guards, inventory security, procedure contracts, sorting, and UI recovery tests):

```bash
# Run Vitest test suite
npm test

# Run TypeScript typecheck
npm run check
```

---

## 📁 Repository Structure

```
inventory-sales-management/
├── client/                     # Frontend client application
│   ├── src/
│   │   ├── _core/              # Core authentication & hooks
│   │   ├── components/         # Shared UI components & layout primitives
│   │   ├── contexts/           # Theme (Light/Dark) context
│   │   ├── lib/                # tRPC & React Query client configuration
│   │   ├── pages/              # 7 primary application views
│   │   ├── App.tsx             # Root router & route guards
│   │   ├── index.css           # Modern CSS tokens & design system
│   │   └── main.tsx            # Application entry point
│   └── index.html              # HTML shell & font imports
├── server/                     # Backend tRPC server & routers
│   ├── _core/                  # Express server & tRPC context
│   ├── routers/                # Procedures for products, sales, stock, suppliers, settings
│   └── *.test.ts               # Vitest automated test suites
├── shared/                     # Shared database schemas & Zod validators
├── drizzle/                    # Drizzle migrations & schema artifacts
└── README.md                   # Project documentation
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
