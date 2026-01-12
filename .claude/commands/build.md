---
description: Unified planning and execution pipeline - from idea to working code
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, TodoWrite, AskUserQuestion, WebSearch
---

# Build Command

Unified pipeline: **Idea → Research → Multiple Solutions → Choose Simplest → Implement → Validate → Done**

**Philosophy: Minimal code through maximum research. The best code is code you don't write. Your first solution is never right—always explore multiple approaches and choose the simplest.**

Use this for any project idea, prompt, or existing plan. Handles the full cycle.

---

## PHASE 0: INPUT DETECTION

Analyze what user provided:

**A) Raw idea/prompt** → Go to Phase 1 (Planning)
**B) Existing plan file** → Go to Phase 2 (Execution)
**C) Partial implementation** → Assess state, resume from appropriate phase

```
If .claude/plans/ contains relevant plan:
  → Ask: "Found existing plan. Resume execution or start fresh?"

If kernel/state.md mentions in-progress work:
  → Ask: "Found in-progress work. Continue or start new?"
```

---

## PHASE 1: PLANNING

### 1.1 Goal Extraction

Parse the input to extract:
```
GOAL: [What are we building?]
CONSTRAINTS: [Limitations, requirements, must-haves]
INPUTS: [What do we have to work with?]
OUTPUTS: [What should exist when done?]
DONE-WHEN: [How do we know it's complete?]
```

### 1.2 Research & Documentation (CRITICAL FIRST STEP)

**This phase is MANDATORY and must be completed before proceeding to assumptions or design.**

**Execute the research command:** `/research "{goal/feature description}"`

The research command will:
- Find existing packages/solutions (never reinvent the wheel)
- Research official documentation and diverse community sources
- Document the simplest, most popular solution
- Document common pitfalls, their causes, prevention, and fixes
- Create `.claude/research/{feature-name}-research.md` with comprehensive findings

**Key requirements:**
- Must find existing packages/libraries that solve the problem
- Must compare multiple solutions and choose the simplest
- Must consult at least 3 different source types
- Must document at least 3-5 common pitfalls with fixes
- Must prioritize popular, well-maintained packages (1M+ weekly downloads for npm)

**After research completes:**
- Review the research document's recommended solution
- This knowledge will inform all subsequent decisions
- Reference it during assumption confirmation, design, and implementation

### 1.3 Assumption Extraction

List ALL assumptions across:
- Tech stack (languages, frameworks, versions)
- File locations (where code lives, where to create)
- Naming conventions (casing, patterns)
- Error handling approach
- Test expectations
- Dependencies

**STOP and confirm assumptions with user before proceeding.**

**When confirming assumptions, reference the research document to validate assumptions against known pitfalls.**

### 1.4 Solution Exploration (CRITICAL - NEVER SKIP)

**Your first solution is never right. Always explore multiple approaches.**

Generate at least 3 different solutions:

