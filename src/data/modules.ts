export interface ModuleSeed {
  module_name: string;
  category: string;
  group: string;
  dependencies: string[];
  description?: string;
}

// Seed catalog — easily extendable. Keep this as the single source of truth
// for the module library. The store derives ids, codes, status from this list.
export const MODULE_SEED: ModuleSeed[] = [
  // Accounting & Finance
  { module_name: "Chart of Account", category: "Accounting & Finance", group: "Finance", dependencies: [] },
  { module_name: "General Ledger", category: "Accounting & Finance", group: "Finance", dependencies: ["Chart of Account"] },
  { module_name: "Journal Entries", category: "Accounting & Finance", group: "Finance", dependencies: ["General Ledger"] },
  { module_name: "Cash Flow Statement", category: "Accounting & Finance", group: "Finance", dependencies: ["General Ledger"] },
  { module_name: "Balance Sheet", category: "Accounting & Finance", group: "Finance", dependencies: ["General Ledger"] },
  { module_name: "Profit & Loss", category: "Accounting & Finance", group: "Finance", dependencies: ["General Ledger"] },
  { module_name: "Trial Balance", category: "Accounting & Finance", group: "Finance", dependencies: ["General Ledger"] },
  { module_name: "AP Aging", category: "Accounting & Finance", group: "Finance", dependencies: ["General Ledger"] },
  { module_name: "AR Aging", category: "Accounting & Finance", group: "Finance", dependencies: ["General Ledger"] },
  { module_name: "Taxes", category: "Accounting & Finance", group: "Finance", dependencies: [] },
  { module_name: "Bank Reconciliation", category: "Accounting & Finance", group: "Finance", dependencies: ["General Ledger"] },
  { module_name: "Fixed Assets", category: "Accounting & Finance", group: "Finance", dependencies: ["General Ledger"] },
  { module_name: "Budgeting", category: "Accounting & Finance", group: "Finance", dependencies: [] },
  { module_name: "Cost Center", category: "Accounting & Finance", group: "Finance", dependencies: [] },
  { module_name: "Financial Reporting", category: "Accounting & Finance", group: "Finance", dependencies: ["General Ledger"] },

  // HRIS & Payroll
  { module_name: "Employee Profile", category: "HRIS & Payroll", group: "HRIS", dependencies: [] },
  { module_name: "Organization Structure", category: "HRIS & Payroll", group: "HRIS", dependencies: [] },
  { module_name: "Employee Attendance", category: "HRIS & Payroll", group: "HRIS", dependencies: ["Employee Profile"] },
  { module_name: "Leave Management", category: "HRIS & Payroll", group: "HRIS", dependencies: ["Employee Profile"] },
  { module_name: "Shift Schedule", category: "HRIS & Payroll", group: "HRIS", dependencies: ["Employee Profile"] },
  { module_name: "Overtime", category: "HRIS & Payroll", group: "HRIS", dependencies: ["Employee Attendance"] },
  { module_name: "Payroll (Payslip)", category: "HRIS & Payroll", group: "Payroll", dependencies: ["Employee Profile"] },
  { module_name: "Tax Calculation (PPh21)", category: "HRIS & Payroll", group: "Payroll", dependencies: ["Payroll (Payslip)"] },
  { module_name: "BPJS Management", category: "HRIS & Payroll", group: "Payroll", dependencies: ["Payroll (Payslip)"] },
  { module_name: "Reimbursement", category: "HRIS & Payroll", group: "HRIS", dependencies: ["Employee Profile"] },
  { module_name: "Recruitment", category: "HRIS & Payroll", group: "HRIS", dependencies: [] },
  { module_name: "Performance Review", category: "HRIS & Payroll", group: "HRIS", dependencies: ["Employee Profile"] },
  { module_name: "Training & Development", category: "HRIS & Payroll", group: "HRIS", dependencies: ["Employee Profile"] },

  // Logistics & Cargo
  { module_name: "Cargo Booking", category: "Logistics & Cargo", group: "Cargo", dependencies: [] },
  { module_name: "Airwaybill Stocks", category: "Logistics & Cargo", group: "Cargo", dependencies: [] },
  { module_name: "Shipment Update", category: "Logistics & Cargo", group: "Cargo", dependencies: ["Cargo Booking"] },
  { module_name: "Cargo Manifest", category: "Logistics & Cargo", group: "Cargo", dependencies: ["Cargo Booking"] },
  { module_name: "Freight Invoice", category: "Logistics & Cargo", group: "Cargo", dependencies: ["Cargo Booking"] },
  { module_name: "Tracking Portal", category: "Logistics & Cargo", group: "Cargo", dependencies: ["Cargo Booking"] },
  { module_name: "Customer Pickup", category: "Logistics & Cargo", group: "Cargo", dependencies: ["Cargo Booking"] },
  { module_name: "Route Planning", category: "Logistics & Cargo", group: "Cargo", dependencies: [] },

  // Inventory & Warehouse
  { module_name: "Inventory", category: "Inventory & Warehouse", group: "Inventory", dependencies: [] },
  { module_name: "Stock Adjustment", category: "Inventory & Warehouse", group: "Inventory", dependencies: ["Inventory"] },
  { module_name: "Stock Transfer", category: "Inventory & Warehouse", group: "Inventory", dependencies: ["Inventory"] },
  { module_name: "Warehouse Locations", category: "Inventory & Warehouse", group: "Warehouse", dependencies: [] },
  { module_name: "Bin Management", category: "Inventory & Warehouse", group: "Warehouse", dependencies: ["Warehouse Locations"] },
  { module_name: "Stock Opname", category: "Inventory & Warehouse", group: "Inventory", dependencies: ["Inventory"] },
  { module_name: "Serial / Lot Tracking", category: "Inventory & Warehouse", group: "Inventory", dependencies: ["Inventory"] },

  // Procurement
  { module_name: "Purchase Requisition", category: "Procurement", group: "Procurement", dependencies: [] },
  { module_name: "Purchase Orders", category: "Procurement", group: "Procurement", dependencies: ["Purchase Requisition"] },
  { module_name: "Goods Receipt", category: "Procurement", group: "Procurement", dependencies: ["Purchase Orders"] },
  { module_name: "Vendor Management", category: "Procurement", group: "Procurement", dependencies: [] },
  { module_name: "RFQ Management", category: "Procurement", group: "Procurement", dependencies: ["Vendor Management"] },
  { module_name: "Vendor Invoice", category: "Procurement", group: "Procurement", dependencies: ["Goods Receipt"] },

  // Project Management
  { module_name: "Projects", category: "Project Management", group: "Project", dependencies: [] },
  { module_name: "Tasks", category: "Project Management", group: "Project", dependencies: ["Projects"] },
  { module_name: "Milestones", category: "Project Management", group: "Project", dependencies: ["Projects"] },
  { module_name: "Timesheet", category: "Project Management", group: "Project", dependencies: ["Projects"] },
  { module_name: "Project Billing", category: "Project Management", group: "Project", dependencies: ["Projects", "Timesheet"] },
  { module_name: "Gantt Chart", category: "Project Management", group: "Project", dependencies: ["Tasks"] },

  // Flight Operations
  { module_name: "Aircraft / Fleet", category: "Flight Operations", group: "Flight Ops", dependencies: [] },
  { module_name: "Flight Ops", category: "Flight Operations", group: "Flight Ops", dependencies: ["Aircraft / Fleet"] },
  { module_name: "Airports", category: "Flight Operations", group: "Flight Ops", dependencies: [] },
  { module_name: "Crew Roster", category: "Flight Operations", group: "Flight Ops", dependencies: ["Aircraft / Fleet"] },
  { module_name: "Flight Schedule", category: "Flight Operations", group: "Flight Ops", dependencies: ["Aircraft / Fleet", "Airports"] },
  { module_name: "Maintenance Log", category: "Flight Operations", group: "Flight Ops", dependencies: ["Aircraft / Fleet"] },
  { module_name: "Fuel Records", category: "Flight Operations", group: "Flight Ops", dependencies: ["Aircraft / Fleet"] },

  // Fleet (ground)
  { module_name: "Vehicle Master", category: "Fleet Management", group: "Fleet", dependencies: [] },
  { module_name: "Driver Management", category: "Fleet Management", group: "Fleet", dependencies: [] },
  { module_name: "Trip Log", category: "Fleet Management", group: "Fleet", dependencies: ["Vehicle Master", "Driver Management"] },
  { module_name: "Vehicle Maintenance", category: "Fleet Management", group: "Fleet", dependencies: ["Vehicle Master"] },
  { module_name: "Fuel Consumption", category: "Fleet Management", group: "Fleet", dependencies: ["Vehicle Master"] },

  // CRM
  { module_name: "Leads", category: "CRM", group: "Sales", dependencies: [] },
  { module_name: "Opportunities", category: "CRM", group: "Sales", dependencies: ["Leads"] },
  { module_name: "Customer Database", category: "CRM", group: "Sales", dependencies: [] },
  { module_name: "Sales Pipeline", category: "CRM", group: "Sales", dependencies: ["Opportunities"] },
  { module_name: "Quotation", category: "CRM", group: "Sales", dependencies: ["Customer Database"] },
  { module_name: "Sales Orders", category: "CRM", group: "Sales", dependencies: ["Quotation"] },
  { module_name: "Customer Support Tickets", category: "CRM", group: "Service", dependencies: ["Customer Database"] },

  // Manufacturing / Operations
  { module_name: "Work Order", category: "Manufacturing", group: "Production", dependencies: [] },
  { module_name: "Bill of Materials", category: "Manufacturing", group: "Production", dependencies: [] },
  { module_name: "Production Planning", category: "Manufacturing", group: "Production", dependencies: ["Bill of Materials"] },
  { module_name: "Quality Control", category: "Manufacturing", group: "Production", dependencies: ["Work Order"] },

  // Notifications & System
  { module_name: "Email Notifications", category: "System & Notifications", group: "System", dependencies: [] },
  { module_name: "SMS Notifications", category: "System & Notifications", group: "System", dependencies: [] },
  { module_name: "Push Notifications", category: "System & Notifications", group: "System", dependencies: [] },
  { module_name: "In-App Inbox", category: "System & Notifications", group: "System", dependencies: [] },
  { module_name: "Webhooks", category: "System & Notifications", group: "System", dependencies: [] },
  { module_name: "Audit Log", category: "System & Notifications", group: "System", dependencies: [] },

  // User Management
  { module_name: "Users", category: "User Management", group: "Identity", dependencies: [] },
  { module_name: "Roles & Permissions", category: "User Management", group: "Identity", dependencies: ["Users"] },
  { module_name: "Single Sign-On (SSO)", category: "User Management", group: "Identity", dependencies: ["Users"] },
  { module_name: "Two-Factor Auth", category: "User Management", group: "Identity", dependencies: ["Users"] },
  { module_name: "API Tokens", category: "User Management", group: "Identity", dependencies: ["Users"] },
  { module_name: "Company Profile", category: "User Management", group: "Identity", dependencies: [] },

  // Reporting & BI
  { module_name: "Dashboard Builder", category: "Reporting & BI", group: "Analytics", dependencies: [] },
  { module_name: "Custom Reports", category: "Reporting & BI", group: "Analytics", dependencies: [] },
  { module_name: "Scheduled Reports", category: "Reporting & BI", group: "Analytics", dependencies: ["Custom Reports"] },
  { module_name: "Data Export", category: "Reporting & BI", group: "Analytics", dependencies: [] },
  { module_name: "KPI Tracker", category: "Reporting & BI", group: "Analytics", dependencies: ["Dashboard Builder"] },

  // Integration
  { module_name: "REST API Access", category: "Integrations", group: "Integration", dependencies: [] },
  { module_name: "Zapier Connector", category: "Integrations", group: "Integration", dependencies: ["REST API Access"] },
  { module_name: "Accounting Sync", category: "Integrations", group: "Integration", dependencies: [] },
  { module_name: "Payment Gateway", category: "Integrations", group: "Integration", dependencies: [] },
  { module_name: "Tax Office e-Faktur", category: "Integrations", group: "Integration", dependencies: ["Taxes"] },
];

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
