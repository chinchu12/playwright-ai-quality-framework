# 🤖 Playwright AI Quality Framework

> **AI-assisted QA automation with Playwright, TypeScript, Ollama and Gemma 3**

A practical QA/SDET portfolio project demonstrating how AI can support test automation through **self-healing locators, failure classification, DOM evidence validation, audit logging, and CI/CD**.

---

## 🚀 What This Framework Does

When a Playwright locator fails, the framework:

1. Captures the failure context
2. Collects relevant DOM evidence
3. Classifies the failure using AI
4. Generates a possible replacement locator
5. Validates the suggestion against the real DOM
6. Checks confidence and action compatibility
7. Retries the Playwright action
8. Generates an audit log and incident report

### Healing Flow

```text
Playwright Test
      ↓
Locator Fails
      ↓
Failure Context Collector
      ↓
AI Failure Classification
      ↓
AI Locator Suggestion
      ↓
DOM + Guardrail Validation
      ↓
Confidence Check
      ↓
Retry Action
      ↓
Audit + Incident Report


✨ Key Features
🤖 AI-powered locator healing
🧠 AI failure classification
🔍 DOM evidence collection
🛡️ Confidence-based guardrails
✅ Action-aware validation
🔁 Deterministic fallback logic
🧾 Healing audit logs
📄 Markdown incident reports
⚙️ Configurable AI mode
🚀 GitHub Actions CI/CD
🧱 Page Object Model architecture

🧪 Supported Self-Healing Actions
| Action               | Status |
| -------------------- | ------ |
| `safeClick()`        | ✅      |
| `safeFill()`         | ✅      |
| `safeCheck()`        | ✅      |
| `safeSelectOption()` | ✅      |


🎯 Supported Locator Strategies
The AI healing engine can recover using:
role
label
placeholder
testId
css

Priority:
role
  ↓
label
  ↓
placeholder
  ↓
testId
  ↓
css

🧠 Example: AI Self-Healing
Broken locator

page.getByRole('textbox', {
  name: 'Search products'
});

Actual DOM
<input
  id="product-search"
  type="text"
  aria-label="Product search"
  placeholder="Search catalogue"
/>

AI suggestion
{
  "strategy": "placeholder",
  "name": "Search catalogue",
  "confidence": 0.98,
  "reason": "The input element has the placeholder Search catalogue."
}
Framework retry
page.getByPlaceholder('Search catalogue');
✅ Test continues successfully.


🛡️ AI Guardrails
The framework does not blindly trust AI output.
Every healing suggestion must pass deterministic validation.
Confidence Threshold
HEALING_CONFIDENCE_THRESHOLD=0.9
Low-confidence suggestions are rejected.
DOM Evidence Validation
The proposed locator value must exist in the captured DOM evidence.
Action Compatibility
Examples:
fill()         → input / textarea / textbox / combobox
check()        → checkbox
selectOption() → select / combobox
click()        → button / link / clickable element
A fill() action will never be allowed to heal to a button or link.
Deterministic Fallback
If the model identifies the correct target but misses the role, the framework can infer it:
<a>                     → link
<button>                → button
<input type="text">     → textbox
<input type="checkbox"> → checkbox
<input type="radio">    → radio
<select>                → combobox
<textarea>              → textbox


🧠 Failure Classification
Failures can be classified as:
AUTOMATION_DEFECT
PRODUCT_DEFECT
ENVIRONMENT_FAILURE
TEST_DATA_FAILURE
FLAKY_TEST
UNKNOWN
Example:
{
  "category": "AUTOMATION_DEFECT",
  "confidence": 0.95,
  "reason": "The failed locator no longer matches the current DOM."
}


🏗️ Project Architecture

playwright-ai-quality-framework/

├── ai/
│   ├── analysis/
│   ├── failure-context/
│   ├── healing/
│   ├── providers/
│   └── reporting/
│
├── config/
│   └── ai-config.ts
│
├── pages/
│   ├── base-page.ts
│   ├── home-page.ts
│   ├── search-page.ts
│   ├── preferences-page.ts
│   └── profile-page.ts
│
├── tests/
│   └── ui/
│       ├── home-page.spec.ts
│       ├── search-page.spec.ts
│       ├── preferences-page.spec.ts
│       ├── profile-page.spec.ts
│       └── smoke.spec.ts
│
├── .github/
│   └── workflows/
│       └── playwright.yml
│
├── .env.example
├── playwright.config.ts
├── tsconfig.json
├── package.json
└── README.md

⚙️ Configuration


Create a local .env file:
AI_HEALING_ENABLED=true
OLLAMA_URL=http://localhost:11434/api/generate
OLLAMA_MODEL=gemma3:4b
HEALING_CONFIDENCE_THRESHOLD=0.9
LOCATOR_TIMEOUT_MS=3000
.env is ignored by Git. Use .env.example as the safe template.

🤖 Local AI Setup


This project currently uses:
Ollama
Gemma 3 4B
Pull the model:
ollama pull gemma3:4b
Check installed models:
ollama list


▶️ Running the Project


Install dependencies:
npm ci
Install Playwright:
npx playwright install
Run TypeScript validation:
npx tsc --noEmit
Run all AI healing tests locally:
npx playwright test --project=chromium
Run CI-compatible tests only:
npx playwright test \
  --project=chromium \
  --grep-invert "@ai-healing"

  🧪 Demo Scenarios

| Scenario                | Action           | Healing                         |
| ----------------------- | ---------------- | ------------------------------- |
| Broken link locator     | `click()`        | Role recovery                   |
| Broken search input     | `fill()`         | Placeholder / semantic recovery |
| Broken checkbox         | `check()`        | Checkbox recovery               |
| Broken country selector | `selectOption()` | Combobox recovery               |


📊 Healing Audit

Healing attempts are recorded under:
test-results/healing-audit/
The audit includes:
original locator
healing strategy
healed locator
confidence
failure classification
result
timestamp


📄 Incident Reports

Incident reports are generated under:
test-results/incident-reports/
They include:
failed test
URL
failure classification
original locator
healed locator
AI reasoning
confidence
screenshot path
healing result
recommended action


⚙️ Configurable AI Mode

AI can be enabled or disabled:
AI_HEALING_ENABLED=true
When disabled:
Playwright failure
      ↓
AI skipped
      ↓
Original Playwright error preserved
This prevents AI from becoming a single point of failure.


🚀 CI/CD
GitHub Actions runs:
Checkout
   ↓
Node setup
   ↓
npm ci
   ↓
Install Chromium
   ↓
TypeScript validation
   ↓
Playwright smoke tests
   ↓
Upload report


🧭 Design Philosophy
AI proposes
     ↓
DOM evidence validates
     ↓
Framework rules decide
     ↓
Playwright executes
     ↓
Reports preserve traceability
The goal is not to let AI control automation.
The goal is to use AI as a controlled assistant inside a deterministic QA framework.


🔮 Planned Enhancements


Zod schema validation
additional healing actions
smarter candidate ranking
AI provider abstraction
dedicated AI-enabled CI job
API testing
failure history analysis
known-defect matching
n8n QA incident workflows
RAG-based QA knowledge search
Slack / Telegram / email notifications
performance testing integration

👩‍💻 Author
Reshma Chirakkal
QA Automation Engineer / SDET
GitHub:
https://github.com/chinchu12