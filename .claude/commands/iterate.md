---
description: Continuous improvement mode - analyze, improve, and iterate on existing code
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, TodoWrite, WebSearch
---

# Iterate Command

**🔄 Mission: Make existing code better, simpler, faster, and more bulletproof through continuous iteration.**

This command analyzes existing features/components/projects, identifies improvements, and implements them. It's designed to be run repeatedly—there's always more to improve.

**Philosophy:** Small, incremental improvements compound. Focus on immediate UX impact. Don't overengineer. Make it bulletproof, not just working.

---

## THE ITERATION MINDSET

### Core Principles

1. **Deep understanding first** - You can't improve what you don't understand
2. **Code reduction is king** - Less code = fewer bugs = easier maintenance
3. **Bulletproof, not just working** - Production-ready means handling edge cases, errors, security
4. **Immediate UX impact** - Small improvements that users notice now
5. **Long-term maintainability** - Code that's easy to understand and modify in 6 months
6. **Iterate forever** - There's always more to improve

### What to Look For

**Code Reduction:**
- Duplication (DRY violations)
- Opportunities for centralization
- Modularization possibilities
- Unused code
- Over-abstraction (simplify)

**Performance:**
- Latency improvements
- Unnecessary re-renders/recomputations
- Memory leaks
- Inefficient algorithms
- Bundle size reduction

**Robustness:**
- Missing error handling
- Edge cases not handled
- Input validation gaps
- Security vulnerabilities
- Race conditions

**Maintainability:**
- Hard-to-understand code
- Magic numbers/strings
- Poor naming
- Tight coupling
- Missing documentation

**User Experience:**
- Accessibility issues
- Console logs in production
- Error messages (user-friendly?)
- Loading states
- Responsive design

---

## ITERATION WORKFLOW

### Phase 1: Deep Understanding

#### Step 1.1: Identify Target

**Input:** Feature, component, file, or directory to iterate on

**Actions:**
```
1. Identify the target (file, component, feature, directory)
2. Create iteration workspace: `.claude/iterations/{target-name}/`
3. Create understanding document: `understanding.md`
4. Create improvement log: `improvements.md`
5. Create iteration history: `history.md`
```

#### Step 1.2: Deep Code Analysis

**Read and understand everything:**

```
1. Read the target code completely
2. Read all related files (imports, dependencies)
3. Read tests (if they exist)
4. Read documentation (if it exists)
5. Trace execution flow
6. Understand data flow
7. Identify all dependencies
8. Map component relationships
```

**Document understanding in `understanding.md`:**

```markdown
# Understanding: {Target Name}

**Analyzed:** {timestamp}
**Target:** {file/component path}

---

## Purpose
{What does this code do? What problem does it solve?}

## Architecture
{How is it structured? What are the main components?}

## Data Flow
{How does data flow through this code?}

## Dependencies
- {Dependency 1}: {Why it's needed, how it's used}
- {Dependency 2}: {Why it's needed, how it's used}

## Key Functions/Components
### {Function/Component 1}
- **Purpose:** {What it does}
- **Inputs:** {What it takes}
- **Outputs:** {What it returns}
- **Side effects:** {Any side effects}
- **Complexity:** {Simple/Medium/Complex}

### {Function/Component 2}
{Repeat structure}

## Current Patterns
- {Pattern 1}: {How it's used}
- {Pattern 2}: {How it's used}

## Known Issues
- {Issue 1}: {What's wrong}
- {Issue 2}: {What's wrong}

## Performance Characteristics
- {Characteristic 1}: {Current state}
- {Characteristic 2}: {Current state}

## Security Considerations
- {Consideration 1}: {Current state}
- {Consideration 2}: {Current state}
```

#### Step 1.3: Cross-Reference Analysis

**Check for patterns across codebase:**

```
1. Search for similar code patterns
2. Find duplicate logic
3. Identify shared utilities that could be used
4. Check for inconsistent patterns
5. Find related features that could share code
```

**Document findings in `understanding.md` under "Codebase Context"**

---

### Phase 2: Improvement Identification

#### Step 2.1: Code Reduction Analysis

**Aggressively find DRY violations:**

