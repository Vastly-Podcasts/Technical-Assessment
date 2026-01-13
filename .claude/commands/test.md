# /test — Generate Production-Grade Tests

Generate comprehensive, modular unit tests with integration coverage and edge case handling.

---

## Philosophy

**Tests are contracts, not coverage metrics.**

Good tests:
- Document expected behavior (tests as specification)
- Catch regressions before users do
- Enable confident refactoring
- Run fast and deterministically

Bad tests:
- Test implementation details (break on refactor)
- Have false positives/negatives (lose trust)
- Are slow or flaky (get ignored)
- Duplicate each other (maintenance burden)

---

## Test Architecture

### The Testing Pyramid

```
        ╱╲
       ╱  ╲       E2E Tests (few, slow, high confidence)
      ╱────╲      - Full user flows
     ╱      ╲     - Real browser/backend
    ╱────────╲
   ╱          ╲   Integration Tests (medium)
  ╱────────────╲  - Component + dependencies
 ╱              ╲ - Mocked externals
╱────────────────╲
╲                ╱ Unit Tests (many, fast, focused)
 ╲──────────────╱  - Pure functions
  ╲            ╱   - Single responsibility
   ╲──────────╱    - Edge cases
```

**Ratio Target: 70% unit / 20% integration / 10% E2E**

---

## Unit Test Principles

### 1. AAA Pattern (Arrange, Act, Assert)

```typescript
// ✅ Good: Clear structure
test('applyGrayscale converts RGB to luminosity', () => {
  // Arrange
  const imageData = createImageData([255, 0, 0, 255]); // Pure red

  // Act
  applyGrayscale(imageData);

  // Assert
  const expectedGray = Math.round(255 * 0.299); // Luminosity formula
  expect(imageData.data[0]).toBe(expectedGray);
  expect(imageData.data[1]).toBe(expectedGray);
  expect(imageData.data[2]).toBe(expectedGray);
});
```

### 2. Test Behavior, Not Implementation

```typescript
// ❌ Bad: Tests implementation detail
test('grayscale uses 0.299 coefficient for red', () => {
  // This test breaks if we optimize the algorithm
});

// ✅ Good: Tests observable behavior
test('grayscale produces perceptually correct brightness', () => {
  // Pure red (255,0,0) should be darker than pure green (0,255,0)
  // because human eyes are more sensitive to green
  const red = createImageData([255, 0, 0, 255]);
  const green = createImageData([0, 255, 0, 255]);

  applyGrayscale(red);
  applyGrayscale(green);

  expect(green.data[0]).toBeGreaterThan(red.data[0]);
});
```

### 3. One Assertion Per Concept

```typescript
// ❌ Bad: Multiple unrelated assertions
test('filter works', () => {
  expect(applyGrayscale(red)).toBeDefined();
  expect(FILTER_INFO.length).toBe(4);
  expect(getApiUrl()).toBe('http://localhost:8080');
});

// ✅ Good: Focused tests
describe('applyGrayscale', () => {
  test('returns undefined (modifies in place)', () => {...});
  test('preserves alpha channel', () => {...});
  test('handles empty ImageData', () => {...});
});
```

---

## Edge Cases to Always Test

### Boundary Conditions
```typescript
// Empty inputs
test('handles empty array', () => {...});
test('handles empty string', () => {...});

// Single element
test('handles single item', () => {...});

// Boundary values
test('handles threshold at 0', () => {...});
test('handles threshold at 1', () => {...});
test('handles threshold at 0.5 (midpoint)', () => {...});

// Large inputs
test('handles 4K resolution image data', () => {...});
```

### Error States
```typescript
// Invalid inputs
test('throws on null input', () => {...});
test('throws on negative values', () => {...});
test('handles NaN gracefully', () => {...});

// Network failures
test('handles timeout', () => {...});
test('handles 404 response', () => {...});
test('handles network disconnect', () => {...});
```

### Type Coercion Gotchas
```typescript
// JavaScript quirks
test('handles "0" string (truthy but zero)', () => {...});
test('handles undefined vs null', () => {...});
test('handles floating point precision', () => {...});
```

---

## Test File Structure

### Frontend (Jest + React Testing Library)

```
frontend/src/
├── utils/
│   ├── filters.ts
│   └── __tests__/
│       └── filters.test.ts
├── hooks/
│   ├── useSegmentation.ts
│   └── __tests__/
│       └── useSegmentation.test.ts
└── components/
    ├── ProcessedVideo.tsx
    └── __tests__/
        └── ProcessedVideo.test.tsx
```

### Backend (pytest)

```
backend/
├── main.py
├── helpers.py
└── tests/
    ├── conftest.py          # Shared fixtures
    ├── test_helpers.py      # Unit tests for helpers
    ├── test_main.py         # API endpoint tests
    └── test_integration.py  # Full flow tests
```

---

## Testable Units in This Project

### Frontend Pure Functions (HIGH PRIORITY)

