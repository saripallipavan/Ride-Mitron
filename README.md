# 🚗 Ride Mitron – Smart Carpooling Platform

**Smart Carpooling & Ride-Sharing for the Indian Market**

Ride Mitron is a **full-stack MERN application** designed to make daily commuting more efficient, affordable, and sustainable.  
It connects drivers with empty seats to passengers traveling in the same direction using **geospatial route matching** and a **fair fuel-split pricing algorithm**.

---

## ✨ Key Features

- 🔐 **OTP-Based Authentication**  
  Secure login using mobile number (Twilio / Fast2SMS)

- 📍 **Geospatial Ride Matching**  
  Uses MongoDB 2dsphere indexing to find rides within a **5km radius**

- 💰 **Fair Pricing Algorithm**  
  Automatically calculates ride cost based on distance + fuel price

- 💳 **Secure Payments**  
  Integrated Razorpay for smooth and reliable transactions

- 📱 **Responsive Modern UI**  
  Built with Tailwind CSS & Framer Motion for seamless experience across devices

- ⚡ **Scalable Backend Architecture**  
  REST APIs built using Node.js & Express.js

---

## 🛠️ Tech Stack

### Frontend
- React (Vite)
- Tailwind CSS
- Framer Motion
- Lucide Icons

### Backend
- Node.js
- Express.js
- JWT Authentication

### Database
- MongoDB (Geospatial Indexing - 2dsphere)

### APIs & Integrations
- Google Maps API (Distance Matrix, Geocoding)
- Razorpay (Payments)
- Twilio / Fast2SMS (OTP Verification)

---

## 🧠 How It Works

1. User logs in via OTP authentication  
2. Driver posts ride details (route, seats, timing)  
3. Passenger searches rides near their location  
4. System matches rides using geospatial queries  
5. Fare is calculated dynamically  
6. User books ride and completes payment  
7. Ride is confirmed
    
## 🏗️ Project Structure


Ride-Mitron/
├── backend/ # Express.js API server
│ ├── config/
│ ├── controllers/
│ ├── models/
│ └── routes/
├── frontend/ # React (Vite) application
│ ├── components/
│ ├── pages/
│ └── store/
└── README.md
---

## 🚀 Getting Started

### 🔹 Prerequisites
- Node.js (v18+)
- MongoDB Atlas
- Google Maps API Key
- Razorpay Account

---

### 🔹 Backend Setup

```bash
cd backend
npm install
npm run dev
