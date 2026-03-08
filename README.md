# 🍽️ Smart Canteen Management System

A web-based Smart Canteen Management System that allows students to view the menu, add food items to cart, and place orders online. The system also includes an admin dashboard where the canteen owner can manage menu items, stock, and orders.

This project helps reduce long queues in the canteen and makes food ordering faster and more efficient.

--------------------------------------------------

## Features

### Student
- View canteen menu
- See food name and price
- Add food to cart
- Place orders
- Check order status (Pending / Completed)

### Admin
- Admin login
- Add or update menu items
- Manage food prices and stock
- View student orders
- Update order status

--------------------------------------------------

## Technologies Used

Frontend
- React.js
- Vite
- Axios
- HTML / CSS / JavaScript

Backend
- FastAPI (Python)
- SQLAlchemy
- JWT Authentication

Database
- SQLite

Tools
- Node.js
- NPM
- Git & GitHub

--------------------------------------------------

## Project Structure

canteen
│
├── backend
│   └── app
│       ├── routers
│       ├── models
│       ├── utils
│       ├── config.py
│       ├── database.py
│       └── main.py
│
├── frontend
│   └── src
│       ├── components
│       ├── pages
│       ├── api
│       └── App.jsx
│
└── README.md

--------------------------------------------------

## How to Run the Project

### 1 Start Backend

Open terminal

cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload

Backend will run at

http://127.0.0.1:8000

API Docs

http://127.0.0.1:8000/docs

--------------------------------------------------

### 2 Start Frontend

Open another terminal

cd frontend
npm install
npm run dev

Frontend will run at

http://localhost:5173

--------------------------------------------------

## Future Improvements

- QR Code ordering system
- Online payment integration
- Real-time order updates
- Kitchen display dashboard

--------------------------------------------------

## Author

Ranjith Kumar

<img width="1366" height="768" alt="canteen enter" src="https://github.com/user-attachments/assets/f6e9ef68-361e-402a-b3ed-c1c768d0b585" />
<img width="883" height="511" alt="canteen login" src="https://github.com/user-attachments/assets/da7c5b28-1b10-4fc2-a1fc-6f69a43ff845" />

<img width="1366" height="768" alt="image" src="https://github.com/user-attachments/assets/0507dc8f-2b7c-4dc4-bdc5-b7d40d8efb1d" />

<img width="1366" height="768" alt="image" src="https://github.com/user-attachments/assets/32b1e204-5c92-4f76-a702-66325082da2f" />
<img width="1366" height="768" alt="image" src="https://github.com/user-attachments/assets/1cf9f1cd-bc25-4447-aa29-3764ae98e7b4" />
<img width="1366" height="768" alt="image" src="https://github.com/user-attachments/assets/e9f77767-3806-492b-af7e-9e6f6f1bfba4" />
<img width="1366" height="768" alt="image" src="https://github.com/user-attachments/assets/9b6c9407-4055-45f9-a648-54c2814d184e" />
<img width="1366" height="768" alt="image" src="https://github.com/user-attachments/assets/cc745fc2-c1a4-4f99-afb6-fd2109e380ad" />
<img width="1366" height="768" alt="image" src="https://github.com/user-attachments/assets/d3528856-94eb-46f4-a564-129da301949f" />

