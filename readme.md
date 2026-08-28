*This project has been created as part of the 42 curriculum by [LOGIN_1], [LOGIN_2], [LOGIN_3], [LOGIN_4].*

---

# Food AI

**Food AI** is a web application that transforms low-quality food photos into
professional-grade images using a multi-model AI pipeline. Users upload a photo
of their food, and the system validates it, analyzes its visual properties, and
generates an enhanced version ready for use in delivery menus, food blogs, or
promotional materials.

## Description

Food AI addresses a real problem faced by small restaurant owners and food
delivery businesses: poor-quality food photos that hurt sales. The application
automates the enhancement process using a chain of AI models:

1. **RT-DETR** — a real-time object detection transformer that validates the
   uploaded image actually contains food, rejecting irrelevant content before
   any paid API calls are made.
2. **Gemini** (via Replicate) — a vision AI that analyzes the food image and
   extracts structured visual data: food identity, visible ingredients,
   container type, camera angle, lighting issues, and texture problems.
3. **Flux** (via Replicate) — a state-of-the-art image generation model that
   uses the analysis to produce a professionally lit, appetizing version of
   the original dish.

### Key Features

- 🔐 Secure user registration and login with hashed passwords
- 📸 Food image upload with client-side and server-side validation
- 🤖 Multi-model AI pipeline (RT-DETR → Gemini → Flux)
- 🖼️ Generation history — review all past uploads and generated images
- 🔄 Image regeneration — reuse a previous analysis to generate a new result
- 📄 Privacy Policy and Terms of Service pages
- 🔒 HTTPS-only access via self-signed certificate
- 🐳 Single-command deployment with Docker Compose

---

