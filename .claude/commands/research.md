---
description: Deep research phase - learn from others' mistakes before making your own
allowed-tools: Read, Write, Edit, WebSearch, AskUserQuestion
---

# Research Command

**Mindset: Find existing solutions before writing any code. The best code is code you don't write.**

The goal is to find the simplest, most reliable solution using proven packages and patterns. Research exists to prevent reinventing the wheel—someone has already solved your problem better than you will on the first try.

**Token Budget: ~2000-3000 tokens maximum. Plan first, execute deliberately, stop when you have enough.**

---

## THE RESEARCH MINDSET

### Core Philosophy: Minimal Code Through Maximum Research

**Why:** Every line of code is liability. Every dependency is maintenance. Every custom solution is a future bug. Research finds battle-tested solutions that eliminate code.

**Goal:** Find the most popular, well-maintained package or pattern that solves the problem with minimal code.

### Core Principles

1. **Never reinvent the wheel** - If you're about to write custom code, you haven't researched enough
2. **Popular = reliable** - Most downloads/stars means most battle-tested. Prefer npm packages with 1M+ weekly downloads over niche solutions
3. **Learn from others' pain** - Every GitHub issue represents a problem already solved
4. **Diversity beats depth** - Multiple perspectives reveal the simplest solution
5. **Question complexity** - If the solution seems complex, you haven't found the right package yet

### What Success Looks Like

After research, you should be able to answer:
- "What's the most popular package that solves this?" (check npm/pypi download stats)
- "What's the simplest way to implement this?" (prefer 5 lines over 50)
- "What are the 3 most common ways this breaks?" (so we can avoid them)
- "What's the maintenance burden?" (active maintenance, recent updates, large community)
- "Is there a built-in solution I'm missing?" (native APIs, framework features)

---

## SOURCE DIVERSITY REQUIREMENTS

**You MUST consult at least 3 different source types from the following categories:**

### Category 1: Official Sources
- Official documentation (primary framework/library docs)
- Official best practices guides
- Official migration/upgrade guides
- Official security advisories
- Official API reference documentation

### Category 2: Community Problem-Solving
- GitHub Issues (search for closed issues with solutions)
- Stack Overflow (prioritize accepted answers with high votes)
- GitHub Discussions (community Q&A)
- Reddit r/{technology} (search for "problem", "issue", "error")
- Discourse forums (if technology has one)

### Category 3: Real-World Experiences
- Personal blogs (developer experiences, war stories)
- Medium/Dev.to articles (tutorials that mention pitfalls)
- YouTube tutorials (comments often reveal issues)
- Company engineering blogs (how they solved problems at scale)
- Conference talks (transcripts or summaries)

### Category 4: Code Examples & Patterns
- GitHub repositories (search for "{technology} example" or "{technology} starter")
- CodeSandbox/CodePen examples
- Official example repositories
- Community-maintained example projects

### Category 5: Troubleshooting & Debugging
- Error message databases
- Debugging guides
- "Common mistakes" articles
- "Why X doesn't work" articles
- Troubleshooting wikis

**Minimum requirement: At least one source from 3 different categories above.**

---

## RESEARCH METHODOLOGY

### Token Budget & Efficiency

**Total Research Budget: ~2000-3000 tokens maximum**
- Planning phase: ~200 tokens
- Search execution: ~1500-2000 tokens (5-8 targeted searches)
- Documentation: ~500-800 tokens

