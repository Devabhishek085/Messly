# Messly 🍱 — KIET Boys Hostel Mess App & Admin Portal

[![Expo](https://img.shields.io/badge/Expo-SDK_51-000000?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React_Native-0.74-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactnative.dev)
[![React](https://img.shields.io/badge/React_Admin-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com)
[![Vercel](https://img.shields.io/badge/Vercel-Deployment-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.app)

**Messly** is a full-stack digital hostel mess management system built specifically for KIET Boys Hostel students and mess administration staff. It features a student-facing mobile application (iOS & Android) with real-time menu viewing, meal notifications, and offline fallback, alongside a comprehensive web admin dashboard for mess staff to manage menus, set holiday overrides, update meal timings, and monitor real-time student engagement telemetry.

---

## 🌟 Key Features

### 📱 Student Mobile Application (`/mobile`)
- **Daily & Weekly Mess Menu**: View Breakfast, Lunch, Snacks, and Dinner for every day of the week (Monday – Sunday).
- **Meal Timings & Status**: Live status indicators and countdowns for active/upcoming meals.
- **Scheduled Notifications**: Customizable local reminders for upcoming meals (e.g., 15 minutes before Lunch).
- **Offline Support & Local Caching**: Automatic caching of menu items and timings with a built-in fallback noticeboard menu when offline.
- **Anonymous Telemetry**: Privacy-preserving engagement analytics tracking device app opens, menu views, and notification settings.
- **Over-The-Air (OTA) Updates**: Powered by Expo EAS Updates for instant, seamless app updates without requiring manual re-installation.

### 💻 Mess Staff Admin Portal (`/admin`)
- **Interactive Weekly Menu Editor**: Live editor to modify meals for any day of the week.
- **Meal Timings Manager**: Adjust operational hours for Breakfast, Lunch, Snacks, and Dinner.
- **Special Date Overrides**: Schedule special event menus or holiday overrides for specific calendar dates.
- **Telemetry & Student Analytics Dashboard**: Real-time insights into unique devices, active students (Today / Week / Month), top viewed meals, and a 7-day engagement trend graph.
- **Secure Authentication**: JWT-based session security with auto-invalidation on unauthorized access and autocomplete protection.

### ⚙️ Production Backend API (`/backend`)
- **RESTful API**: Clean Express.js routing with Zod schema validation and rate-limiting middleware.
- **MongoDB Atlas Data Layer**: Schemas for `Admin`, `WeeklyMenu`, `MealTiming`, `SpecialMenu`, and `DeviceEvent`.
- **Database Seeding & Credential CLI**: Pre-configured seeding logic and an explicit admin credential management script.

---

## 🚀 Live Deployments & Build Links

| Component | Platform / Host | Access Link |
| :--- | :--- | :--- |
| **Admin Web Portal** | Vercel | [messly-two.vercel.app](https://messly-two.vercel.app) |
| **Production Backend API** | Render | `https://messly.onrender.com/api` |
| **Android Standalone APK** | Expo EAS Build | [Download APK](https://expo.dev/accounts/abhishekkpal/projects/messly/builds/09bfb6dd-984e-4dac-b02b-48c55014ac6c) |
| **Expo EAS Update Channel** | Expo Cloud | Branch `production` |

---

## 📁 Repository Structure

```
Messly/
├── mobile/                   # React Native / Expo Mobile Application
│   ├── src/
│   │   ├── components/       # UI components (Offline banner, cards)
│   │   ├── services/         # API, Storage, Notifications, Telemetry
│   │   ├── theme/            # Design color system
│   │   └── types/            # TypeScript data interfaces
│   ├── App.tsx               # Main mobile app entry point
│   ├── app.json              # Expo configuration (EAS Updates & Bundle ID)
│   └── eas.json              # Expo EAS build & update profile settings
│
├── admin/                    # React + Vite Admin Web Dashboard
│   ├── src/
│   │   ├── api/              # API client & auth token interceptors
│   │   ├── components/       # Weekly, Timings, Overrides, & Analytics Editors
│   │   ├── pages/            # Login page component
│   │   └── App.tsx           # Main web dashboard container
│   └── vite.config.ts        # Vite build configuration
│
└── backend/                  # Node.js + Express + MongoDB Backend Service
    ├── src/
    │   ├── config/           # MongoDB Atlas connection setup
    │   ├── middleware/       # JWT auth & Zod request validation
    │   ├── models/           # Mongoose Data Schemas (Admin, Menu, Event, Timings)
    │   ├── routes/           # Express API endpoints
    │   ├── scripts/          # Admin credential management CLI
    │   ├── seed/             # Initial database seed script
    │   └── server.ts         # Main HTTP server entry point
    └── package.json
```

---

## 🛠️ Local Development & Setup

### Prerequisites
- **Node.js**: `v18.x` or higher
- **npm** or **yarn**
- **Expo CLI**: `npm install -g expo-cli`
- **EAS CLI**: `npm install -g eas-cli`

---

### 1. Backend Service Setup (`/backend`)

```bash
cd backend

# Install dependencies
npm install

# Configure environment variables (.env)
# Create a .env file with the following variables:
PORT=5000
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development
ADMIN_USERNAME=iblameabhishek
ADMIN_PASSWORD=yochicko

# Run initial database seed
npm run seed

# Run server in development mode (with tsx watch)
npm run dev
```

#### Changing Admin Credentials CLI
To change the admin username and password in the database at any time:
```bash
npm run set-admin <new_username> <new_password>
```

---

### 2. Admin Web Portal Setup (`/admin`)

```bash
cd admin

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
The web dashboard will be accessible at `http://localhost:5173`.

---

### 3. Mobile App Setup (`/mobile`)

```bash
cd mobile

# Install dependencies
npm install

# Start Expo development server
npx expo start
```
Scan the generated QR code using the **Expo Go** app on iOS or Android.

---

## 📦 Building & Publishing Updates

### Publishing Over-The-Air (OTA) Updates
To push frontend JS/UI updates directly to student phones without rebuilding the APK:

```bash
cd mobile
eas update --branch production --message "Describe your updates"
```

### Generating Android APK Builds
To build a standalone Android `.apk` file via EAS Cloud Build:

```bash
cd mobile
eas build --platform android --profile preview
```

---

## 🔒 Security & Privacy

- **Password Protection**: Passwords are securely hashed using `bcryptjs` with a cost factor of 10.
- **JWT Authorization**: Admin endpoints require valid Bearer token headers.
- **Form Protection**: Autocomplete and browser pre-fill protections on sensitive authentication forms.
- **Anonymous Telemetry**: Mobile device analytics collect zero personally identifiable information (PII), tracking only randomized UUIDs for engagement metrics.

---

## 📜 License

This project is maintained for **KIET Boys Hostel Mess Administration**. All rights reserved.
