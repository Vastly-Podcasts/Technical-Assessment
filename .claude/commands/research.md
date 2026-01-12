---
description: Deep research phase - learn from others' mistakes before making your own
allowed-tools: Read, Write, Edit, WebSearch, AskUserQuestion
---

# Research Command

**Mindset: Find existing solutions before writing any code. The best code is code you don't write.**

The goal is to find the simplest, most reliable solution using proven packages and patterns. Research exists to prevent reinventing the wheel—someone has already solved your problem better than you will on the first try.

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

### Step 1: Identify Research Targets

From the goal/feature, extract:
```
PROBLEM: [What are we trying to solve?]
TECHNOLOGIES: [List all technologies/frameworks involved]
USE_CASE: [What are we trying to accomplish?]
INTEGRATION_POINTS: [What other systems does this connect to?]
VERSIONS: [What versions are we using?]
```

### Step 2: Existing Solutions Search (CRITICAL - DO THIS FIRST)

**Before writing ANY code, find existing solutions:**

**Search strategy:**
```
1. "{problem} npm package" or "{problem} python package"
2. "{problem} library {language}"
3. "{problem} solution {framework}"
4. "{problem} best practice"
5. "{problem} how to {framework}"
```

**What to find:**
- **Most popular packages** - Check download stats (npm: weekly downloads, pypi: monthly downloads)
- **Official solutions** - Does the framework/library provide this out of the box?
- **Built-in APIs** - Native browser/Node/Python APIs that solve this
- **Minimal examples** - Find the simplest working code that solves the problem
- **Comparison articles** - "X vs Y vs Z" articles that compare solutions

**Evaluation criteria:**
- **Popularity** - More downloads = more battle-tested
- **Simplicity** - Fewer lines of code = better
- **Maintenance** - Recent updates, active maintainers
- **Documentation** - Clear docs = easier to use correctly
- **Bundle size** - Smaller is better (for frontend)

**Document findings:**
- Package name + version
- Weekly/monthly download stats
- Lines of code needed (estimate)
- Maintenance status (last update, open issues)
- Why this is the simplest solution

### Step 3: Official Documentation Pass

**Search strategy:**
```
1. "{technology} official documentation {version}"
2. "{technology} built-in {feature}"
3. "{technology} native API {use case}"
4. "{technology} best practices"
5. "{technology} getting started guide"
```

**What to capture:**
- **Built-in solutions** - Does the framework provide this natively?
- Official recommended patterns (prefer official over custom)
- Official warnings/deprecations
- Official security recommendations
- Official performance guidelines

### Step 5: Problem Discovery Pass

**Search strategy (use multiple query variations):**
```
1. "{technology} {use case} error"
2. "{technology} {use case} issue"
3. "{technology} {use case} problem"
4. "{technology} {use case} not working"
5. "{technology} {use case} troubleshooting"
6. "{technology} common mistakes"
7. "{technology} pitfalls"
8. "{technology} gotchas"
```

**Where to search:**
- GitHub Issues (filter: closed, has solution)
- Stack Overflow (filter: has accepted answer, high votes)
- Reddit (search in relevant subreddits)
- Blog search engines (Dev.to, Medium search)

**What to capture:**
- Specific error messages
- Symptoms of problems
- Root causes
- Step-by-step fixes
- Workarounds (and why they're needed)

### Step 6: Real-World Experience Pass

**Search strategy:**
```
1. "{technology} {use case} tutorial"
2. "{technology} {use case} implementation"
3. "{technology} {use case} blog"
4. "{technology} production experience"
5. "{technology} lessons learned"
```

**Where to search:**
- Personal developer blogs
- Company engineering blogs (Netflix, Airbnb, etc.)
- Medium/Dev.to articles
- Conference talk transcripts
- Podcast transcripts (if available)

**What to capture:**
- Real-world challenges encountered
- Solutions that worked in production
- Performance insights
- Scaling considerations
- Team experiences

### Step 7: Integration & Compatibility Pass

**Search strategy:**
```
1. "{technology} {other_technology} integration"
2. "{technology} {other_technology} compatibility"
3. "{technology} version {X} {other_technology} version {Y}"
4. "{technology} breaking changes {version}"
```

**What to capture:**
- Integration challenges
- Version compatibility matrices
- Breaking changes between versions
- Migration paths

### Step 8: Security & Performance Deep Dive

**Search strategy:**
```
1. "{technology} security vulnerabilities"
2. "{technology} security best practices"
3. "{technology} performance issues"
4. "{technology} performance optimization"
5. "{technology} memory leaks"
6. "{technology} security audit"
```

**What to capture:**
- Known security issues
- Security best practices
- Performance bottlenecks
- Optimization techniques
- Resource usage patterns

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
✓ At least 3-5 common pitfalls documented with fixes
✓ Sources span at least 3 different categories
✓ Each pitfall has both prevention and fix strategies
✓ Version-specific information captured
✓ Security considerations documented
✓ Performance considerations documented
✓ Integration concerns identified
✓ All sources properly cited with URLs
✓ Error messages documented (for quick lookup)
✓ Contradictions between sources acknowledged
✓ Unanswered questions identified
```

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