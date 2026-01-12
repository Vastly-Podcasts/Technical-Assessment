---
description: Execute a plan with aggressive self-awareness, cross-plan verification, and continuous improvement
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, TodoWrite, AskUserQuestion
---

# Execute Command

**🎯 Mission: Transform a plan into working code while catching every issue, questioning every decision, and documenting everything.**

This is not just "implement the plan." This is **execution with aggressive self-awareness**—questioning, verifying, improving, and documenting at every step.

---

## THE EXECUTION MINDSET

### Aggressive Self-Awareness

**You must constantly ask:**
- "Is this really the simplest way?"
- "Am I creating technical debt right now?"
- "Will this break when X happens?"
- "Does this conflict with other plans/features?"
- "Am I following the research recommendations?"
- "Is this code maintainable in 6 months?"

**You are not just implementing. You are:**
- A critic questioning your own work
- A future maintainer who will curse your decisions
- A teammate checking for conflicts
- A reviewer catching issues before they're committed

### Execution Principles

1. **Question before you code** - Every change should be questioned
2. **Verify against everything** - Plans, research, reviews, other features
3. **Document the why** - Not just what you did, but why you did it
4. **Catch issues early** - Review and debug continuously, not at the end
5. **Improve as you go** - If you find a better way, take it (and document why)

---

## PRE-EXECUTION: CROSS-PLAN VERIFICATION

### Step 0.1: Load Context

```
1. Read the plan: `.claude/plans/{feature-name}.md`
2. Read the research: `.claude/research/{feature-name}-research.md` (if exists)
3. Read the review: `.claude/reviews/{feature-name}-teardown.md` (if exists)
4. Read kernel/state.md for project context
5. Load plan into TodoWrite for tracking
```

### Step 0.2: Cross-Plan Verification (CRITICAL)

**Check for conflicts with other plans/features:**

```
1. List all plans in `.claude/plans/`
2. For each plan, check:
   - Does it touch the same files?
   - Does it use the same dependencies?
   - Does it create conflicting patterns?
   - Does it solve a similar problem differently?
   - Will changes conflict with this plan?

3. Check existing code:
   - Are there similar features already implemented?
   - Are we duplicating functionality?
   - Are we creating inconsistent patterns?
```

**Document findings:**
- Create `.claude/execution/{feature-name}-cross-check.md`
- List any conflicts or overlaps
- Decide: proceed, coordinate, or adjust

**If conflicts found:**
- Stop and ask user: "Found potential conflicts with {other-plan}. How should we proceed?"
- Options: adjust this plan, coordinate changes, or proceed with awareness

### Step 0.3: Review Concerns Integration

**If a teardown review exists:**

```
1. Read all critical issues from review
2. For each critical issue:
   - Is it addressed in the plan? If not, add it
   - How will we address it during implementation?
   - Document the approach

3. For each concern:
   - Acknowledge it in the plan
   - Decide: address now or document for later
   - If addressing: add to implementation steps
```

**Update plan with:**
- Section: "Review Concerns Addressed"
- For each concern: how we're addressing it, why this approach

### Step 0.4: Setup

```
1. Create/switch to feature branch (if not on one)
2. Verify prerequisites (dependencies, tools)
3. Check git status (clean working directory)
4. Create execution log: `.claude/execution/{feature-name}-log.md`
```

---

## EXECUTION: ITERATIVE WITH SELF-AWARENESS

### Step 1: Pre-Step Self-Check

**Before starting each step:**

```
1. Mark step as in_progress in todo
2. State what you're about to do
3. Ask yourself:
   - Is this the simplest approach? (Check research doc)
   - Does this conflict with existing code?
   - Will this create technical debt?
   - Am I following the recommended solution from research?
   - Is there a simpler way I'm missing?

4. Review relevant sections:
   - Research doc for recommended approach
   - Review doc for concerns about this step
   - Existing code for patterns to follow
```

### Step 2: Implementation with Continuous Questioning

**While implementing:**

