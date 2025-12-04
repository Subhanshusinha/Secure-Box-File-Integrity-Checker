# 🚀 SecureBox – SHA-256 File Integrity Checker (MERN Stack)

SecureBox is a cybersecurity-focused web application that allows users to upload files, generate a SHA-256 hash, and verify file integrity using a clean, modern UI.  
The frontend uses Glassmorphism, Bootstrap, and Vanilla JavaScript.  
The backend uses Node.js, Express, Multer, Crypto, and Streams to hash files securely and delete them immediately after processing.

---

<img width="912" height="955" alt="Project5 png" src="https://github.com/user-attachments/assets/e58bd220-0f78-4706-9f1a-2615d92c1334" />

--

## 📸 Features Overview

### 🌐 Frontend (HTML + CSS + JS + Bootstrap 5)
- 🎨 Glassmorphism UI (`backdrop-filter`, translucent cards)  
- 🌈 Modern gradients for background and buttons  
- ✨ CSS animations (fade-in, slide-in)  
- 📦 Responsive layout using Bootstrap 5  
- 🔄 Fetch API for async file upload  
- 🧩 Dynamic DOM updates  
- 📋 Copy hash to clipboard using Clipboard API  

---

## 🖥️ Backend (Node.js + Express)
- ⚙️ REST API made with Express.js  
- 📁 Multer for file uploads  
- 🔐 SHA-256 hashing using Crypto module  
- ⚡ Stream-based hashing with `fs.createReadStream()`  
- 🧹 Auto-delete file from server after hashing  

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | HTML5, CSS3, Bootstrap 5, JavaScript (ES6) |
| UI Effects | Glassmorphism, Gradients, CSS Animations |
| Backend | Node.js, Express.js |
| Upload Handling | Multer |
| Hashing | Crypto (SHA-256) |
| File Processing | Node.js Streams |

---

## ▶️ How SecureBox Works

1. User uploads a file  
2. File sent to backend using Fetch API  
3. Multer saves file temporarily  
4. Crypto + Streams generate SHA-256 hash  
5. Server sends hash back  
6. Backend deletes the file  
7. UI shows:
   - 🟩 Green box → Hash matched  
   - 🟥 Red box → Hash mismatch 

## 📁 Project Structure