```
1. Search for duplicate code blocks
2. Identify repeated patterns
3. Find opportunities for:
   - Utility functions
   - Shared components
   - Centralized configuration
   - Common error handling
   - Shared validation logic

4. Look for:
   - Magic numbers/strings (extract to constants)
   - Repeated calculations (extract to functions)
   - Duplicate logic (centralize)
   - Similar components (consolidate)
```

**Document in `improvements.md`:**

```markdown
# Improvements: {Target Name}

**Identified:** {timestamp}

---

## Code Reduction Opportunities

### Duplication 1: {Description}
**Location:** {File:Line}
**Duplicated in:** {File:Line, File:Line}
**Impact:** {Lines that could be reduced}
**Approach:** {How to centralize}
**Priority:** High/Medium/Low

### Duplication 2: {Description}
{Repeat structure}

### Centralization Opportunities
- {Opportunity 1}: {What to centralize, where, why}
- {Opportunity 2}: {What to centralize, where, why}

### Modularization Opportunities
- {Opportunity 1}: {What to extract, why}
- {Opportunity 2}: {What to extract, why}
```

#### Step 2.2: Performance Analysis

**Identify performance improvements:**

```
1. Check for:
   - Unnecessary re-renders/recomputations
   - Inefficient loops/algorithms
   - Memory leaks
   - Large bundle sizes
   - Slow API calls
   - Blocking operations

2. Measure (if possible):
   - Current latency
   - Bundle size
   - Memory usage
   - Render times
```

**Document in `improvements.md` under "Performance Improvements"**

#### Step 2.3: Robustness Analysis

**Find reliability issues:**

```
1. Error handling:
   - Missing try/catch
   - Unhandled promise rejections
   - Missing error boundaries
   - Silent failures

2. Edge cases:
   - Null/undefined handling
   - Empty arrays/objects
   - Boundary conditions
   - Invalid inputs

3. Security:
   - Input validation
   - XSS vulnerabilities
   - CSRF protection
   - Sensitive data exposure
   - Dependency vulnerabilities
```

**Document in `improvements.md` under "Robustness Improvements"**

#### Step 2.4: Maintainability Analysis

**Find maintainability issues:**

```
1. Code clarity:
   - Unclear variable names
   - Complex functions (should be split)
   - Magic numbers/strings
   - Missing comments for complex logic

2. Structure:
   - Tight coupling
   - Circular dependencies
   - God objects/functions
   - Poor separation of concerns
```

**Document in `improvements.md` under "Maintainability Improvements"**

#### Step 2.5: UX Analysis

**Find user experience improvements:**

```
1. Accessibility:
   - Missing ARIA labels
   - Keyboard navigation
   - Screen reader support
   - Color contrast
   - Focus management

2. Production issues:
   - Console.log statements
   - Debug code
   - Test data
   - Development-only code

3. User feedback:
   - Error messages (user-friendly?)
   - Loading states
   - Success feedback
   - Empty states
```

**Document in `improvements.md` under "UX Improvements"**

#### Step 2.6: Prioritization

**Prioritize improvements by immediate UX impact:**

```markdown
## Prioritized Improvement Plan

### High Priority (Immediate UX Impact)
1. {Improvement}: {Why it matters, estimated impact}
2. {Improvement}: {Why it matters, estimated impact}

### Medium Priority (Quality of Life)
1. {Improvement}: {Why it matters}
2. {Improvement}: {Why it matters}

### Low Priority (Nice to Have)
1. {Improvement}: {Why it matters}
2. {Improvement}: {Why it matters}
```

**Criteria:**
- High: Users notice immediately, security issues, critical bugs
- Medium: Code quality, maintainability, performance (non-critical)
- Low: Nice-to-have, future-proofing, minor optimizations

---

### Phase 3: Research (If Needed)

#### Step 3.1: Research Best Practices

**Only research if needed for improvements:**

```
1. For each high-priority improvement:
   - Is there a best practice we should follow?
   - Is there a better technique/library?
   - Research only if unclear

2. Use `/research` command with token budget
3. Document findings in `research.md`
```

**Research should be minimal - focus on understanding first, research only when needed.**

---

### Phase 4: Improvement Implementation

#### Step 4.1: Create Improvement Plan

**For each prioritized improvement, create implementation plan:**

