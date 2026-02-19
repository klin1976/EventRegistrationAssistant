# Event Registration Assistant (瘣餃??勗撠鼠??

A full-stack web application for managing event registrations, generating QR codes, and handling on-site check-ins. Built with Node.js, Express, SQLite, and React.

## ?? Features

- **Participant Management**:
  - Upload CSV file with participant list (Name, Email).
  - Automatically generate unique Check-in Codes & QR Codes.
  - Handle duplicate uploads (prevents double entry if logic implemented, currently generates new codes).

- **On-Site Check-in**:
  - **QR Code Scanning**: Use device camera to scan participant QR codes.
  - **Manual Entry**: Input 6-character check-in code manually.
  - **Duplicate Prevention**: Detects if a participant has already checked in and shows a warning.
  - **Visual Feedback**: Green for success, Orange for duplicate, Red for error.

- **Admin Dashboard**:
  - Real-time statistics (Total participants, Checked-in count, Remaining).
  - Searchable participant list.
  - View check-in timestamps.

## ??儭?Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: SQLite (via \etter-sqlite3\)
- **Frontend**: React, Vite
- **Styling**: Vanilla CSS (Dark mode optimized)
- **Utilities**:
  - \qrcode\: QR code generation
  - \html5-qrcode\: Browser-based QR scanning
  - \multer\ & \csv-parser\: File handling

## ?? Installation & Setup

1. **Clone the repository**
   \\\ash
   git clone https://github.com/klin1976/EventRegistrationAssistant.git
   cd EventRegistrationAssistant
   \\\

2. **Install Dependencies**
   \\\ash
   npm install
   \\\

3. **Start the Application**
   Run backend and frontend concurrently:
   \\\ash
   npm start
   \\\
   - Backend API: \http://localhost:3001\
   - Frontend: \http://localhost:5173\

## ?? Project Structure

\\\
??? client/                 # React Frontend
??  ??? src/
??  ??  ??? pages/          # Page components (Upload, Checkin, Dashboard)
??  ??  ??? App.jsx         # Main routing
??  ??? vite.config.js      # Vite config (proxy to backend)
??? routes/                 # Express API Routes
??  ??? upload.js           # CSV upload & QR generation
??  ??? checkin.js          # Check-in logic
??  ??? admin.js            # Dashboard stats
??? db.js                   # SQLite connection & schema
??? server.js               # Express server entry point
??? package.json            # Scripts & dependencies
\\\

## ?? Usage Guide

1. **Upload**: Go to "銝?", drop a CSV file (Headers: \
ame\, \email\).
2. **Check-in**: Go to "?曉?勗", allow camera access, and scan a QR code.
3. **Dashboard**: Monitor progress in "蝯梯??銵冽".

