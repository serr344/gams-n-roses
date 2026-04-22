# 🎸 GAMS N' ROSES

🏆 **1st Place Winner — Gamification of Optimization Hackathon**

GAMS N' ROSES is a web-based optimization game developed for the **Gamification of Optimization Hackathon** organized by **AGU Computer Society** and **GAMS**.

## 🎮 Project Idea

The game focuses on a real urban problem: **noise pollution**.

Players must create the best possible concert area inside randomly generated city maps while balancing:

- 💰 **Budget limitations**: Manage your resources efficiently.
- 🔊 **Noise restrictions**: Stay within the legal decibel limits.
- 🏙️ **Building sensitivity levels**: Be aware of your surroundings.
- 🎯 **Strategic item placement**: Position your equipment for maximum impact.

Different buildings tolerate different sound levels. For example:
- **Library** → Low tolerance
- **Residential areas** → Medium tolerance
- **Park** → High tolerance

The goal is to achieve the best concert sound level without disturbing the city.

## 🤖 Optimization Logic

While the player builds the concert area, the system calculates the optimal solution using **GAMSPy**.

At the end of the game:
1. Player score is shown.
2. **GAMSPy** optimal score is shown.
3. Results are compared to see how close you got to the mathematical optimum.

## 🛠️ Technologies Used

* **Frontend:** HTML5, CSS3, JavaScript (ES6+)
* **Backend:** Python, Flask
* **Optimization:** GAMSPy
* **Middleware:** Flask-CORS

---

## ⚙️ Installation
### 1. Clone the Project
```bash
git clone <repo-url>
cd gams-n-roses
```
### 2. Install Python Packages
```bash
pip install flask flask-cors gamspy
```

## ▶️ How to Run
### 1. Start the Backend Server
```bash
py api_server.py
```
Note: The server will be running on: http://127.0.0.1:5000

### 2. Start the Frontend
You can use the Live Server extension in VS Code or simply open the file in your browser:

Main File: home.html

Recommended Port: http://127.0.0.1:5500