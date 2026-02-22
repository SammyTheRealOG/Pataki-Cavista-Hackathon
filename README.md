# Pataki Health Watch 🩺

**Empowering Caregivers with AI-Driven Health Insights & Proactive Alerts**

## ✨ Introduction

Pataki Health Watch is an innovative web application designed to provide caregivers with real-time, AI-generated insights into the health and well-being of elderly patients. Leveraging a blend of wearable data simulation and powerful language models, Pataki transforms raw health metrics into actionable, easy-to-understand recommendations and alerts, ensuring timely intervention and peace of mind.

This project was developed as a hackathon entry to demonstrate the potential of AI in elder care.

## 🚀 Features

*   **Dynamic Dashboard:** A visually intuitive dashboard presenting a comprehensive overview of patient vitals and stability.
*   **AI-Generated Insights:** Utilizes a Large Language Model (LLM) to translate complex health data into clear, concise caregiver insights.
*   **Risk Detection & Alerts:** Proactively identifies "at-risk" patient states, providing immediate, actionable calls to emergency services or designated caregivers.
*   **Real-time Data Synchronization:** Simulates real-time data updates with a "Sync Data" feature, instantly reflecting changes in patient status and insights.
*   **Persistent State:** Dashboard data persists across navigation within the same browser session, ensuring a seamless user experience.
*   **Dynamic Trend Graphs:** Visualizes patient stability trends over time, dynamically highlighting significant changes (e.g., drops in score for at-risk states).
*   **Detailed Data Overview:** A dedicated page for in-depth analysis of health metrics, presented with averages for clarity, and interactive charts.
*   **Mock Data Fallback:** Ensures a smooth user experience by displaying mock data when AI services are unavailable or fail to respond.

## 🛠️ Tech Stack

**Frontend:**

*   **React (TypeScript):** A modern JavaScript library for building user interfaces.
*   **Vite:** A fast and efficient build tool for modern web projects.
*   **Tailwind CSS:** A utility-first CSS framework for rapid UI development.
*   **Framer Motion (`motion/react`):** A production-ready motion library for React, used for fluid animations.
*   **Recharts:** A composable charting library built on React components for data visualization.
*   **Lucide React:** A beautiful and consistent icon library.
*   **Session Storage:** For client-side data persistence across browser navigation.

**Backend:**

*   **Python:** The programming language used for the server-side logic.
*   **Flask:** A lightweight web framework for building the RESTful API.
*   **Flask-CORS:** Enables Cross-Origin Resource Sharing for seamless frontend-backend communication.
*   **SQLite:** A file-based, self-contained SQL database for storing all application data (patient info, vitals, trends, AI insights).
*   **`python-dotenv`:** For managing environment variables (e.g., API keys).
*   **Requests:** A popular HTTP library for making API calls.
*   **Hugging Face API:** Integrated for AI model inference.
    *   **LLM Model:** `openai/gpt-oss-120b:groq` (used for generating health insights).

## ARCHITECTURE

The application employs a **Client-Server architecture**:

*   **Client (Frontend):** A single-page application (SPA) built with React and Vite. It handles all UI rendering, user interactions, and data display.
*   **Server (Backend):** A Flask API that manages data storage (SQLite), handles business logic, and orchestrates communication with external AI services.

### How It Works:

1.  **Data Flow:** The frontend communicates with the Flask backend via RESTful API endpoints (`/api/*`) to fetch and update patient health data.
2.  **AI Integration:** The backend's `sync_data` and `get_vitals` endpoints call the `get_ai_insight` function. This function constructs a dynamic prompt based on the patient's current vitals and state (stable/risk) and sends it to the Hugging Face API's LLM (`openai/gpt-oss-120b:groq`). The LLM then generates a natural language insight.
3.  **Data Persistence (Frontend):** To ensure a smooth user experience across navigation, the critical dashboard state is saved to and loaded from the browser's `sessionStorage`.
4.  **Database Seeding & Management:** An `init_db()` function in `database.py` sets up the SQLite schema and seeds it with demo patient and health data upon application startup, providing a consistent environment for testing.

## ⚙️ Installation & Setup

To get Pataki Health Watch running locally, follow these steps:

1.  **Clone the repository:**
    ```bash
    git clone <your-repo-url>
    cd pataki-health-watch # (assuming your project root is here)
    ```

2.  **Backend Setup:**
    ```bash
    cd backend
    python -m venv venv
    .\venv\Scripts\activate # On Windows
    # source venv/bin/activate # On macOS/Linux
    pip install -r requirements.txt
    ```
    Create a `.env` file in the `backend` directory and add your Hugging Face API key:
    ```
    HF_API_KEY=YOUR_HUGGING_FACE_API_KEY
    ```
    (You can obtain a Hugging Face API key from their website.)

3.  **Frontend Setup:**
    ```bash
    cd .. # Go back to pataki-health-watch root
    bun install # or npm install or yarn install
    ```

4.  **Run the application:**
    *   **Start Backend:**
        ```bash
        cd backend
        python app.py
        ```
        (The backend will run on `http://127.0.0.1:5000` by default)
    *   **Start Frontend:**
        ```bash
        cd .. # Go back to pataki-health-watch root
        bun run dev # or npm run dev or yarn dev
        ```
        (The frontend will typically run on `http://localhost:5173` or similar)

## 💡 Usage

Once the application is running:

1.  Open your browser to the frontend URL (e.g., `http://localhost:5173`).
2.  You will see the patient dashboard with initial data and AI insights.
3.  Click the "Sync Data" button to toggle the patient's state between 'stable' and 'risk', observe updated insights, vital readings, and trend graph changes.
4.  Navigate to the "Data Overview" page to see detailed health metrics and trends.
5.  Test persistence by navigating away from the dashboard and back; the data should remain.

## 🤝 Contributing

Contributions are welcome! Please feel free to open issues or submit pull requests.

## 📄 License

This project is licensed under the MIT License. See the `LICENSE` file for details.