**Solution 1: {Approach Name}**
- How: {brief description}
- Code required: ~{X} lines
- Dependencies: {list}
- Pros: {why it's good}
- Cons: {why it might not be best}
- Complexity: {simple/medium/complex}

**Solution 2: {Approach Name}**
- How: {brief description}
- Code required: ~{X} lines
- Dependencies: {list}
- Pros: {why it's good}
- Cons: {why it might not be best}
- Complexity: {simple/medium/complex}

**Solution 3: {Approach Name}**
- How: {brief description}
- Code required: ~{X} lines
- Dependencies: {list}
- Pros: {why it's good}
- Cons: {why it might not be best}
- Complexity: {simple/medium/complex}

**Decision:**
- Chosen: Solution {X}
- Why: {why this is the simplest, most reliable}
- Rejected: {why others were rejected}

**Evaluation criteria (in order of importance):**
1. **Minimal code** - Fewest lines, simplest logic
2. **Popular package** - Most downloads = most battle-tested
3. **Reliability** - Fewer edge cases, fewer bugs
4. **Maintenance** - Active maintenance, clear docs
5. **Performance** - Only matters if it's a bottleneck

### 1.5 Investigation

Before designing:
```
1. Check research doc for recommended solution
2. Search codebase: Glob + Grep for similar implementations
3. Read relevant files: Understand current architecture
4. Check dependencies: What's available? What needs installing?
```

**During investigation, cross-reference findings with the research document to avoid known pitfalls.**

### 1.6 Interface Design

Define minimal contracts BEFORE implementation:
```
- Function signatures (inputs, outputs, errors) - keep simple
- Data structures (types, schemas) - use existing types when possible
- API contracts (endpoints, payloads) - follow existing patterns
- File structure (what goes where) - minimal new files
```

**When designing interfaces, incorporate best practices and avoid pitfalls identified in research. Prefer existing patterns over new abstractions.**

### 1.7 Mental Simulation

Walk through the chosen solution mentally:
```
1. Trace happy path end-to-end
2. Identify edge cases
3. Spot potential failures
4. Verify integration points connect
5. Count lines of code - can we reduce?
```

**During mental simulation, actively check against the research document's pitfalls list. Question complexity - if it seems complex, reconsider.**

### 1.8 Plan Output

Write plan to `.claude/plans/{feature-name}.md`:

```markdown
# Plan: {Feature Name}

## Goal
{one sentence}

## Done-When
- [ ] {criterion 1}
- [ ] {criterion 2}

## Solution
**Chosen:** {package/approach name}
**Why:** {why simplest}
**Code:** ~{X} lines
**Deps:** {list packages}

See `.claude/research/{feature-name}-research.md` for alternatives considered.

## Steps
1. [ ] {step 1}
2. [ ] {step 2}
3. [ ] {step 3}

## Validate
- [ ] {test 1}
- [ ] {test 2}

---
Created: {timestamp}
Status: READY FOR EXECUTION
```

**Keep plans concise. If it's longer than 50 lines, you're overthinking.**

### 1.9 Critical Review (LAST LINE OF DEFENSE)

**Before implementation, tear the plan apart.**

**Execute:** `/tearitapart .claude/plans/{feature-name}.md`

This will:
- Review the plan from a world-class stranger's perspective
- Find potential long-term issues, scalability problems, maintenance concerns
- Identify simpler alternatives that might have been missed
- Catch architectural issues before code is written

**After review:**
- If critical issues found: Update plan, then re-review
- If concerns found: Address or acknowledge, then proceed
- If clean: Proceed to implementation

**Ask user: "Plan ready. Should I tear it apart first, or proceed to execution?"**

---

## PHASE 2: EXECUTION

**Recommended: Use `/execute .claude/plans/{feature-name}.md` for advanced execution with:**
- Cross-plan verification
- Aggressive self-awareness
- Continuous review and debug
- Comprehensive HOW/WHY documentation

**Or proceed with standard execution below:**

### 2.1 Setup

```
1. Create/switch to feature branch (if not on one)
2. Load plan into TodoWrite for tracking
3. Read kernel/state.md for context
4. Verify prerequisites (dependencies, tools)
```

### 2.2 Iterative Implementation

**Philosophy: Every line of code is liability. Delete code that doesn't earn its place.**

For each step in the plan:

```
BEFORE:
  - Mark step as in_progress in todo
  - State what you're about to do
  - Review research document for recommended solution
  - Check: Can this be done with fewer lines? Is there a simpler way?

DURING:
  - Use the recommended package/solution from research
  - Make minimal, focused changes
  - One logical unit per commit
  - Follow existing patterns exactly
  - Actively avoid pitfalls documented in research
  - Question complexity: If it feels complex, stop and reconsider

AFTER:
  - Verify change works (run relevant test/check)
  - Count lines added - can we reduce?
  - Check if any documented pitfalls occurred (if so, apply documented fix)
  - Mark step as completed
  - **Commit immediately** (see CLAUDE.md for commit guidelines)
  - Update plan file with progress
```

**Commit Guidelines (from CLAUDE.md):**
- Commit after every logical unit (2-5 file changes typically)
- Use conventional commit format: `type(scope): subject`
- Group by feature/concept, not by file type
- Keep commits small, focused, and independently useful
- Never accumulate >10 file changes without committing

### 2.3 Integration Checkpoints

After every 2-3 steps:
```
- Run test suite (if exists)
- Check for type errors (if typed language)
- Verify no regressions
- Confirm integration points still work
```

---

## PHASE 3: VALIDATION

### 3.1 Automated Checks

Run all applicable:
```bash
# Detect and run project's test suite
[ -f package.json ] && npm test
[ -f pyproject.toml ] && pytest
[ -f Cargo.toml ] && cargo test
[ -f go.mod ] && go test ./...

# Detect and run linters
[ -f .eslintrc* ] && npm run lint
[ -f pyproject.toml ] && ruff check . || flake8
[ -f rustfmt.toml ] && cargo fmt --check

# Detect and run type checks
[ -f tsconfig.json ] && npx tsc --noEmit
[ -f pyproject.toml ] && mypy . || true
```

### 3.2 Manual Verification

Walk through done-when criteria:
```
For each criterion in plan:
  - Verify it's actually met
  - Document how it was verified
  - If not met, add remediation step
```

### 3.3 Edge Case Check

```
Test at least 3 edge cases:
1. Empty/null input
2. Boundary conditions
3. Error/failure path
```

---

## PHASE 4: COMPLETION

### 4.1 Update State

Update `kernel/state.md`:
```
- What was built
- Key decisions made
- Any technical debt introduced
- Follow-up items (if any)
```

### 4.2 Update Plan

Mark plan as complete:
```markdown
---
Status: COMPLETED
Completed: {timestamp}
---
```

### 4.3 Final Report

Output summary:
```
BUILD COMPLETE

Feature: {name}
Branch: {branch-name}
Commits: {count}

Files Changed:
  - {file1}: {what changed}
  - {file2}: {what changed}

Validation:
  - Tests: {pass/fail/skip}
  - Lint: {pass/fail/skip}
  - Types: {pass/fail/skip}
  - Done-when: {all criteria met}

Next Steps:
  - [ ] Review changes: git diff main
  - [ ] Create PR: /ship
  - [ ] {any follow-up items}
```

---

## FAILURE HANDLING

### If implementation fails:
```
1. STOP immediately
2. Check research document for this specific error/pitfall
3. If documented fix exists, apply it
4. If not documented:
   - Question: Is there a simpler solution we missed?
   - Search for solution (add to research doc)
   - Consider: Should we use a different package/approach?
   - Document what failed and why
   - Add to research doc as new pitfall with fix
5. Rollback to last known good state
6. Re-evaluate: Is our chosen solution still the simplest?
7. Update plan with findings
8. Ask user: "Continue with modified approach or explore simpler alternative?"
```

### If solution feels too complex:
```
1. STOP and question: Why is this complex?
2. Check research doc: Did we miss a simpler package?
3. Search: "{problem} simple solution" or "{problem} minimal code"
4. Consider: Can we use a different approach with less code?
5. Re-evaluate all solutions from Step 1.4
6. Choose simpler alternative if found
```

### If tests fail:
```
1. Identify failing test
2. Diagnose: is it the code or the test?
3. Fix the root cause (not symptoms)
4. Re-run full validation
```

### If blocked:
```
1. Document the blocker
2. List what's needed to unblock
3. Ask user for input
4. Do NOT guess or work around silently
```

---

## USAGE EXAMPLES

```
# From raw idea
/build "Add user authentication with JWT"

# From existing plan
/build .claude/plans/auth-feature.md

# Resume interrupted work
/build --resume

# Quick mode (skip confirmations)
/build --quick "Add a logout button"
```

---

## BEHAVIOR FLAGS

- **Default**: Full flow with confirmations at each phase gate
- **--quick**: Skip assumption confirmation, minimal prompts
- **--plan-only**: Stop after Phase 1, don't execute
- **--resume**: Detect and continue in-progress work
- **--validate-only**: Skip to Phase 3, run checks on current state
