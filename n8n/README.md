# ARCH_TECH n8n workflows

## Import

Import `ai-assistant.json` and `project-automation.json` from the n8n editor using **Import from File**. Activate each workflow only after assigning the required webhook URLs to the matching Vite variables.

## Credentials

The AI workflow requires an n8n LLM credential configured in its LLM node. The automation workflow has no external credential requirement. Do not commit API keys or webhook secrets.

## Contracts

AI request: `{ userPrompt, messages, tools, context }`. AI response: `{ message, toolCalls?: [{ toolName, args }] }`.

Automation request: `{ event, projectId, message?, metadata? }`, where `event` is `project.created`, `project.updated`, or `approval.requested`. Response: `{ success: boolean, notification?: { message, date? }, error?: string }`.

## Local verification

Set `VITE_N8N_AI_WEBHOOK_URL` and `VITE_N8N_AUTOMATION_WEBHOOK_URL`, restart Vite, then use the BIM Assistant or create/update/request approval controls in the Admin portal.

The repository validates the workflow JSON structure and frontend contracts only. Live LLM execution requires an imported workflow, deployed webhook and configured n8n credential; no live n8n pass is claimed here.

## Failure behavior

Unavailable or malformed webhooks surface an error and preserve the deterministic offline AI provider or local portal state. No write tool is executed remotely without the existing confirmation gate.
