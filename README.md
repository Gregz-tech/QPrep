# QPrep - Academic Past Questions Repository 🎓

**QPrep** is a web-based platform designed to provide students with seamless access to academic past questions. It serves as a digital departmental library, allowing users to view current semester materials, browse previous academic levels via an "Archive," and bookmark important papers for offline-like access.

##  Features

### 👤 Student Dashboard
* **Smart Semester View:** Automatically displays courses and past questions relevant to the user's current Department and Level.
* **Global Search:** Quickly find specific courses or papers across the entire database.
* **Responsive Viewer:** Integrated PDF and Image viewer for studying directly within the app.

### 🏛️ My Archive (Departmental Library)
* **Level Browser:** Students can access materials from previous levels (100L - 500L) within their department without creating new accounts.
* **Session Filtering:** Filter archival content by Academic Session (e.g., 2023/2024) and Semester.

### ⭐ Saved Papers (Bookmarks)
* **Local Persistence:** Users can "Star" papers to save them to a specialized "Saved" list.
* **Instant Access:** Bookmarks rely on `localStorage`, allowing quick access to frequently used papers.

### 🛡️ Admin Panel
* **Secure Upload:** authorized admins can upload new Past Questions (PDF or Image).
* **Metadata Tagging:** Papers are tagged with Course Code, Title, Department, Level, Year, and Semester for precise filtering.

---

## 🛠️ Tech Stack

**Frontend:**
* **HTML5 & CSS3:** Custom "Glassmorphism" UI design with a responsive Sidebar layout.
* **JavaScript (ES6+):** Modular architecture for scalability.
    * `ui.js` - Core Dashboard logic & Sidebar navigation.
    * `archive.js` - Logic for the "My Archive" level browser.
    * `saved.js` - Logic for Bookmarking and LocalStorage management.
    * `admin.js` - Upload functionality and Backend API interaction.
    * `auth.js` - User authentication and session handling.

**Backend:**
* **Node.js & Express:** REST API for handling data requests.
* **MongoDB:** NoSQL database for storing user profiles and paper metadata.
* **Cloudinary / GridFS:** (Assumed) Storage for PDF and Image files.

---

## 📂 Project Structure

```text
QPrep/
├── css/
│   └── style.css       # Main application styling (Glassmorphism & Layouts)
├── js/
│   ├── ui.js           # Main UI interactions & Router
│   ├── archive.js      # Archive feature logic
│   ├── saved.js        # Bookmarking feature logic
│   ├── admin.js        # Admin upload & API logic
│   └── auth.js         # Login/Logout logic
├── images/             # Assets and background images
├── index.html          # Main Application Entry
├── login.html          # Authentication Page
└── README.md           # Project Documentation
