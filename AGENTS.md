# AGENTS

This file defines how coding agents should contribute to this repository.

## Scope

- Prefer small, targeted edits.
- Match existing formatting and naming in nearby files.
- Keep behavior predictable and avoid adding extra abstractions unless requested.

## Primary Reference

- Use the brand hooks module as a style reference for structure and conventions:
  - components/brands/hooks/index.ts
- Treat that file as an example of format and flow, not as a source of feature-specific naming.

## API Hook Style

### 1. Function and Hook Pairing

- Each API function should be directly followed by its corresponding exported hook.
- Keep pairs in this order:
  1. create + mutation hook
  2. list + query hook
  3. get-by-id + query hook
  4. update + mutation hook
  5. delete + mutation hook

### 2. Keep Input Assumptions Simple

- Assume UI passes valid values unless the task explicitly asks for guards.
- Do not add superfluous prechecks, value parsing helpers, or normalization helpers by default.
- Pass typed values directly to requestApi body when possible.

### 3. Query Keys

- Use inline array keys, not key-builder objects.
- Key shape should be predictable and hierarchical.
- Preferred examples:
  - ["resource"]
  - ["resource", resourceId]
  - ["resource", resourceId, "children"]
  - ["resource", resourceId, "children", childId]

### 4. Mutation Invalidation

- Favor broad refetch for consistency unless explicitly asked for fine-grained cache updates.
- Invalidate top-level keys for resources impacted by the mutation.
- Keep invalidation explicit and inline inside onSuccess.

### 5. Error Handling

- For each requestApi call:
  - check response.success
  - throw Error(response.error ?? fallbackMessage) when false
  - return response.data as typed payload on success

### 6. Auth

- Set auth mode according to endpoint requirements.
- Use auth: "required" for protected routes.

## Types Style

- Keep endpoint payload and response types in the local feature types module.
- Reuse existing type names and payload wrappers for route params.
- Do not introduce extra generic utility types unless needed by multiple features.

## What To Avoid By Default

- No query-key factory objects.
- No speculative optimizations.
- No extra toast side effects unless requested.
- No runtime guards for optional ids when UI contract already guarantees valid ids.
- No feature-specific assumptions copied into unrelated modules.

## Contribution Checklist For Agents

1. Keep each API function directly above its hook.
2. Keep query keys inline and readable.
3. Keep mutation invalidation broad unless asked otherwise.
4. Match auth mode to route requirements.
5. Verify changed files have no TypeScript/editor errors.
6. Avoid unrelated refactors.
