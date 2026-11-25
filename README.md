# Nexus 🧠
### Your Personal Knowledge Base — Capture, Connect, and Retrieve Knowledge

Nexus is a personal knowledge management system designed to transform scattered information from digital sources into a unified, searchable knowledge base.

Useful information is constantly distributed across YouTube videos, Instagram content, articles, documents, links, and personal notes. Finding that information again often requires revisiting the original source and manually searching through its contents.

Nexus aims to solve this problem by capturing information, extracting meaningful content, indexing it, and making it retrievable through a centralized knowledge system.

The core idea is simple: **Don't just save content. Preserve the knowledge inside it.**

---

## 🎯 Problem Statement

Most digital content platforms are optimized for consuming information, not retaining or retrieving it.

Consider a YouTube video containing a useful technical explanation. Saving its URL does not preserve the actual knowledge in a searchable form. Finding that explanation later requires remembering the video, navigating to it, and locating the relevant section.

Nexus addresses this problem by:

- Bringing information from different sources into one centralized knowledge base.
- Extracting textual information from video content.
- Converting unstructured content into searchable representations.
- Indexing information for semantic retrieval.
- Making previously captured knowledge accessible when needed.

## ✨ Core Features

### 1. Unified Knowledge Capture
A centralized workspace for collecting information from different digital sources, including notes, links, documents, and media content.

### 2. Video Content Ingestion
One of the central workflows focuses on extracting knowledge from online videos.

The ingestion process uses:
- Video transcripts to capture the actual spoken information.
- Video descriptions to preserve contextual information and metadata.
- Extracted textual content as input for downstream indexing.

This makes the information inside video content available to the knowledge retrieval system rather than leaving it accessible only through the original media.

### 3. Knowledge Indexing
Extracted information is processed and indexed in the knowledge base.

The system uses embedding-based representations to support semantic retrieval, allowing information to be discovered based on meaning rather than relying exclusively on exact keyword matches.

### 4. Knowledge Retrieval
Previously captured information can be retrieved from the knowledge base when needed.

The objective is to make the system function as a personal knowledge layer that helps users rediscover information they have encountered and saved.

### 5. AI Integration
The project supports configurable AI-provider integrations for language-model operations and embedding generation.

The documented original configuration uses Google's Gemini ecosystem, with optional alternatives for different AI operations.

---

## 🏗️ Architecture & Technology Stack

Nexus follows a TypeScript-based monorepo architecture, separating the frontend, backend, and shared application components.

| Layer | Technologies |
|---|---|
| Frontend | React, TypeScript, Vite |
| Styling | Tailwind CSS, Radix UI |
| Data Fetching | TanStack Query |
| Routing | Wouter |
| Backend | Node.js, Express 5, TypeScript |
| Database | Supabase / PostgreSQL |
| Authentication | Supabase Auth, Google OAuth |
| Database ORM | Drizzle ORM |
| AI / LLM | Google Gemini |
| Embeddings | Gemini Embedding Models |
| Optional AI Providers | OpenAI, Anthropic |
| Video Processing Integrations | Supadata, Groq |
| Testing | Playwright |
| Package Management | pnpm Workspaces |

*Note: Some integrations are optional provider configurations documented in the repository and are not necessarily active in every deployment.*

---

## 🔄 Video Ingestion & Retrieval Workflow

The video-content workflow is designed to transform media into searchable knowledge.

```text
        Video Source
     (YouTube / Instagram)
              |
              v
       Content Ingestion
              |
       +------+------+
       |             |
       v             v
   Transcript     Description
   Extraction     Extraction
       |             |
       +------+------+
              |
              v
       Text Processing
              |
              v
      Embedding Generation
              |
              v
       Knowledge Index
              |
              v
       Semantic Retrieval
              |
              v
      Relevant Information
```

### Why transcripts and descriptions?

Both provide complementary information:

- **Transcripts:** Preserve the actual spoken content, explanations, and technical details.
- **Descriptions:** Provide additional context, summaries, and source-related information.

Combining these representations creates a richer knowledge base than simply storing video URLs or descriptions.

---

## 📁 Project Structure

The repository follows a monorepo structure.

```text
nexus/
│
├── artifacts/
│   ├── second-brain/       # Frontend application
│   └── api-server/         # Backend API
│
├── lib/
│   └── shared/             # Shared application logic
│
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.json
└── README.md
```

The frontend and backend are maintained as separate workspace applications, with shared components and contracts organized within the monorepo.

---

## 🚀 Getting Started

### Prerequisites

- Node.js
- pnpm
- Supabase project
- Google OAuth configuration (if using Google authentication)
- AI provider API credentials

### Installation

Clone the repository:

```bash
git clone https://github.com/Bhuvanesh66/nexus.git

cd nexus
```

Install dependencies:

```bash
pnpm install
```

### Environment Configuration

Configure the environment variables required by the frontend and backend.

Typical configuration categories include:

- Supabase project URL and credentials.
- Google authentication configuration.
- AI provider API keys.
- Database connection settings.
- Optional video-processing provider credentials.

Refer to the repository's configuration and application code for the exact variable names and required values.

### Development

Start the application using the scripts defined in the root package configuration:

```bash
pnpm dev
```

For type checking:

```bash
pnpm check
```

For end-to-end testing, use the configured Playwright test scripts.

---

## 🧩 Engineering Challenges

### 1. Converting Unstructured Media into Searchable Knowledge

Video content is inherently unstructured. Extracting transcripts and descriptions and converting them into a consistent representation suitable for indexing was a central technical challenge.

### 2. Building a Retrieval-Oriented Knowledge Layer

Simply storing information is insufficient. The system needs to make previously captured information discoverable through semantic representations and retrieval.

### 3. Handling Different Content Sources

Different platforms expose information through different mechanisms. Building an ingestion workflow that can accommodate variations in transcript availability and content structure requires careful handling.

### 4. Source-Aware Information Retrieval

The original source needs to remain associated with the extracted information so that retrieved knowledge can be traced back to its origin.

---

## 🔮 Future Improvements

Nexus is currently a personal project and has not been publicly released. The next phase focuses on evolving it into a product that can be evaluated through actual user interaction.

Planned improvements include:

- **UI/UX Refinement:** Improve visual consistency, navigation, responsiveness, and overall usability.
- **Public Beta Release:** Make Nexus accessible to real users and gather feedback on the core experience.
- **Retrieval Optimization:** Experiment with chunking strategies, hybrid search, and reranking to improve retrieval relevance.
- **Ingestion Reliability:** Improve error handling, retries, duplicate detection, and transcript extraction fallbacks.
- **Source Attribution:** Make it easier to trace retrieved information back to its original video or document.
- **Evaluation Framework:** Measure retrieval relevance, answer accuracy, and source-grounding quality.
- **Scalability:** Improve processing efficiency, observability, and reliability as the knowledge base grows.

---

## 🎯 Project Vision

The long-term vision of Nexus is to build a personal knowledge infrastructure that allows people to retain and retrieve information independently of where they originally encountered it.

Instead of repeatedly consuming the same content to rediscover useful information, users should be able to capture knowledge once and access it whenever they need it.

**Nexus — Your knowledge, connected and retrievable.**

---