```markdown
## Implementation Plan

### Improvement 1: {Title}
**Priority:** High/Medium/Low
**Impact:** {What users will notice}
**Approach:** {How to implement}
**Files to modify:** {List}
**Estimated lines changed:** {Reduction/increase}
**Risk:** Low/Medium/High

**Steps:**
1. [ ] {Step 1}
2. [ ] {Step 2}
3. [ ] {Step 3}

**Validation:**
- [ ] {How to verify it works}
- [ ] {How to verify improvement}
```

#### Step 4.2: Implement Improvements

**Implement one improvement at a time:**

```
BEFORE:
1. Read the improvement plan
2. Understand the current code
3. Check for conflicts with other improvements
4. Verify approach is still valid

DURING:
1. Make minimal, focused changes
2. Follow existing patterns
3. Question: Is this the simplest way?
4. Document why you're doing it this way

AFTER:
1. Verify improvement works
2. Verify no regressions
3. Measure improvement (if applicable)
4. Update understanding.md if architecture changed
5. Commit with clear message
6. Update improvements.md with actual results
7. Update history.md with what was done
```

**Commit message format:**
```
refactor({scope}): {improvement description}

{What was improved and why}

- {Change 1}
- {Change 2}

Impact: {Lines reduced, performance improved, etc.}
```

#### Step 4.3: Continuous Validation

**After each improvement:**

```
1. Run tests (if they exist)
2. Check for type errors
3. Verify functionality still works
4. Check for regressions
5. Measure improvement (if applicable)
```

---

### Phase 5: Documentation & Logging

#### Step 5.1: Update Understanding

**If architecture changed, update understanding.md:**

```markdown
## Changes Made
- {Change 1}: {What changed, why}
- {Change 2}: {What changed, why}

## Updated Architecture
{If structure changed, document new structure}
```

#### Step 5.2: Update Improvement Log

**Document what was actually done:**

```markdown
## Implemented Improvements

### {Improvement 1}
**Implemented:** {timestamp}
**What:** {What was done}
**How:** {How it was implemented}
**Why:** {Why this approach}
**Results:**
- Lines reduced: {X}
- Performance: {improvement}
- Impact: {user-visible change}

### {Improvement 2}
{Repeat structure}
```

#### Step 5.3: Update History

**Keep iteration history:**

```markdown
# Iteration History: {Target Name}

## Iteration 1: {Date}
**Focus:** {What was improved}
**Improvements:**
- {Improvement 1}
- {Improvement 2}

**Results:**
- Lines of code: {before} → {after}
- Performance: {improvements}
- Issues fixed: {list}

## Iteration 2: {Date}
{Repeat structure}
```

---

## ITERATION QUALITY CHECKLIST

Before marking iteration complete:

```
✓ Deep understanding documented
✓ All improvements identified and prioritized
✓ High-priority improvements implemented
✓ Code is simpler (or complexity justified)
✓ No regressions introduced
✓ Security issues addressed
✓ Console logs removed (production)
✓ Accessibility improved (if applicable)
✓ Understanding.md updated
✓ Improvements.md updated
✓ History.md updated
✓ All changes committed with clear messages
```

---

## USAGE

### Iterate on a File
```
/iterate frontend/src/components/VideoPlayer.tsx
```

### Iterate on a Component
```
/iterate VideoPlayer
```

### Iterate on a Feature
```
/iterate video-upload
```

### Iterate on a Directory
```
/iterate frontend/src/utils
```

### Continue Previous Iteration
```
/iterate --continue
```
(Continues from last iteration workspace)

---

## ITERATION WORKSPACE STRUCTURE

```
.claude/iterations/
  {target-name}/
    understanding.md      # Deep understanding of code
    improvements.md       # Identified improvements
    research.md          # Research findings (if any)
    history.md            # Iteration history
    plan.md              # Current improvement plan (if in progress)
```

---

## THE ITERATION PHILOSOPHY

**This command is designed to be run repeatedly.**

Every time you run it:
- You understand the code deeper
- You find new improvements
- You make it better incrementally
- You document everything

**Small improvements compound.**
- 10 lines reduced here
- 5% performance improvement there
- One security fix
- One accessibility improvement

**Over time, these add up to:**
- Significantly less code
- Much better performance
- More robust, secure code
- Better user experience

**Don't try to perfect everything in one go.**
- Focus on high-impact improvements
- Make it better, not perfect
- Document what you find
- Come back and iterate again

**The goal is continuous improvement, not perfection.**