## Instructions

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) (v24+)
- [Docker Compose](https://docs.docker.com/compose/) (v2.20+)
- A [Replicate](https://replicate.com) account and API token

### Environment Setup

Create the `.env` file in the `backend/` directory based on the provided example:

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` and fill in your values:

```env
# Replicate API — get your token at https://replicate.com/account/api-tokens
REPLICATE_API_TOKEN=r8_your_token_here

# PostgreSQL
POSTGRES_DB=food_ai_db
POSTGRES_USER=food_ai_user
POSTGRES_PASSWORD=your_secure_password

# Django
DJANGO_SECRET_KEY=your_secret_key_here
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1
```

> **Note:** Never commit the `.env` file to version control.
> The `REPLICATE_API_TOKEN` is required for all AI features to work.

### Running the Application

```bash
# Clone the repository (if not already done)
git clone <repository-url>
cd transcendence

# Start all services (database, backend, frontend)
docker compose up --build
```

On the first run, Docker will:
1. Pull base images (Python, Node, Nginx, PostgreSQL)
2. Install Python dependencies (including PyTorch — this may take several minutes)
3. Build the React frontend
4. Run Django database migrations
5. Start all services

Once running, access the application at:

```
https://localhost:8443
```

> **SSL Warning:** The application uses a self-signed certificate for local HTTPS.
> When prompted by your browser, click "Advanced" → "Proceed to localhost".

### Stopping the Application

```bash
# Stop services (data is preserved)
docker compose down

# Stop services AND delete all data (database + uploaded images)
docker compose down -v
```

### Development Mode

For local development without Docker:

```bash
# Backend
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

# Frontend (in a separate terminal)
cd frontend/web
npm install
npm run dev
```

---

## Resources

### Documentation & References

- [Django REST Framework](https://www.django-rest-framework.org/) — REST API framework for Django
- [LangGraph](https://langchain-ai.github.io/langgraph/) — Framework for building stateful AI agent pipelines
- [Replicate API](https://replicate.com/docs) — Cloud platform for running AI models
- [Ultralytics RT-DETR](https://docs.ultralytics.com/models/rtdetr/) — Real-time object detection model
- [Flux by Black Forest Labs](https://replicate.com/black-forest-labs/flux-2-max) — State-of-the-art image generation
- [Gemini by Google](https://replicate.com/google/gemini-3-flash) — Vision language model
- [React Router](https://reactrouter.com/) — Client-side routing for React
- [Pydantic v2](https://docs.pydantic.dev/latest/) — Data validation and schema enforcement in Python
- [Docker Compose](https://docs.docker.com/compose/) — Multi-container orchestration

### How AI Was Used in This Project

AI tools (primarily large language models) were used to assist in the following
areas during development:

- **Code assistance:** Generating boilerplate code for Django models, serializers,
  and React components. All generated code was reviewed, understood, and adapted
  by team members before being committed.
- **Debugging:** Using AI to help diagnose unexpected behavior in the LangGraph
  pipeline and in Replicate API response handling.
- **Prompt engineering:** Iterating on the Gemini analysis prompt and the Flux
  generation prompt to improve output quality and consistency.
- **Documentation:** Drafting initial versions of this README and the Privacy
  Policy/Terms of Service, which were then reviewed and edited by the team.

All AI-generated content was critically evaluated. No code or text was merged
without full team understanding of its purpose and function.

---

## Team Information

| Login | Name | Roles | Responsibilities |
|---|---|---|---|
| [LOGIN_1] | [Name 1] | Product Owner, Developer | Product vision, backlog prioritization, feature validation, frontend development |
| [LOGIN_2] | [Name 2] | Project Manager, Developer | Sprint planning, task tracking, team coordination, backend development |
| [LOGIN_3] | [Name 3] | Tech Lead, Developer | Architecture decisions, code review, AI pipeline design and implementation |
| [LOGIN_4] | [Name 4] | Developer | Frontend components, Docker configuration, deployment pipeline |

> **Note for evaluators:** This project was developed by a team of [3/4/5] members.
> All team members contributed to both the mandatory part and the chosen modules.

---

## Project Management

### Work Organization

The team divided the project into two phases:

1. **Planning (Week 1):** Defining the project concept, choosing modules,
   setting up the repository structure, and distributing responsibilities.
2. **Development (Weeks 2–4):** Parallel workstreams — backend/AI pipeline
   and frontend/infrastructure — with daily synchronization.

### Task Distribution

- Tasks were tracked using **GitHub Issues** with labels by category
  (backend, frontend, AI, devops, docs).
- Each feature was developed on a dedicated branch and merged via pull requests,
  requiring at least one review from another team member.

### Communication

- **Primary channel:** Discord (dedicated server with channels per feature area)
- **Weekly meetings:** Video calls every Monday to review progress and plan
  the upcoming week
- **Code reviews:** All pull requests reviewed before merging to main

---

## Technical Stack

### Frontend

| Technology | Version | Justification |
|---|---|---|
| React | 18 | Component-based architecture with a mature ecosystem; required as a Minor module |
| Vite | 6 | Fast build tool with hot module replacement for development |
| React Router DOM | 7 | Client-side routing without page reloads |
| Vanilla CSS | — | Custom design system with CSS variables; full control without framework overhead |

### Backend

| Technology | Version | Justification |
|---|---|---|
| Django | 5.2 | Batteries-included web framework; built-in ORM, auth, and admin; required as a Minor module |
| Django REST Framework | 3.18 | Simplifies building REST APIs with Django; provides token auth, serializers, and throttling |
| Django Channels | — | Extends Django with WebSocket support for real-time features |
| LangGraph | 1.2 | Stateful pipeline orchestration for chaining AI models with checkpointing and error recovery |
| Pydantic v2 | 2.13 | Schema validation between pipeline stages — ensures data integrity across AI model outputs |
| Gunicorn | 23 | Production-grade WSGI server for serving the Django application |

### AI / Machine Learning

| Model | Provider | Role |
|---|---|---|
| RT-DETR-L | Ultralytics (local) | Food image validation — runs locally, no API cost |
| Gemini 3 Flash | Google (via Replicate) | Structured visual analysis of food images |
| Flux 2 Max | Black Forest Labs (via Replicate) | High-quality food image generation |

### Infrastructure

| Technology | Justification |
|---|---|
| PostgreSQL 17 | Robust relational database with strong Django ORM support |
| Docker Compose | Single-command deployment with isolated, reproducible environments |
| Nginx | Reverse proxy, HTTPS termination, and static file serving |
| Docker | Containerization for consistency across development and deployment |

---

## Database Schema

The database uses PostgreSQL with Django's built-in ORM. The schema consists of
the following tables:

### `auth_user` (Django built-in)
Stores user account information.

| Field | Type | Description |
|---|---|---|
| `id` | Integer (PK) | Auto-incremented user ID |
| `username` | VARCHAR(150) | Unique username |
| `email` | VARCHAR(254) | User email address |
| `password` | VARCHAR(128) | Salted hash (PBKDF2 + SHA256) |
| `is_active` | Boolean | Account active status |
| `date_joined` | Timestamp | Account creation date |

### `authtoken_token` (DRF Token Auth)
Maps authentication tokens to users.

| Field | Type | Description |
|---|---|---|
| `key` | VARCHAR(40) (PK) | The authentication token |
| `user_id` | Integer (FK → auth_user) | Token owner |
| `created` | Timestamp | Token creation date |

### `api_generation`
Stores each image generation request and its results.

| Field | Type | Description |
|---|---|---|
| `id` | Integer (PK) | Auto-incremented ID |
| `user_id` | Integer (FK → auth_user) | The user who made the request |
| `original_image` | VARCHAR (file path) | Path to the uploaded food image |
| `generated_image` | VARCHAR(1000) | URL of the AI-generated image |
| `prompt` | JSON | The structured prompt used for Flux generation |
| `status` | VARCHAR(20) | Pipeline status (`pending`, `completed`, `failed`) |
| `created_at` | Timestamp | Request creation date |

### Relationships

```
auth_user (1) ──── (N) api_generation
auth_user (1) ──── (1) authtoken_token
```

---

## Features List

| Feature | Description | Implemented by |
|---|---|---|
| User registration | Create an account with username, email, and password | [LOGIN] |
| User login | Authenticate with token-based session | [LOGIN] |
| Food image upload | Upload JPEG/PNG/WebP images up to 10MB | [LOGIN] |
| RT-DETR validation | Reject non-food images before hitting paid APIs | [LOGIN] |
| Gemini analysis | Extract structured visual data from food photos | [LOGIN] |
| Flux image generation | Generate professional food images from analysis | [LOGIN] |
| Image regeneration | Reuse previous analysis to generate a new result | [LOGIN] |
| Generation history | View all past uploads and generated images | [LOGIN] |
| Protected routes | Frontend guards that redirect unauthenticated users | [LOGIN] |
| HTTPS-only access | Nginx redirects all HTTP to HTTPS | [LOGIN] |
| Privacy Policy page | Accessible without login, covers data practices | [LOGIN] |
| Terms of Service page | Accessible without login, covers usage rules | [LOGIN] |
| Docker Compose deployment | Full stack starts with `docker compose up` | [LOGIN] |

---

## Modules

The project accumulates a total of **[X] points** from the following modules.
A minimum of 14 points is required.

| Module | Category | Type | Points | Status |
|---|---|---|---|---|
| Frontend (React) + Backend (Django) | Web | Major | 2 | ✅ Implemented |
| Use an ORM for the database | Web | Minor | 1 | ✅ Django ORM |
| LLM System Interface (Gemini + Flux pipeline) | AI | Major | 2 | ✅ Implemented |
| File Upload and Management | Web | Minor | 1 | 🔧 In progress |
| Progressive Web App (PWA) | Web | Minor | 1 | 🔧 In progress |
| Standard User Management | User Management | Major | 2 | 🔧 In progress |
| User Interaction (chat + profiles + friends) | Web | Major | 2 | 🔧 In progress |
| Real-time features (WebSockets) | Web | Major | 2 | 🔧 In progress |
| Notification System | Web | Minor | 1 | 🔧 In progress |
| **Total** | | | **14** | |

### Module Justifications

**Major: Frontend (React) + Backend (Django) — 2 pts**
The project uses React (with Vite) for the frontend and Django with Django REST
Framework for the backend. Both are full frameworks providing routing, state
management, and ecosystem tooling (React) and ORM, authentication, and API
scaffolding (Django).

**Minor: ORM — 1 pt**
All database interactions in the backend go through Django's ORM (`Model.objects.*`).
No raw SQL queries are used anywhere in the application.

**Major: LLM System Interface — 2 pts**
The core feature of the application is an LLM-powered image generation pipeline.
Users provide food images as input; the system generates enhanced images as output.
The pipeline handles streaming via LangGraph checkpointing, implements rate limiting
via DRF throttling (10 requests/hour per user), and includes structured error
handling at each pipeline stage with Pydantic validation.

**Minor: File Upload and Management — 1 pt**
Users can upload food images (JPEG, PNG, WebP) up to 10MB. The system validates
file type and size on both the client and server sides. Images are stored securely
in a Docker volume with access controlled by authentication tokens. Users can
delete individual generations from their history.

**Minor: PWA — 1 pt**
The application includes a web manifest and service worker that enable installation
as a standalone app and basic offline caching of static assets.

**Major: Standard User Management — 2 pts**
Users can update their profile information, upload a custom avatar (with a default
provided), add other users as friends, see their online status, and view profile
pages for other users.

**Major: User Interaction — 2 pts**
The application includes a basic chat system enabling direct messaging between
users, a profile system for viewing user information, and a friends system for
managing connections.

**Major: Real-time Features (WebSockets) — 2 pts**
The chat system uses Django Channels (WebSockets) for real-time message delivery.
Connections are handled gracefully on disconnect, and messages are broadcast
efficiently to both participants.

**Minor: Notification System — 1 pt**
Users receive in-app notifications for key events: image generation completed,
friend request received, friend request accepted, and new chat messages.

---

## Individual Contributions

### [LOGIN_1] — Product Owner & Developer

- Defined the overall product concept and feature prioritization
- Implemented [features/components worked on]
- Responsible for [specific area]
- Challenges: [describe a challenge and how it was resolved]

### [LOGIN_2] — Project Manager & Developer

- Organized weekly sprints and tracked progress via GitHub Issues
- Implemented [features/components worked on]
- Responsible for [specific area]
- Challenges: [describe a challenge and how it was resolved]

### [LOGIN_3] — Tech Lead & Developer

- Designed the overall system architecture and AI pipeline
- Implemented the RT-DETR integration and LangGraph pipeline
- Led code reviews and established coding standards
- Challenges: Ensuring reliable data flow between three AI models with different
  output formats — solved by introducing Pydantic schemas at each stage

### [LOGIN_4] — Developer

- Implemented [features/components worked on]
- Responsible for Docker Compose configuration and Nginx HTTPS setup
- Challenges: [describe a challenge and how it was resolved]

---

## Known Limitations

- The SSL certificate is self-signed (not issued by a CA), so browsers will show
  a security warning on first access. This is expected for a local academic project.
- The AI pipeline can take 30–120 seconds to complete, depending on Replicate
  API response times.
- Rate limiting is set to 10 generations per user per hour to manage API costs.
- Image generation requires an active Replicate API token with sufficient credits.
