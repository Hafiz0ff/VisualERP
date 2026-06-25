# Frontend Permissions

This document defines the Role-Based Access Control (RBAC) behavior on the frontend. It maps the granular permission codes to UI visibility, disabling rules, and role-specific workspaces.

---

## 1. UI Enforcement Policy

While the backend is the absolute authority for permission checks, the UI should proactively tailor the user experience based on the active user's permissions:

1. **Permission check wrapper**:
   - Wrap interactive controls or menu items in an authorization wrapper (e.g., `<RequirePermission permission="purchase_receipts:post">`).
2. **Hide vs. Disable**:
   - **Hide**: Entire navigation sidebar links (e.g., hiding "Settings" if the user lacks `settings:manage`, hiding "Audit Log" if lacking `audit_log:read`).
   - **Disable**: Individual action buttons inside a visible context (e.g., showing the Purchase Receipt details page, but rendering the "Post" button as greyed out with a lock icon if lacking `purchase_receipts:post`).

---

## 2. Predefined Workspaces by Role

To streamline operations, the UI dashboard can adapt its home display layout based on the user's primary role:

### 2.1 Owner / Director / Auditor (Read-Only Mode)
* **Access Summary**: Focus on high-level analytics and security logs.
* **UI Customization**:
  - Home displays the complete KPI Dashboard cards and charts.
  - Can navigate all documents and reports.
  - Interactive write buttons (Add, Edit, Post, Cancel) are hidden or disabled (for Auditor).
  - Can access the Audit Log screen.

### 2.2 Warehouse Manager Workspace
* **Access Summary**: Focus on stock ingestion, transfers, and counts.
* **UI Customization**:
  - Home shows shortcuts to Purchase Receipts, Transfers, Write-offs, and Inventory Audits.
  - Dashboard stats focus on current stock balances and draft document counts. Low-stock warnings stay empty until minimum stock thresholds are modeled.
  - Can edit and post warehouse documents.
  - Production module navigation sidebar items are hidden.

### 2.3 Workshop Master Workspace
* **Access Summary**: Focus on recipe compliance and manufacturing completion.
* **UI Customization**:
  - Home shows shortcuts to Production Orders and BOMs/Recipes.
  - Dashboard stats focus on planned orders, active components shortages, and monthly production volumes.
  - Can view transfers (to receive materials) and write-offs (to register workshop damages).
  - Ingestion (Purchase Receipts) and shipment sides are hidden in the sidebar.

### 2.4 Shipment Manager Workspace
* **Access Summary**: Focus on sales orders shipping.
* **UI Customization**:
  - Home shows shortcuts to Shipments, Customers list, and Stock Balances.
  - Dashboard stats focus on pending deliveries counts and customer dispatch history.
  - Can edit, ship, and cancel shipments.
  - Production and Purchase parts of the system are hidden.
