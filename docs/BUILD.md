# How this repo was built

This portfolio app was **spec-driven with AI assistance** (Cursor) and then hardened by hand for interview defensibility.

## What I own (and will defend in interviews)

- Trust boundaries: Zod request/response schemas, classification refusal, length caps
- LLM contracts: prompt versions, structured output validation, deterministic score weights
- Observability: Braintrust tracing when configured; eval fixtures in `evals/`
- Federal capability accuracy notes in `docs/federal-capabilities.md`
- Product decisions: what is LLM-generated vs static (compliance matrix), demo scope

## What codegen accelerated

- shadcn/ui scaffolding, page layout chrome, PDF layout, initial screen wiring

## What deliberately is not here

- LangGraph agents, hybrid RAG, or MCP servers — this demo has no retrieval/agent use case worth the complexity
- Durable multi-instance rate limiting — documented as best-effort for a public portfolio demo
