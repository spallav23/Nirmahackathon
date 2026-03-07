# Setup & Documentation Guide

This document contains everything an evaluator needs to successfully run the AI-Driven Solar Inverter Failure Prediction platform locally.

## 1. Prerequisites & Dependencies

To ensure a smooth execution, the host machine must have the following installed:
- **Git** (for downloading the source code)
- **Docker Engine** (v20+ recommended)
- **Docker Compose** (V2 recommended)
- **Minimum System Requirements**: 4GB RAM, 10GB Free Disk Space.

All software dependencies (Node.js, Python, MongoDB, Redis, Kafka, React) are strictly containerized and will be installed automatically by Docker. No local language runtimes are required.

---

## 2. Installation Steps (Getting the Code)

Clone the repository directly from GitHub to your local machine:

```bash
# Clone the project repository
git clone <YOUR_GITHUB_REPO_URL>

# Enter the main project directory
cd <YOUR_PROJECT_NAME>/code
```

*(Note for Evaluators: If downloading as a ZIP file, extract the archive and open your terminal inside the extracted `code` folder).*

---

## 3. Dataset Configuration (Where to place CSV files)

Due to file size constraints, datasets are not included in the source code directly. You will need to place your CSV data files before launching the ML server.

1. Ensure you have the required `training_data.csv` (or whatever your specific CSV names are).
2. Move the CSV files into the ML Server's data directory. From the `code/` root, place them tightly here: `code/ml_server/data/` (create the `data/` directory if it does not exist).
3. The platform is pre-configured to automatically parse `.csv` or `.xlsx` files found in this directory upon the startup of the ML Microservice.

*(For the Web UI Dataset Upload Feature: You can also upload any test CSV file directly from the Web Interface later).*

---

## 4. Execution Instructions (Starting with Docker)

The entire micro-service architecture is orchestrated through a single Docker Compose network. 

1. From the `code/` root directory, navigate into the infrastructure folder:
```bash
cd infrastructure
```

2. (Optional but recommended) Configure your environment variables. Copy the example `.env` file if provided, or simply create one in the `infrastructure/` folder:
```bash
echo "JWT_SECRET=evaluation-secret-key" > .env
echo "GOOGLE_API_KEY=<YOUR_GEMINI_API_KEY_HERE>" >> .env  # Optional: Only needed for Generative AI Explanations
```

3. Launch the platform in detached mode:
```bash
docker compose up --build -d
```

4. Wait approximately 1-2 minutes for all services (Database, Redis, Kafka, API Gateway, ML Server, and Web UI) to initialize and become healthy. You can track the real-time status using:
```bash
docker compose ps
```

---

## 5. Accessing the Platform

Once the deployment finishes and the containers are marked as `healthy`, the application is ready.

- **Main Web Interface**: Open your browser and navigate to **[http://localhost](http://localhost)** 
- All traffic is automatically routed securely through the NGINX API Gateway. 
- You can now register an account, upload your test datasets, and run inference on inverter analytics!

## Stopping the Application
When you are done testing, safely tear down the containers and network:
```bash
docker compose down
```
