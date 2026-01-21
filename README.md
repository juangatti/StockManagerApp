# Stock Manager App

**Stock Manager App** is a comprehensive full-stack web application designed for efficient inventory and establishment management, tailored for bars and similar venues. It streamlines stock control, purchase management, keg tracking, and table reservations through a modern, responsive interface.

## 🚀 Key Features

### 📦 Inventory & Stock Control

- **Real-time Stock Tracking:** Monitor inventory levels with precision, supporting various units of measurement.
- **Automated Validations:** Prevent negative stock and track movements automatically.
- **Category Management:** Organize items into customizable categories and brands.
- **Prebatch Management:** Track production of internal mixes (prebatches) with shelf-life monitoring and status alerts (Fresh, Warning, Expired).

### 🍺 Keg Management (New)

- **Keg Lifecycle Tracking:** Monitor kegs from purchase to return.
- **Tap Management:** Visual interface for assigning kegs to taps (Active Taps Widget).
- **Status Workflow:** Track states like `STORED`, `TAPPED`, `EMPTY`, and `RETURNED`.

### 📅 Reservations & Operations

- **Table Reservations:** Manage customer bookings with date, time, pax, and location assignment.
- **Work Schedule:** Track employee shifts and roles.
- **Sales Processing:** Upload excel sales reports to automatically deduct stock based on complex recipes.

### 🎨 User Experience (Mauer Industrial Design)

- **Modern UI:** A custom "Clean Industrial" design system featuring a neutral grayscale palette, brick red accents, and high-contrast typography (`Oswald` headers, `Inter` body).
- **Responsive Dashboard:** Informative widgets for quick insights (Active Taps, Daily Reservations, Stock Alerts).
- **Role-Based Access:** Secure authentication for Admins and Operators.

---

## 🛠️ Tech Stack

### Frontend

- **React** (Vite)
- **Tailwind CSS** (v4, Custom Theme)
- **Zustand** (State Management)
- **React Router DOM**
- **Lucide React** (Icons)
- **Axios**

### Backend

- **Node.js** & **Express.js**
- **MySQL** (Database)
- **JWT** (Authentication)
- **Multer** (File Uploads)

---

## 🔧 Installation & Setup

1.  **Clone the repository**

    ```bash
    git clone <repository-url>
    cd MAUERAPP
    ```

2.  **Backend Setup**

    ```bash
    cd Backend
    npm install
    # Configure .env with your MySQL credentials
    npm start
    ```

3.  **Frontend Setup**
    ```bash
    cd Frontend
    npm install
    # Configure .env with VITE_API_BASE_URL
    npm run dev
    ```

## © Credits

Developed by **Juan Gatti**.
All rights reserved ® 2026.