```
1. Use the recommended package/solution from research
2. Make minimal, focused changes
3. Question every decision:
   - "Why am I doing it this way?"
   - "Is there a simpler approach?"
   - "Will this scale?"
   - "Is this maintainable?"

4. If you find a better way:
   - STOP
   - Document why the new approach is better
   - Update the plan with the change and rationale
   - Proceed with better approach

5. Actively avoid pitfalls from research doc
6. Follow existing patterns exactly (unless you have a good reason not to)
```

### Step 3: Post-Step Verification

**After each step:**

```
1. Verify change works (run relevant test/check)
2. Self-review:
   - Count lines added - can we reduce?
   - Is this code clear? Will others understand it?
   - Did I introduce any complexity?
   - Are there edge cases I'm missing?

3. Check for documented pitfalls (apply fixes if needed)
4. Update execution log with:
   - What was done
   - HOW it was done (approach, patterns used)
   - WHY it was done this way (rationale, trade-offs)
   - Any deviations from plan and why

5. Mark step as completed in todo
```

### Step 4: Commit with Documentation

**Commit immediately after each logical unit:**

```
1. Commit with conventional message (see CLAUDE.md)
2. Update plan file:
   - Mark step as complete
   - Add "Implementation Notes" section:
     * What was implemented
     * How it was implemented (approach)
     * Why this approach (rationale, alternatives considered)
     * Any deviations from plan and why
     * Lessons learned

3. Update execution log with commit hash and summary
```

**Commit message should include context:**
```
feat(video): add file upload input component

Implements video file selection using native File API and
object URLs. Chose this approach over backend upload for
simplicity and to avoid server-side file handling complexity.

- Add file input with video/* accept attribute
- Create object URL for selected video
- Add error handling for invalid file types

Rationale: Research showed native File API is simplest for
client-side preview. Object URLs avoid need for temporary
server storage. Error handling prevents crashes on invalid
files.
```

---

## CONTINUOUS REVIEW & DEBUG

### Step 5: Micro-Reviews (After Every 2-3 Steps)

**Don't wait until the end. Review continuously:**

```
1. Run `/review` command on changed files
   - This catches issues early
   - Fix issues immediately, don't accumulate

2. Check integration:
   - Do changed files integrate correctly?
   - Are there type errors?
   - Do tests still pass?
   - Are there regressions?

3. Self-question:
   - Is the code getting complex?
   - Are we deviating from the plan too much?
   - Should we pause and reconsider?

4. If issues found:
   - Run `/debug` if needed
   - Fix issues
   - Document what went wrong and why
   - Update plan with lessons learned
```

### Step 6: Mid-Execution Checkpoint

**After ~50% of steps complete:**

```
1. Review overall progress:
   - Are we on track?
   - Have we discovered better approaches?
   - Are there concerns we should address?

2. Re-read the teardown review:
   - Are we addressing the concerns?
   - Have we introduced new issues?
   - Should we adjust course?

3. Check cross-plan conflicts again:
   - Have other plans changed?
   - Are we still compatible?

4. Update plan with:
   - Progress summary
   - Any course corrections
   - Rationale for changes
```

---

## POST-EXECUTION: COMPREHENSIVE REVIEW

### Step 7: Full Review

**After all steps complete:**

```
1. Run `/review` on all changed files
   - Fix any issues found
   - Document fixes in execution log

2. Run `/tearitapart` on the implementation
   - Review actual code, not just plan
   - Find issues we missed
   - Address critical issues before completion

3. Check against original plan:
   - What changed and why?
   - Are deviations documented?
   - Is the plan updated with actual implementation?
```

### Step 8: Debug if Needed

**If review finds issues:**

```
1. Run `/debug` to systematically diagnose
2. Fix root causes, not symptoms
3. Document:
   - What went wrong
   - Why it went wrong
   - How it was fixed
   - How to prevent it in the future
```

### Step 9: Documentation Update

**Update all documentation with HOW and WHY:**

**Update Plan:**
```markdown
## Implementation Summary

### What Was Built
{Summary of what was implemented}

### How It Was Built
{Approach, patterns, architecture decisions}

### Why This Approach
{Rationale, trade-offs, alternatives considered}

### Deviations from Plan
- {Deviation 1}: {What changed} - {Why}
- {Deviation 2}: {What changed} - {Why}

### Lessons Learned
- {Lesson 1}: {What we learned and why it matters}
- {Lesson 2}: {What we learned and why it matters}
```

