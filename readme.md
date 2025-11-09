<div align="center">

# 🧠 WorkZen – Smart Human Resource Management System  
### Simplifying HR Operations for Smarter Workplaces

![React](https://img.shields.io/badge/Frontend-React.js-blue?logo=react)
![Express](https://img.shields.io/badge/Backend-Express.js-black?logo=express)
![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-316192?logo=postgresql)
![JWT](https://img.shields.io/badge/Auth-JWT-green?logo=jsonwebtokens)
![License](https://img.shields.io/badge/License-MIT-yellow)
![Hackathon](https://img.shields.io/badge/Odoo%20Amalthea'25%20Hackathon-2025-orange)

</div>

---

## 🚀 Vision & Mission

WorkZen aims to **modernize and simplify** how organizations manage their people, processes, and payroll.  
Our mission is to build a **reliable, transparent, and data-driven HR ecosystem** that empowers startups, institutions, and SMEs to make informed workforce decisions.

---

## 🧩 Key Features

### 👤 User & Role Management
- Secure user registration and login using JWT authentication.
- Role-based access (Admin, HR Officer, Payroll Officer, Employee).
- Editable user profile management.
- **Subdomain-based user routing** — e.g. `vandan.localhost:3000` after login for personalized access.

### 🕒 Attendance & Leave Management
- Employees can mark daily attendance and view attendance logs.
- HR and Admin can monitor attendance across all users.
- Apply for leave with real-time approval or rejection workflows.
- Leave balance and status dashboard.

### 💰 Payroll Management
- Dynamic payroll system connected to attendance and leave data.
- Admin/Payroll Officer can generate, edit, or review monthly salary reports.
- Automated payslip generation and tax (PF, PT) deductions.
- Payrun-based salary processing.

### 📊 Dashboard & Analytics
- Visualized insights into attendance, leaves, and payroll using interactive charts.
- Role-based dashboards for Admin, HR, and Employees.
- Key performance metrics with real-time analytics.

---

## 🧮 Tech Stack

| Category | Technologies Used |
|-----------|------------------|
| **Frontend** | React.js, Redux, Tailwind CSS |
| **Backend** | Node.js, Express.js |
| **Database** | PostgreSQL |
| **Authentication** | JWT, Bcrypt |
| **Deployment** | Docker, Nginx |
| **Version Control** | Git + GitHub |

---

## ⚙️ Architecture Overview

The platform follows an **MVC-based structure** with RESTful APIs.

```text
Frontend (React)
       ↓
Backend (Express)
       ↓
Database (PostgreSQL)