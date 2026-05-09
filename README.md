# 20_streaming_chatbot

A Node.js streaming chatbot application using TypeScript, LangChain, and OpenAI integrations.

## Features
- Real-time streaming chat interface
- Integration with OpenAI models
- TypeScript-based architecture
- Environment configuration support (.env)
- Modular component structure

## Installation
1. Clone the repository
2. Install dependencies:
   ```
   pnpm install
   ```

## Running the Application
1. Ensure environment variables are set in `.env`
2. Build the application:
   ```
   pnpm build
   ```
3. Start the chatbot:
   ```
   pnpm start
   ```

## Project Structure
```
src/            # Source code
model/           # Model definitions
prompt/          # Prompt templates
ui/              # User interface components
package.json     # Project metadata
README.md        # This documentation
```