**Update Research Doc:**
```markdown
## Implementation Experience

### What Worked
- {Thing 1}: {Why it worked well}

### What Didn't Work
- {Thing 1}: {Why it didn't work, what we did instead}

### Actual Code Required
{Actual lines of code, not estimate}

### Real-World Pitfalls Encountered
- {Pitfall}: {What happened, how we fixed it}
```

**Update Execution Log:**
```markdown
## Final Summary

### Implementation Approach
{How we actually built it}

### Key Decisions
- {Decision 1}: {Why we made this choice}
- {Decision 2}: {Why we made this choice}

### Issues Encountered
- {Issue 1}: {What happened, how we fixed it, why it happened}
- {Issue 2}: {What happened, how we fixed it, why it happened}

### What We'd Do Differently
- {Thing 1}: {Why}
- {Thing 2}: {Why}
```

**Update kernel/state.md:**
- What was built
- Key decisions and rationale
- Patterns established
- Technical debt introduced (if any)
- Follow-up items

---

## EXECUTION LOG TEMPLATE

Create `.claude/execution/{feature-name}-log.md`:

```markdown
# Execution Log: {Feature Name}

**Started:** {timestamp}
**Plan:** `.claude/plans/{feature-name}.md`
**Research:** `.claude/research/{feature-name}-research.md`
**Review:** `.claude/reviews/{feature-name}-teardown.md`

---

## Cross-Plan Verification

**Plans Checked:**
- {Plan 1}: {Conflict/overlap status}
- {Plan 2}: {Conflict/overlap status}

**Conflicts Found:**
- {Conflict}: {How resolved}

---

## Review Concerns Addressed

### Critical Issues
- {Issue 1}: {How addressed, why this approach}

### Concerns
- {Concern 1}: {How addressed or acknowledged}

---

## Implementation Steps

### Step 1: {Step Name}
**What:** {What was done}
**How:** {Approach, patterns used}
**Why:** {Rationale, trade-offs}
**Commit:** {hash} - {message}
**Issues:** {Any issues encountered and how resolved}
**Deviations:** {Any deviations from plan and why}

### Step 2: {Step Name}
{Repeat structure}

---

## Continuous Reviews

### Review 1 (After Step 3)
**Issues Found:**
- {Issue}: {How fixed}

### Review 2 (After Step 6)
{Repeat}

---

## Final Review

**Review Command Output:**
{Results from /review}

**Tear-It-Apart Review:**
{Results from /tearitapart on implementation}

**Issues Found:**
- {Issue}: {How fixed, why it happened}

---

## Final Summary

**Implementation Approach:**
{How we actually built it}

**Key Decisions:**
- {Decision}: {Why}

**What Worked:**
- {Thing}: {Why}

**What Didn't Work:**
- {Thing}: {Why, what we did instead}

**Lessons Learned:**
- {Lesson}: {Why it matters}

**Completed:** {timestamp}
```

---

## EXECUTION QUALITY CHECKLIST

Before marking execution complete:

```
✓ Cross-plan verification done
✓ Review concerns addressed or acknowledged
✓ Every step documented with HOW and WHY
✓ Continuous reviews performed (not just at end)
✓ All issues from reviews fixed
✓ Plan updated with actual implementation
✓ Research doc updated with real-world experience
✓ Execution log complete
✓ kernel/state.md updated
✓ All commits have clear messages with context
✓ Code is simpler than when we started (or complexity justified)
✓ No technical debt introduced (or explicitly documented)
```

---

## USAGE

### Execute a Plan
```
/execute .claude/plans/video-upload.md
```

### Execute Current Plan
```
/execute
```
(Assumes most recent plan)

### Execute with Skip Reviews
```
/execute --skip-reviews
```
(Not recommended, but available for quick fixes)

---

## THE DIFFERENCE

**This is not just "implement the plan."**

This is:
- **Cross-verified** against other plans
- **Self-aware** at every step
- **Continuously reviewed** (not just at the end)
- **Thoroughly documented** with HOW and WHY
- **Continuously improved** (better approaches taken when found)
- **Issue-caught** early through micro-reviews
- **Comprehensive** in addressing review concerns

**This brings execution to the next level.**