**Efficiency Rules:**
- Plan all searches before executing any
- Each search must have a specific, well-defined purpose
- No random keyword searches - every query must be intentional
- Stop when you have enough information (don't over-research)
- Reuse information from one search to inform the next

---

### Step 1: Research Planning (MANDATORY - DO BEFORE ANY SEARCHES)

**Slow down. Plan first. Execute deliberately.**

Extract from the goal/feature:
```
PROBLEM: [What are we trying to solve?]
TECHNOLOGIES: [List all technologies/frameworks involved]
USE_CASE: [What are we trying to accomplish?]
INTEGRATION_POINTS: [What other systems does this connect to?]
VERSIONS: [What versions are we using?]
```

**Create a Research Plan:**

Document the plan before executing any searches:

```markdown
## Research Plan

### Goal
{What we're trying to find}

### Key Questions to Answer
1. {Question 1}
2. {Question 2}
3. {Question 3}

### Planned Searches (5-8 maximum)

#### Search 1: Existing Solutions
- **Purpose:** Find most popular package/library that solves {problem}
- **Query:** "{problem} npm package" or "{problem} python library"
- **Expected Result:** Package name, popularity stats, minimal code example
- **Token Budget:** ~200 tokens

#### Search 2: Official Documentation
- **Purpose:** Check if {technology} provides built-in solution
- **Query:** "{technology} {feature} official documentation"
- **Expected Result:** Built-in API or official pattern
- **Token Budget:** ~200 tokens

#### Search 3: Common Problems
- **Purpose:** Find most common pitfalls/errors
- **Query:** "{technology} {use case} common mistakes" or "{technology} {use case} error"
- **Expected Result:** 3-5 common pitfalls with fixes
- **Token Budget:** ~250 tokens

#### Search 4: {Specific Purpose}
- **Purpose:** {What specific information do we need?}
- **Query:** "{specific, targeted query}"
- **Expected Result:** {What we expect to find}
- **Token Budget:** ~200 tokens

... (continue for 5-8 total searches)

### Search Execution Order
1. {Search 1} - {Why first}
2. {Search 2} - {Why second}
3. {Search 3} - {Why third}
...

### Success Criteria
- [ ] Found at least 1 popular package/solution
- [ ] Found at least 3 common pitfalls with fixes
- [ ] Confirmed if built-in solution exists
- [ ] Have enough info to choose simplest solution
```

**STOP and review the plan. Only proceed when plan is complete and approved.**

### Step 2: Execute Planned Searches (IN ORDER)

**Execute searches one at a time, following the plan exactly.**

**For each search:**
1. Execute the planned query
2. Extract only relevant information (don't read entire pages)
3. Document findings immediately
4. Check if this answers the question - if yes, move on
5. If not, refine next search based on what you learned

**Search Execution Rules:**
- One search at a time
- Extract key information only (don't read full articles)
- Stop when you have the answer to that search's purpose
- Don't do additional "just in case" searches
- If a search doesn't yield results, refine the query and try once more

### Step 3: Existing Solutions Search (CRITICAL - DO THIS FIRST)

**This step should be in your research plan. Execute it as planned.**

**What to find:**
- **Most popular packages** - Check download stats (npm: weekly downloads, pypi: monthly downloads)
- **Official solutions** - Does the framework/library provide this out of the box?
- **Built-in APIs** - Native browser/Node/Python APIs that solve this
- **Minimal examples** - Find the simplest working code that solves the problem

**Document findings:**
- Package name + version
- Weekly/monthly download stats
- Lines of code needed (estimate)
- Maintenance status (last update, open issues)
- Why this is the simplest solution

**Stop when:** You have 1-2 viable package options with popularity stats.

### Step 4: Official Documentation Pass

**This step should be in your research plan. Execute it as planned.**

**What to capture:**
- **Built-in solutions** - Does the framework provide this natively?
- Official recommended patterns (prefer official over custom)
- Official warnings/deprecations

**Stop when:** You've confirmed whether a built-in solution exists.

### Step 5: Problem Discovery Pass

**This step should be in your research plan. Execute it as planned.**

**Search strategy (use ONE targeted query from your plan):**
**Use ONE targeted query from your plan. Don't do multiple variations.**

**What to capture:**
- 3-5 most common error messages
- Root causes
- Step-by-step fixes

**Stop when:** You have 3-5 common pitfalls documented with fixes.

### Step 6: Additional Planned Searches

**Execute remaining searches from your plan in order.**
**Stop when:** You've answered all key questions from Step 1.

---

## DOCUMENTATION STRUCTURE

Create research document at `.claude/research/{feature-name}-research.md`:

```markdown
# Research: {Feature Name}

**Research Date:** {date}
**Problem:** {what we're solving}
**Research Sources:** {count} sources across {count} categories

---

## Recommended Solution

**Package/Library:** {name} v{version}
**Why:** {why this is the simplest, most reliable solution}
**Popularity:** {download stats, stars, etc.}
**Code Required:** ~{X} lines
**Maintenance:** {active/stable/abandoned}
**Bundle Size:** {if applicable}

**Implementation:**
\`\`\`{language}
{minimal example code}
\`\`\`

**Source:** [Link](URL)

---

## Alternative Solutions Considered

### Option 2: {Package/Approach Name}
- **Pros:** {why it's good}
- **Cons:** {why we didn't choose it}
- **Popularity:** {stats}
- **Code Required:** ~{X} lines

### Option 3: {Package/Approach Name}
- **Pros:** {why it's good}
- **Cons:** {why we didn't choose it}
- **Popularity:** {stats}
- **Code Required:** ~{X} lines

---

## Technology Stack & Context
- {Technology 1}: {version} - {context/use case}
- {Technology 2}: {version} - {context/use case}
- Integration: {how technologies connect}

---

## Source Diversity Summary

### Official Sources (Category 1)
- [Source Title](URL) - {what it covers}
- [Source Title](URL) - {what it covers}

### Community Problem-Solving (Category 2)
- [Source Title](URL) - {problem it addresses}
- [Source Title](URL) - {problem it addresses}

### Real-World Experiences (Category 3)
- [Source Title](URL) - {key insight}
- [Source Title](URL) - {key insight}

### Code Examples (Category 4)
- [Source Title](URL) - {what pattern it shows}
- [Source Title](URL) - {what pattern it shows}

### Troubleshooting Resources (Category 5)
- [Source Title](URL) - {what it helps debug}
- [Source Title](URL) - {what it helps debug}

---

## Common Pitfalls & Fixes

### Pitfall 1: {Short descriptive name}
**Error/Symptom:**
```
{Exact error message or symptom description}
```

**What goes wrong:**
- {Clear description of the problem}
- {When/where it typically occurs}

**Why it happens:**
- {Root cause explanation}
- {Underlying technical reason}

**How to avoid (prevention):**
- {Preventive measures}
- {Best practices to follow}
- {Code patterns to use}

**Fix if it occurs:**
1. {Step-by-step solution}
2. {Code example if applicable}
3. {Configuration changes if needed}

**Sources:**
- [Official Doc](URL) - {what it says}
- [GitHub Issue #123](URL) - {community solution}
- [Stack Overflow Answer](URL) - {accepted fix}

**Confidence Level:** {High/Medium/Low} - {why}

---

### Pitfall 2: {Short descriptive name}
{Repeat structure above}

---

## Best Practices Identified

### From Official Sources
1. **{Practice Name}** - {Description}
   - Why: {Reasoning}
   - Source: [Link](URL)

2. **{Practice Name}** - {Description}
   - Why: {Reasoning}
   - Source: [Link](URL)

### From Community Experience
1. **{Practice Name}** - {Description}
   - Why: {Real-world benefit}
   - Source: [Link](URL)

---

## Version-Specific Considerations

### {Technology} {Version}
- **Breaking Changes:** {List}
- **New Features:** {Relevant ones}
- **Deprecations:** {What to avoid}
- **Migration Notes:** {How to upgrade}

### Compatibility Matrix
| Technology A | Technology B | Compatible? | Notes |
|-------------|--------------|-------------|-------|
| v1.0        | v2.0        | Yes         | Use feature X |
| v1.0        | v3.0        | No          | Breaking change Y |

---

## Security Considerations

### Known Vulnerabilities
- **{Vulnerability Name}** (CVE-XXXX-XXXX)
  - Impact: {What it affects}
  - Mitigation: {How to protect}
  - Source: [Link](URL)

### Security Best Practices
1. **{Practice}** - {Why it matters}
   - Implementation: {How to do it}
   - Source: [Link](URL)

---

## Performance Considerations

### Known Bottlenecks
- **{Bottleneck}** - {When it occurs}
  - Impact: {Performance cost}
  - Solution: {How to optimize}
  - Source: [Link](URL)

### Optimization Tips
1. **{Tip}** - {Expected improvement}
   - Implementation: {How to apply}
   - Source: [Link](URL)

---

## Integration Points to Watch

### {Integration Name}
- **Potential Issues:** {List}
- **Solutions:** {How to handle}
- **Examples:** [Link](URL)

---

## Contradictions & Conflicting Advice

**When sources disagree, document both sides:**

### Viewpoint A: {Summary}
- Source: [Link](URL)
- Context: {When this applies}
- Reasoning: {Why they recommend this}

### Viewpoint B: {Summary}
- Source: [Link](URL)
- Context: {When this applies}
- Reasoning: {Why they recommend this}

**Our Decision:** {Which to follow and why}

---

## Questions Unanswered

If research didn't fully answer something:
- {Question 1} - {What we still need to know}
- {Question 2} - {What we still need to know}

---

## Quick Reference: Error → Fix Lookup

| Error Message | Pitfall # | Quick Fix |
|--------------|-----------|-----------|
| "{error text}" | Pitfall 1 | {brief fix} |
| "{error text}" | Pitfall 2 | {brief fix} |

---

## Full Reference List

### Official Documentation
- [Title](URL) - {description}

### Community Resources
- [Title](URL) - {description}

### Blog Posts & Articles
- [Title](URL) - {description}

### GitHub Issues & Discussions
- [Title](URL) - {description}

### Code Examples
- [Title](URL) - {description}
```

---

## RESEARCH QUALITY CHECKLIST

Before considering research complete, verify:

```
✓ Research plan was created and followed
✓ Token budget respected (~2000-3000 tokens total)
✓ At least 1 popular package/solution identified
✓ At least 3 common pitfalls documented with fixes
✓ Sources span at least 3 different categories
✓ All sources properly cited with URLs
✓ Error messages documented (for quick lookup)
✓ Key questions from plan are answered
```

**Stop when you have enough information. Don't over-research.**

---

## USAGE

### Standalone Research
```
/research "Add JWT authentication to Flask app"
```

### As Part of Build Process
The `/build` command automatically calls this research phase first.

### Research Existing Feature
```
/research --feature video-upload
```
(Researches technologies used in existing feature)

---

## RESEARCH MINDSET REMINDERS

- **Don't skip this step** - 30 minutes of research saves 3 hours of debugging
- **Diversity matters** - Official docs + one blog post ≠ comprehensive research
- **Document everything** - You'll forget the fix when you need it most
- **Question assumptions** - If everyone says "it's easy", find the people who struggled
- **Look for patterns** - If 5 people had the same problem, you probably will too
- **Capture error messages** - Exact error text is gold when debugging
- **Note versions** - "It works" might mean "it works in v2.0, not v3.0"
- **Acknowledge contradictions** - When sources disagree, document both and decide

---

## WHEN TO DO MORE RESEARCH

Research again if:
- You encounter an error not in your research doc
- You're using a different version than researched
- You're integrating with a new system
- You're scaling beyond researched use cases
- Security requirements change
- Performance requirements change

**Update the research doc, don't start from scratch.**