| File | Functions | Edge Cases |
|------|-----------|------------|
| `filters.ts` | `applyGrayscale`, `applySepia`, `applyBlur`, `applyNone`, `applyFilter` | Empty ImageData, single pixel, all black/white, alpha preservation |
| `timeframes.ts` | `sortTimeframes`, `isTimeframeActive`, `generateTimeframeId` | Empty array, overlapping ranges, boundary times, negative times |
| `videoValidation.ts` | `isValidVideoFile`, `isFileSizeValid` | Missing MIME type, edge extensions, exact size limit |
| `config.ts` | `getApiUrl`, `getApiEndpoint` | Missing env var, trailing slashes, special characters |
| `api.ts` | `ApiError`, `getRetryDelay`, `apiRequest` | Timeout, network error, 4xx vs 5xx, retry exhaustion |

### Backend Pure Functions (HIGH PRIORITY)

| File | Functions | Edge Cases |
|------|-----------|------------|
| `helpers.py` | `validate_temp_path`, `validate_file_size` | Path traversal (`../`), symlinks, non-existent files, exact limits |
| `helpers.py` | `create_job`, `update_job`, `get_job` | Concurrent updates, missing job, invalid status transitions |
| `main.py` | Flask endpoints | Missing fields, invalid filter ID, malformed requests |

### Integration Tests Needed

| Flow | Components | Mock |
|------|------------|------|
| Video processing | ProcessedVideo + useSegmentation + filters | MediaPipe model |
| API communication | Frontend api.ts + Backend endpoints | None (real) |
| File upload | Upload endpoint + helpers | File system |

---

## Mocking Strategy

### What to Mock
- External APIs (MediaPipe, fetch)
- File system operations
- Timers and dates
- Random number generation

### What NOT to Mock
- Pure functions
- Simple utilities
- Data transformations

### Mock Patterns

```typescript
// Mock fetch for API tests
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  json: () => Promise.resolve({ status: 'healthy' }),
});

// Mock canvas for filter tests (browser API)
const mockGetImageData = jest.fn().mockReturnValue({
  data: new Uint8ClampedArray([255, 0, 0, 255]),
  width: 1,
  height: 1,
});

// Mock MediaPipe
jest.mock('@mediapipe/selfie_segmentation', () => ({
  SelfieSegmentation: jest.fn().mockImplementation(() => ({
    setOptions: jest.fn(),
    onResults: jest.fn(),
    send: jest.fn(),
  })),
}));
```

---

## Test Checklist

Before marking a module "tested":

- [ ] **Happy path**: Normal operation works
- [ ] **Empty/null**: Handles missing data
- [ ] **Boundaries**: Min/max values tested
- [ ] **Errors**: Throws/catches appropriately
- [ ] **Types**: Handles type coercion edge cases
- [ ] **Async**: Race conditions, timeouts handled
- [ ] **Performance**: Large inputs don't explode

---

## Running Tests

### Frontend
```bash
cd Technical-Assessment/frontend
npm test                    # Watch mode
npm test -- --coverage      # Coverage report
npm test -- --watchAll=false # CI mode (single run)
```

### Backend
```bash
cd Technical-Assessment/backend
pip install pytest pytest-flask pytest-cov
pytest                      # Run all tests
pytest -v                   # Verbose output
pytest --cov=. --cov-report=html  # Coverage report
```

---

## Example Test Templates

### Pure Function Test (TypeScript)

```typescript
import { functionName } from '../module';

describe('functionName', () => {
  describe('happy path', () => {
    test('returns expected result for valid input', () => {
      const result = functionName(validInput);
      expect(result).toEqual(expectedOutput);
    });
  });

  describe('edge cases', () => {
    test('handles empty input', () => {
      expect(functionName([])).toEqual([]);
    });

    test('handles single element', () => {
      expect(functionName([item])).toEqual([expected]);
    });

    test('handles boundary values', () => {
      expect(functionName(0)).toBe(expectedAtZero);
      expect(functionName(1)).toBe(expectedAtOne);
    });
  });

  describe('error handling', () => {
    test('throws on null input', () => {
      expect(() => functionName(null)).toThrow();
    });

    test('throws on invalid type', () => {
      expect(() => functionName('string' as any)).toThrow();
    });
  });
});
```

### Flask Endpoint Test (Python)

```python
import pytest
from main import app

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

class TestHealthEndpoint:
    def test_returns_200(self, client):
        response = client.get('/api/health')
        assert response.status_code == 200

    def test_returns_healthy_status(self, client):
        response = client.get('/api/health')
        data = response.get_json()
        assert data['status'] == 'healthy'

    def test_includes_capabilities(self, client):
        response = client.get('/api/health')
        data = response.get_json()
        assert 'capabilities' in data
        assert 'filters' in data['capabilities']
```

---

## Execution Instructions

When this command is invoked:

1. **Analyze the target module** - Identify all public functions and their signatures
2. **Map dependencies** - Determine what needs mocking
3. **Generate test file** - Create `__tests__/module.test.ts` or `tests/test_module.py`
4. **Write tests in order**:
   - Happy path first
   - Edge cases second
   - Error handling third
5. **Run tests** - Verify they pass
6. **Check coverage** - Identify gaps

---

*Generated by KERNEL - Testing methodology for production-grade quality*
