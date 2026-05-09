# Terminal Agent AI

## About This Project
This project is a streaming chatbot application powered by Langchain and OpenAI integrations. It features a TypeScript-based architecture with a focus on modular design for extensible AI interactions.

## Key Features
- Real-time streaming chat interface
- OpenAI model integration
- Environment configuration via `.env`
- TypeScript typing system
- Modular component structure
- ScaliaNLP model handling

## Getting Started
### Prerequisites
1. Node.js (16.x or higher)
2. npm or pnpm package manager
3. OpenAI API key
4. Python 3.8+ (for model dependencies)

### Installation
```bash
# Install dependencies
pnpm install

# Copy environment template
cp .env.example .env

# Build project
pnpm build
```

### Configuration
Update the `.env` file with your OpenAI API key:
```env
OPENAI_API_KEY=your_api_key_here
MODEL_ENGINE=openai
```

## Project Structure
```
src/                # Source code directory
├─ index.ts          # Main application entry point
├─ model/            # Model handling utilities
├─ prompt/           # Prompt templates and management
├─ tools/            # Utility scripts
├─ types/            # TypeScript type definitions
├─ ui/               # Web interface components
.config/             # Configuration files
├─ tsconfig.json      # TypeScript configuration
├─ .env               # Environment variables
```

## Dependencies
**Core Dependencies:**
- @langchain/core@^1.1.45
- @langchain/openai@^1.4.5
- boxen@^8.0.1
- chalk@^5.6.2
- dotenv@^17.4.2
- prompt-sync@^4.2.0

**Development Dependencies:**
- @types/node@^25.6.2
- tsx@^4.21.0
- typescript@^6.0.3

## Running the Application
```bash
# Start development server
pnpm start

# Build production version
pnpm build
```

## License
ISC License

## Contributing
Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Submit a pull request

All contributions must comply with the LICENSE and CONTRIBUTING guidelines.