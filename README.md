# AI Powered Interview Preparation Platform

An AI-driven platform that helps users optimize their resumes, improve ATS compatibility, and prepare for personalized mock interviews through resume-based question generation and real-time feedback.

## 🚀 Live Demo

🔗 https://interviewprep-ai-2.onrender.com

## ✨ Key Features

### 📄 Resume Analysis

* Upload resumes in PDF, DOCX, TXT, or Markdown formats
* Generate ATS compatibility scores
* Identify keyword gaps and weak resume sections
* Receive AI-powered improvement suggestions
* Get role-specific resume optimization feedback

### 🎯 Personalized Interview Preparation

* Generate interview questions based on uploaded resumes
* Customize interviews for target job roles
* Select difficulty levels: Easy, Medium, Hard
* Conduct project-based, technical, and HR interview rounds
* Simulate real-world interview experiences

### 📊 Performance Analytics

* Track interview history and progress over time
* Visualize score progression through interactive charts
* Analyze strengths and knowledge gaps
* Review detailed answer-level feedback
* Monitor overall competency growth

### 🔐 User Management

* Secure authentication with JWT
* Protected routes and personalized dashboards
* Session management and persistent analytics

## 🏗️ System Workflow

1. User signs up and logs in.
2. User uploads a resume and selects a target job role.
3. The system extracts resume content and performs ATS analysis.
4. Groq AI generates personalized interview questions.
5. User completes interview simulations.
6. AI evaluates responses across multiple dimensions.
7. Performance metrics and progress analytics are stored and visualized.

## 🧠 AI Capabilities

* Resume parsing and content extraction
* ATS compatibility analysis
* Keyword gap identification
* Context-aware prompt engineering
* Resume-driven interview generation
* Real-time feedback and evaluation
* Personalized learning recommendations

## ⚙️ Tech Stack

### Frontend

* React.js
* Redux
* Tailwind CSS

### Backend

* Node.js
* Express.js
* JWT Authentication
* REST APIs

### Database

* MongoDB

### AI & GenAI

* Groq API
* Prompt Engineering
* LLM Integration

## 📈 Evaluation Metrics

The platform evaluates interview responses based on:

* Technical Accuracy
* Concept Depth
* Clarity
* Confidence
* Resume Alignment

## 📸 Screenshots

Add screenshots for:

* Login and Signup Page
* User Dashboard
* Resume Analysis Results
* Interview Studio
* Performance Analytics

## 🔮 Future Enhancements

* Voice-based interview simulations
* Job description matching
* Interview answer recording and transcription
* Multi-language support
* Team and recruiter dashboards

## 🛠️ Local Setup

```bash
git clone https://github.com/Aranya-2004/InterviewPrep.ai.git

cd InterviewPrep.ai

# Install frontend dependencies
cd client
npm install

# Install backend dependencies
cd ../server
npm install
```

Create a `.env` file:

```env
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
GROQ_API_KEY=your_groq_api_key
```

Run the application:

```bash
# Backend
npm run server

# Frontend
npm start
```

## 👨‍💻 Author

Aranya Mal

* GitHub: https://github.com/Aranya-2004
* LinkedIn: (https://www.linkedin.com/in/aranya-mal-326247291/)

