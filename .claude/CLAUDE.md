# Video Background Filter — Technical Assessment

**TIER:** 2
**STACK:** Python (Flask, OpenCV, MediaPipe) + React (TypeScript, Tailwind)
**DOMAIN:** Full-stack video processing application

---

## Project Constraints

- **Time-bound**: 2-3 hour technical assessment
- **Dual-stack**: Backend (Flask) and Frontend (React) equally weighted
- **Real-time processing**: Video filters must apply with minimal latency
- **User experience matters**: Product engineer role — polish counts

### Technical Stack

**Backend:**
- Flask for API/streaming
- OpenCV for video/image processing
- MediaPipe (or similar) for person segmentation
- flask-cors for CORS handling

**Frontend:**
- React 18 + TypeScript
- Tailwind CSS
- @mediapipe/selfie_segmentation available
- lucide-react for icons

---

## Core Philosophy

### Minimal Code Through Maximum Research

**The best code is code you don't write.**

- **Never reinvent the wheel** - If you're about to write custom code, you haven't researched enough
- **Your first solution is never right** - Always explore multiple approaches (minimum 3) before choosing
- **Popular = reliable** - Most downloads/stars means most battle-tested. Prefer packages with 1M+ weekly downloads
- **Simplicity wins** - Fewer lines = fewer bugs = easier maintenance
- **Every line is liability** - Config > code. Native > custom. Existing > new. Delete code that doesn't earn its place

### Solution Selection Criteria (in order)

1. **Minimal code** - Fewest lines, simplest logic
2. **Popular package** - Most downloads = most battle-tested
3. **Reliability** - Fewer edge cases, fewer bugs
4. **Maintenance** - Active maintenance, clear docs
5. **Performance** - Only matters if it's a bottleneck

---

## Coding Rules (Project-Specific)

### Tier 2 Requirements

```
CORRECTNESS > SPEED
Working first attempt beats fast iteration + debug cycles.
Mental simulation catches 80% of bugs before execution.

EVERY LINE IS LIABILITY
Config > code. Native > custom. Existing > new.
Delete code that doesn't earn its place.
```

### Git Workflow: Continuous Commits

**AI must commit automatically while working. User should never commit manually.**

**Commit Frequency:**
- Commit after every logical unit of work (2-5 file changes typically)
- Commit when a feature/concept/section is complete
- Commit before switching to a different area of code
- Never accumulate more than ~10 file changes without committing

**Commit Grouping Logic:**
- Group by feature/concept (e.g., "Add video upload UI" = one commit)
- Group by layer (e.g., "Add backend upload endpoint" = separate commit)
- Group by refactor scope (e.g., "Extract video validation logic" = one commit)
- Never mix unrelated changes in one commit

**Commit Message Format (Conventional Commits):**

```
<type>(<scope>): <subject>

<body (optional)>

<footer (optional)>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code restructuring (no behavior change)
- `docs`: Documentation only
- `style`: Formatting, missing semicolons, etc. (no code change)
- `test`: Adding/updating tests
- `chore`: Build process, dependencies, config

**Examples:**
```
feat(video): add file upload input component

- Add file input with video/* accept attribute
- Create object URL for selected video
- Add error handling for invalid file types

feat(backend): implement video upload endpoint

- Accept multipart/form-data with video files
- Validate file type and size (max 100MB)
- Return video ID and URL for frontend use

fix(video): revoke object URLs on component unmount

Prevents memory leaks when video changes or component
unmounts. Uses useEffect cleanup function.

refactor(filters): extract filter logic to utils module

Moves filter application logic from component to reusable
utility function for better testability.
```

**Commit Quality Checklist:**
- [ ] Single, clear purpose (one logical change)
- [ ] Small and focused (2-10 files typically)
- [ ] Message explains what and why (not just what)
- [ ] Follows conventional commit format
- [ ] Works in isolation (can be cherry-picked/reverted cleanly)
- [ ] No debug code, console.logs, or temporary files

### Testing Requirements

```
- [ ] Unit: core components (segmentation, filtering)
- [ ] Integration: video pipeline end-to-end
- [ ] Edge: empty frames, no face detected, CORS
- [ ] Manual: visual verification of filter quality
```

### Validation Protocol

**Pre-Write:**
- [ ] State what, why, dependencies
- [ ] Interfaces defined (inputs/outputs/errors)
- [ ] Done-when criteria explicit
- [ ] Working pattern found (check research substrate)
- [ ] Pause if anything unclear

**Pre-Commit:**
- [ ] Matches spec exactly? Nothing more?
- [ ] Connects to adjacent components?
- [ ] 3 edge cases confirmed?
- [ ] Types correct?

---

## Research Substrate

This project has a research substrate in the parent directory with debugging references:

```
../mediapipe/      — Segmentation issues, gotchas, solutions
../rembg/          — Alternative approach (onnxruntime issues)
../opencv/         — VideoCapture, memory, frame processing
../flask-streaming/ — MJPEG streaming, performance, production
../cors/           — Flask-CORS + React integration
../implementation/ — Alpha blending, filters, architecture
```

**Consult before debugging.** Search by error message or symptom.

---

## KERNEL: Self-Evolving Configuration

KERNEL progressively builds Claude Code config based on observed patterns.

### Pattern-to-Artifact Mapping

| When You Notice... | Create This |
|-------------------|-------------|
| Same multi-step workflow repeated 2+ times | `.claude/commands/workflow-name.md` |
| Task needing specialized expertise | `.claude/agents/specialist-name.md` |
| External service integration needed | Entry in `.mcp.json` |
| Pre/post processing on tool usage | Hook in `.claude/settings.json` |
| Domain capability used repeatedly | `.claude/skills/capability/SKILL.md` |
| User states explicit preference | `.claude/rules/topic.md` |

### Guidelines

- Conservative: Clear, repeated patterns only
- Minimal: Start simple
- Ask first: Confirm if unsure
- Check existing: Avoid duplicates
- **Read CONFIG-TYPES.md before creating artifacts**

### On-Demand Methodology

Methodology banks available via commands (zero token cost until used):

- `/discover` — Map codebase, populate state
- `/plan` — Get-it-right-first-time planning (loads PLANNING-BANK)
- `/debug` — Systematic diagnosis (loads DEBUGGING-BANK)
- `/review` — Correctness validation (loads REVIEW-BANK)
- `/branch` — Create worktree for isolated development
- `/ship` — Commit, push, create PR
- `/parallelize` — Set up multiple worktrees for parallel streams

### Living Knowledge

- `kernel/state.md` — Current project reality (read first when uncertain)
- `kernel/banks/` — Methodology references (load via commands)
- `.claude/rules/` — Project patterns (evolves over time)

---

## Relationship to User-Level Config

Universal principles (philosophy, git workflow, defaults) live in `~/.claude/CLAUDE.md`.
This file contains PROJECT-SPECIFIC additions that take precedence.

**Full precedence chain:**
1. This file (project-specific, highest priority)
2. ~/.claude/CLAUDE.md (universal principles)
3. Plugin defaults (lowest priority)

---

Generated by KERNEL `/kernel:init`
Source: CODING-PROMPT-BANK v1.1
Last updated: 2026-01-12
