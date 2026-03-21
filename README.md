# AI-Powered College Assistant

An intelligent full-stack web application that enables students, faculty, and administrators to access academic information through a conversational chatbot interface. The system replaces traditional navigation-heavy portals with a natural language interaction model powered by a Large Language Model (LLM).

---

## Overview

This project introduces a modern approach to academic information systems by integrating a chatbot with a structured database. Users can retrieve information such as attendance, marks, subjects, and notices by simply asking questions in natural language.

The system uses an LLM-first architecture where every user query is analyzed by an AI model to determine the appropriate response path. Academic queries are resolved through database retrieval for accuracy, while general queries are handled by the LLM for conversational flexibility.

---

## Key Features

* Conversational chatbot interface for academic queries
* LLM-based intent detection and routing
* Role-based access system (Student, Teacher, Admin)
* Secure authentication using JSON Web Tokens
* Attendance and marks management system
* Notice and announcement management
* Email integration for notifications and communication
* Modular and scalable MERN stack architecture

---

## Chatbot Architecture

The chatbot follows a hybrid decision-making pipeline:

1. User submits a query through the chat interface
2. The query is processed by an LLM (via Hugging Face)
3. The LLM determines the intent of the query
4. Based on the intent:

   * Academic queries are routed to the backend and resolved using MongoDB
   * General queries are answered directly by the LLM

This approach ensures both accuracy and flexibility by combining deterministic data retrieval with AI-generated responses.

---

## System Architecture

The application follows a three-tier architecture:

* Frontend Layer
  Built using React, responsible for user interface and interaction

* Backend Layer
  Built using Node.js and Express, handles API requests, business logic, authentication, and routing

* Database Layer
  MongoDB used for storing academic data such as users, attendance, marks, and notices

* AI Layer
  Hugging Face LLM (Llama 3.1) used for intent classification and conversational responses

---

## Tech Stack

Frontend:

* React
* Tailwind CSS
* Axios

Backend:

* Node.js
* Express.js
* MongoDB with Mongoose

AI Integration:

* Hugging Face Inference API
* Llama 3.1 (intent detection and response generation)

Security:

* JSON Web Tokens (JWT)
* bcrypt (password hashing)

---

## Project Structure

The project is organized into two main parts:

* client
  Contains the React frontend including UI components, pages, and chatbot interface

* server
  Contains backend logic including routes, controllers, models, middleware, and services

This separation ensures scalability and maintainability.

---

## Setup Instructions

1. Clone the repository
2. Install dependencies for root, client, and server
3. Configure environment variables in the server directory

Required environment variables include:

* PORT
* MONGODB_URI
* JWT_SECRET
* HUGGINGFACE_API_TOKEN

4. Start both frontend and backend servers

---

## Usage

Student:

* Login using credentials
* Ask questions related to attendance, marks, and subjects
* View responses directly through chatbot

Teacher:

* Manage attendance and marks
* Access student-related information
* Use chatbot for quick queries

Admin:

* Manage users and academic data
* Publish notices and announcements
* Monitor system usage

---

## Key Highlights

* LLM-driven intent classification system
* Hybrid AI and database architecture
* Role-based access control with secure authentication
* Real-world academic use case implementation
* Clean separation of frontend, backend, and AI logic

---

## Future Enhancements

* Voice-based chatbot interaction
* Mobile application support
* Advanced NLP techniques such as semantic search
* Deployment to cloud platforms
* Integration with existing college management systems

---

## License

This project is licensed under the MIT License.

Permission is granted to use, copy, modify, and distribute this software with proper attribution. The software is provided without warranty of any kind.

---

## Author

Arijeet Kumar Das
MCA Student
BMS College of Engineering

---
