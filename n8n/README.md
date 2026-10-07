# ARCH_TECH n8n Workflows

## Garnier Assistant Multi-Workflow Architecture

The Garnier Assistant is structured into two modular, interacting workflows:

1. **Workflow 1: Chat Orchestrator** (`n8n/workflows/garnier-assistant-chat.json`)
   - Webhook: `POST /webhook/garnier-assistant`
   - Health Check: `GET /webhook/garnier-assistant-health`
   - Validates requests, normalizes conversation history and locale (`es` / `en`), calls Workflow 2 for project data, builds grounded prompt context, runs the LLM chain, and returns structured responses.

2. **Workflow 2: Project Tools** (`n8n/workflows/garnier-assistant-project-tools.json`)
   - Trigger: `Execute Workflow Trigger` (sub-workflow architecture called by Workflow 1)
   - Supports tool operations: `project_info`, `project_progress`, `project_documents`, `project_approvals`, `project_analytics`, `bim_metadata`, `user_context`, `navigation_context`.
   - Fetches live data from local JSON Server on port 3001 with embedded ARCH_TECH catalog fallback.

3. **Project Automation** (`n8n/project-automation.json`)
   - Webhook: `POST /webhook/arch-tech-automation`
   - Handles project lifecycle events (`project.created`, `project.updated`, `approval.requested`).

## Local Environment & URLs

Configure in `.env.development`:
```bash
VITE_API_BASE_URL=http://localhost:3001
VITE_N8N_AI_WEBHOOK_URL=http://localhost:5678/webhook/garnier-assistant
VITE_N8N_AUTOMATION_WEBHOOK_URL=http://localhost:5678/webhook/arch-tech-automation
```

## Contracts

### Garnier Assistant Chat Request
```json
{
  "userPrompt": "Tell me about the current project.",
  "messages": [],
  "locale": "en",
  "role": "client",
  "route": "/portal/project/zona-franca-la-lima",
  "projectId": "zona-franca-la-lima",
  "context": {},
  "tools": []
}
```

### Garnier Assistant Chat Response
```json
{
  "success": true,
  "message": "...",
  "intent": "conversation",
  "toolRequest": null,
  "requestId": "req_...",
  "error": null
}
```

### Health Check Response
```json
{
  "success": true,
  "status": "ok",
  "service": "Garnier Assistant"
}
```
