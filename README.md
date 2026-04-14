# SpendWise Setup Guide (Pure Django Edition)

Welcome to the project! We have migrated from a Node/Express/MongoDB architecture to a **Pure Django + SQLite** setup for simpler development and deployment.

---

## Step 1: Install Dependencies
This project has 3 main parts that need their setup:

```bash
# 1. Install root dependencies (Main web app)
npm install

# 2. Install Django backend dependencies
cd backend
# Make sure you have your virtual environment activated:
# .\venv\Scripts\activate
pip install -r requirements.txt
cd ..

# 3. Install admin portal dependencies
cd admin
npm install
cd ..

# 4. Install mobile app dependencies
cd mobile
npm install
cd ..
```

## Step 2: Initialize Database
Since we are using SQLite, we need to set up the database locally:

```bash
cd backend
python manage.py makemigrations
python manage.py migrate
cd ..
```

## Step 3: Run the Development Servers

**Terminal 1: Start the Django Backend (Port 5000)**
```bash
cd backend
python manage.py runserver 5000
```

**Terminal 2: Start the Web App (Frontend)**
```bash
npm run dev
```

**Terminal 3: Start the Admin Portal**
```bash
cd admin
npm run dev
```

**Terminal 4: Start the Mobile App**
```bash
cd mobile
npx expo start
```

## Need Help?
If you encounter registration or login issues, ensure your **Django Server** is running on port 5000 and the database migrations have been applied.
