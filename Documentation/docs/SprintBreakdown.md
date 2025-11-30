# AI Travel Planner - Sprint Breakdown ( Team Edition)

**Date:** October 22, 2025  
**Version:** 2.0 ( Team Focus)  
**Team:** 5  Developers  
**Total Duration:** 5 Sprints (10 weeks)  
**Sprint Length:** 2 weeks each

---

## Sprint Overview

This plan is designed for a team of **5  developers** focusing on **stabilization before features**. Each sprint builds on the previous one, with clear learning goals and achievable tasks.

**Team Capacity:**
- 5 developers × 40 hours/week × 2 weeks = **400 hours per sprint**
- Account for meetings, learning, code review: **~320 productive hours per sprint**

**Sprint Structure:**
1. **Core Stabilization & Environment Setup** (Weeks 1-2)
2. **Testing & Code Quality Foundation** (Weeks 3-4)
3. **UI/UX Consistency & Mobile** (Weeks 5-6)
4. **Performance & SEO Basics** (Weeks 7-8)
5. **Collaboration Features & Polish** (Weeks 9-10)

---

## Sprint 1: Core Stabilization & Environment Setup

**Duration:** 2 weeks  
**Goal:** Fix critical user-facing bugs and set up development workflow

**Why This Sprint Matters:**
Users are losing their work and getting frustrated. We need to fix these problems FIRST before adding anything new. Also, we need proper tools (linters, tests) to work efficiently.

---

### Sprint 1 - User Stories

#### Story 1.1: Chat History Persistence

```
As a user,
I want my chat messages to be saved,
So that I don't lose my trip planning when I refresh the page.

Acceptance Criteria:
- [ ] All messages are saved to database immediately after sending
- [ ] Messages load from database when user returns to chat
- [ ] Loading indicator shows while messages are being fetched
- [ ] If loading fails, user sees helpful error message
- [ ] Guest users' messages persist across page refreshes
- [ ] Test: Refresh page in middle of conversation - all messages should reload

Technical Notes:
- Fix: ChatPageContent.tsx message loading
- Fix: ChatHistoryService.ts persistence logic
- Add: Error boundary for failed loads
- Test: Integration test for message persistence

Files to Modify:
- src/components/features/chat/ChatPageContent.tsx
- src/services/ChatHistoryService.ts
- src/lib/api.ts (getSessionMessages function)
- Backend: MessageRepository.java (add proper sorting)
```

**Estimated Effort:** 40 hours  
**Developers:** 2 developers (pair programming)

---

#### Story 1.2: Guest to Authenticated User Transition

```
As a guest user who just signed up,
I want to keep all my trip planning data,
So that I don't have to start over after creating an account.

Acceptance Criteria:
- [ ] When guest signs up, their session transfers to new account
- [ ] All messages remain visible after sign-up
- [ ] Map locations transfer to new account
- [ ] User sees "Saving your trip..." message during migration
- [ ] User sees "Welcome! Your trip has been saved" confirmation
- [ ] No page reload during transition (use router.push, not window.location)
- [ ] Test: Create trip as guest, sign up, verify all data persists

Technical Notes:
- Backend: Create POST /api/auth/migrate-guest-session endpoint
- Frontend: Call migration endpoint after sign-up
- Update signIn method to use router.push()
- Add loading state during migration
- Store guest session ID to send to backend

Files to Create/Modify:
- Backend: AuthController.java (add migrateGuestSession method)
- Backend: SessionService.java (add migration logic)
- Frontend: src/contexts/AuthContext.tsx (update signIn method)
- Frontend: src/app/auth/signup/page.tsx (call migration after signup)
```

**Estimated Effort:** 50 hours  
**Developers:** 2 developers

**Learning Resources:**
- React Router vs window.location: https://reactrouter.com/en/main/start/overview
- https://nextjs.org/docs/pages/building-your-application/routing
- Spring Boot POST endpoints: https://spring.io/guides/gs/rest-service/

---

#### Story 1.3: Remove Duplicate AuthContext

```
As a developer,
I want only ONE AuthContext file,
So that I don't get confused about which one to use.

Acceptance Criteria:
- [ ] Only /src/contexts/AuthContext.tsx exists
- [ ] /src/components/contexts/AuthContext.tsx is deleted
- [ ] All imports updated to use single file
- [ ] App still works correctly after cleanup
- [ ] No broken imports
- [ ] Tests still pass
- [ ] Document which AuthContext we're keeping and why

Technical Notes:
- Keep the better implementation (src/contexts/AuthContext.tsx)
- Search entire codebase for imports
- Update all imports to new path
- Run tests after each change
- Commit changes incrementally

Files to Delete:
- src/components/contexts/AuthContext.tsx

Files to Update:
- Any file importing from deleted path
- Run: grep -r "from '@/components/contexts/AuthContext'" to find them
```

**Estimated Effort:** 8 hours  
**Developers:** 1 developer

---

#### Story 1.4: Fix OAuth Redirect Paths

```
As a user logging in with Google,
I want to be redirected to the correct page after authentication,
So that I don't see a 404 error.

Acceptance Criteria:
- [ ] OAuth callback redirects to /auth/signin (not /signin)
- [ ] Successful auth redirects to /chat page
- [ ] Failed auth shows error message and stays on sign-in page
- [ ] Test all OAuth providers: Google, LinkedIn, Facebook
- [ ] Add error boundary to catch bad redirects
- [ ] Document correct redirect URLs in code comments

Technical Notes:
- Update GoogleCallback component redirect
- Update signOut method redirect
- Verify backend OAuth redirect URLs match frontend routes
- Add URL validation before redirect

Files to Modify:
- src/auth/callback/[...google]/page.tsx
- src/app/auth/callback/[...google]/page.tsx
- src/contexts/AuthContext.tsx (signOut method)
- Backend: Check OAuth configuration redirect URLs
```

**Estimated Effort:** 12 hours  
**Developers:** 1 developer

---

#### Story 1.5: Development Environment Setup

```
As a developer,
I want my development environment properly configured,
So that I can work efficiently and catch bugs early.

Acceptance Criteria:
- [ ] ESLint enabled with strict rules
- [ ] Prettier auto-formats on save
- [ ] Git hooks run linter before commit (Husky)
- [ ] Console.log rule changed to "warn" in ESLint
- [ ] VSCode/IDE settings documented for team
- [ ] README updated with setup instructions
- [ ] All team members have working local environment

Technical Notes:
- Update .eslintrc.json: "no-console": "warn"
- Configure Husky pre-commit hooks (already in package.json)
- Create .vscode/settings.json for team
- Document Node.js version requirement
- Document required environment variables

Files to Modify:
- .eslintrc.json
- .vscode/settings.json (create if missing)
- README.md (add setup section)
- .env.example (ensure all vars documented)
```

**Estimated Effort:** 16 hours  
**Developers:** 1 developer

---

#### Story 1.6: Basic CI/CD Pipeline

```
As a developer,
I want tests to run automatically on every Pull Request,
So that we catch bugs before merging code.

Acceptance Criteria:
- [ ] GitHub Actions workflow created
- [ ] Tests run on every PR
- [ ] Linting runs on every PR
- [ ] Build verification runs on every PR
- [ ] PR cannot merge if checks fail
- [ ] Status badges added to README
- [ ] Team trained on how to read CI results

Technical Notes:
- Create .github/workflows/ci.yml
- Run tests: npm test
- Run linting: npm run lint
- Run build: npm run build
- Add status checks to main branch protection
- Configure secrets for environment variables

Files to Create:
- .github/workflows/ci.yml
- .github/workflows/backend-ci.yml (for Java)

Example Workflow:
```yaml
name: Frontend CI
on: [pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: pnpm install
      - run: pnpm lint
      - run: pnpm test
      - run: pnpm build
```
```

**Estimated Effort:** 24 hours  
**Developers:** 1 developer (with senior mentorship)

---

#### Story 1.7: Implement Session Restoration

```
As a user,
I want my session to continue when I reopen the browser,
So that I don't lose my trip planning progress.

Acceptance Criteria:
- [ ] Last session ID stored in localStorage (survives tab close)
- [ ] Device UUID generated for guest identification
- [ ] Backend endpoint `/sessions/last` returns last active session
- [ ] Session restored automatically if within 7 days
- [ ] Show "Continue planning your {destination} trip?" prompt
- [ ] User can start new session or continue previous
- [ ] Expired sessions cleaned up automatically

Technical Notes:
- Use uuid library for device fingerprinting
- Store mapping: deviceId → sessionId in backend
- Check session.updatedAt < 7 days ago
- Load messages and locations on restoration

Files to Create:
- Backend: model/entities/GuestDeviceMapping.java
- Backend: controller/SessionController.java (add restoreSession method)
- Frontend: services/SessionRestoration.ts
- Frontend: Update AuthContext.tsx initialization

Database Schema:
```java
@Document(collection = "guestDeviceMappings")
public class GuestDeviceMapping {
    @Id
    private String id;
    private String deviceId;       // UUID
    private String lastSessionId;  // Most recent session
    private Date lastAccessedAt;   // For cleanup
    private Date expiresAt;        // 7 days from last access
}
```
```

**Estimated Effort:** 32 hours  
**Developers:** 2 developers

---

#### Story 1.8: Implement Token Refresh Pattern

```
As a user,
I want my session to stay active as long as I'm using the app,
So that I don't get logged out unexpectedly.

Acceptance Criteria:
- [ ] Refresh tokens implemented (7-day expiration)
- [ ] Access tokens short-lived (15 minutes)
- [ ] Auto-refresh when access token <5 min from expiring
- [ ] Refresh token stored in httpOnly cookie
- [ ] Backend `/auth/refresh` endpoint created
- [ ] Token refresh race condition prevented
- [ ] Failed refresh redirects to sign in
- [ ] Refresh token rotation (one-time use)

Technical Notes:
- Use httpOnly cookies for refresh tokens (XSS protection)
- Implement refresh token queue (prevent race conditions)
- Store refresh tokens in database for revocation
- Rotate refresh token on each use (security)
- Clean up expired refresh tokens daily

Security Requirements:
- Refresh token must be httpOnly cookie
- Refresh token single-use (invalidate after refresh)
- Log refresh token usage for audit
- Detect token theft (multiple refresh attempts)

Files to Create/Modify:
- Backend: model/entities/RefreshToken.java
- Backend: repository/RefreshTokenRepository.java
- Backend: controller/AuthController.java (add refresh endpoint)
- Backend: service/RefreshTokenService.java
- Backend: util/JwtUtil.java (update token generation)
- Frontend: lib/api.ts (add refresh interceptor)
- Frontend: utils/tokenManager.ts (monitor expiration)

Database Schema:
```java
@Document(collection = "refreshTokens")
public class RefreshToken {
    @Id
    private String id;
    private String token;          // Hashed refresh token
    private String userId;         // Owner
    private Date issuedAt;
    private Date expiresAt;
    private boolean revoked;       // For logout
    private String deviceInfo;     // For security
    private Date lastUsedAt;
}
```

API Endpoint:
```java
@PostMapping("/auth/refresh")
public ResponseEntity<TokenResponse> refreshToken(
    @CookieValue("refreshToken") String refreshToken
) {
    // 1. Validate refresh token
    // 2. Generate new access token
    // 3. Generate new refresh token (rotation)
    // 4. Revoke old refresh token
    // 5. Return new tokens
}
```
```

**Estimated Effort:** 48 hours  
**Developers:** 2 developers (1 backend, 1 frontend)

---

#### Story 1.9: Replace window.location with router.push

```
As a user,
I want seamless navigation without page reloads,
So that the app feels fast and responsive.

Acceptance Criteria:
- [ ] All window.location.href replaced with router.push()
- [ ] AuthContext uses Next.js router
- [ ] OAuth callbacks use router
- [ ] React state preserved during navigation
- [ ] No flash/flicker on navigation
- [ ] Loading states during navigation
- [ ] Test all auth flows (signin, signup, signout)

Technical Notes:
- Use Next.js useRouter hook
- Await state updates before navigation
- Add transition effects for smooth UX
- Test with Chrome DevTools Network throttling

Files to Modify:
- src/contexts/AuthContext.tsx
- src/app/auth/callback/[...provider]/page.tsx
- Any component using window.location.href

Code Pattern:
```typescript
// ❌ BAD - Remove this
window.location.href = '/chat';

// ✅ GOOD - Use this
import { useRouter } from 'next/navigation';
const router = useRouter();
router.push('/chat');
```
```

**Estimated Effort:** 12 hours  
**Developers:** 1 developer

---

### Sprint 1 - Tasks Breakdown

| Task | Owner | Hours | Status |
|------|-------|-------|--------|
| Story 1.1: Chat History Persistence | Dev 1 & 2 | 40 | Not Started |
| Story 1.2: Guest→User Transition | Dev 3 & 4 | 50 | Not Started |
| Story 1.3: Remove Duplicate AuthContext | Dev 5 | 8 | Not Started |
| Story 1.4: Fix OAuth Redirects | Dev 5 | 12 | Not Started |
| Story 1.5: Dev Environment Setup | Dev 1 | 16 | Not Started |
| Story 1.6: CI/CD Pipeline | Dev 2 | 24 | Not Started |
| **Story 1.7: Session Restoration** | **Dev 3 & 4** | **32** | **Not Started** |
| **Story 1.8: Token Refresh Pattern** | **Dev 1 & 2** | **48** | **Not Started** |
| **Story 1.9: Replace window.location** | **Dev 5** | **12** | **Not Started** |
| **Total** | **All** | **242** | - |

**Remaining:** 78 hours for code review, testing, learning, meetings (out of 320 total)

---

### Sprint 1 - Success Metrics

**User-Facing:**
- ✅ 0 reports of lost chat history
- ✅ 100% of users keep data after sign-up
- ✅ Sessions restore after browser close (within 7 days)
- ✅ No unexpected logouts (token refresh works)
- ✅ Seamless navigation (no page flicker)
- ✅ 95%+ OAuth success rate

**Developer-Facing:**
- ✅ CI pipeline running on all PRs
- ✅ All devs have working local environment
- ✅ Code review process established
- ✅ Token refresh pattern implemented
- ✅ Session restoration working

---

### Sprint 1 - Daily Standup Questions

**Each day, each developer answers:**
1. What did I complete yesterday?
2. What am I working on today?
3. Any blockers or questions?
4. What did I learn?

**Team Lead Tracks:**
- Burndown chart (hours remaining)
- Blocked tasks
- Knowledge sharing opportunities

---

## Sprint 2: Testing & Code Quality Foundation

**Duration:** 2 weeks  
**Goal:** Establish testing culture and improve code quality

**Why This Sprint Matters:**
Tests prevent bugs and make us confident to change code. Right now we have tests but don't know coverage. Let's fix that and add more tests where needed.

---

### Sprint 2 - User Stories

#### Story 2.1: Test Coverage Reporting

```
As a developer,
I want to see which code is tested and which isn't,
So that I know where to add more tests.

Acceptance Criteria:
- [ ] Coverage report generates when running tests
- [ ] Coverage report shows percentage per file
- [ ] Coverage report uploaded to CI
- [ ] Coverage badge added to README
- [ ] Team understands how to read coverage report
- [ ] Minimum 70% coverage target set
- [ ] Untested files identified and documented

Technical Notes:
- Add jest --coverage script
- Configure coverage thresholds in jest.config.ts
- Add coverage/ directory to .gitignore
- Use codecov.io or similar for hosting reports
- Document coverage goals in CONTRIBUTING.md

Files to Modify:
- package.json (add test:coverage script)
- jest.config.ts (add coverage configuration)
- .github/workflows/ci.yml (upload coverage)
- README.md (add coverage badge)
```

**Estimated Effort:** 20 hours  
**Developers:** 1 developer

---

#### Story 2.2: Unit Tests for Critical Paths

```
As a developer,
I want core functions to have unit tests,
So that refactoring doesn't break functionality.

Acceptance Criteria:
- [ ] AuthContext fully tested (sign in, sign out, token refresh)
- [ ] API client (api.ts) interceptors tested
- [ ] ChatHistoryService methods tested
- [ ] MapService core methods tested
- [ ] All tests have clear descriptions
- [ ] Tests use data-testid for selectors (not class names)
- [ ] Tests follow AAA pattern (Arrange, Act, Assert)

Technical Notes:
- Focus on business logic, not UI
- Mock external dependencies (API calls, localStorage)
- Test happy path AND error cases
- Write tests in TypeScript
- Use descriptive test names: "should X when Y"

Example Test Structure:
```typescript
describe('AuthContext', () => {
  describe('signIn', () => {
    it('should store token and update user state', () => {
      // Arrange: Set up test data
      // Act: Call signIn
      // Assert: Verify token stored and state updated
    });
    
    it('should redirect to chat page after sign in', () => {
      // Test redirect behavior
    });
  });
});
```

Files to Test:
- src/contexts/AuthContext.tsx
- src/lib/api.ts
- src/services/ChatHistoryService.ts
- src/services/MapService.ts
```

**Estimated Effort:** 60 hours  
**Developers:** 3 developers (20 hours each, different files)

---

#### Story 2.3: Integration Tests for User Flows

```
As a developer,
I want end-to-end tests for critical user flows,
So that I know the whole app works together.

Acceptance Criteria:
- [ ] Test: Guest creates trip → signs up → data persists
- [ ] Test: User signs in → creates trip → signs out → signs back in → trip still there
- [ ] Test: Send message → see response → refresh page → messages reload
- [ ] Test: Add location → appears on map → page refresh → location still there
- [ ] Tests use real (test) backend API
- [ ] Tests clean up after themselves (delete test data)
- [ ] Tests can run in CI environment

Technical Notes:
- Use Playwright or Cypress for E2E tests
- Set up test database (separate from production)
- Use test user accounts
- Run against localhost or staging environment
- Mock external APIs (OpenAI, Amadeus) in tests

Test Structure:
```typescript
test('guest to authenticated user flow', async ({ page }) => {
  // 1. Visit site as guest
  // 2. Start conversation
  // 3. Add location
  // 4. Sign up
  // 5. Verify conversation and location persist
});
```

Files to Create:
- tests/e2e/guest-to-user-flow.spec.ts
- tests/e2e/message-persistence.spec.ts
- playwright.config.ts or cypress.config.ts
```

**Estimated Effort:** 50 hours  
**Developers:** 2 developers

---

#### Story 2.4: Code Review Process

```
As a team,
I want a clear code review process,
So that we learn from each other and maintain quality.

Acceptance Criteria:
- [ ] PR template created with checklist
- [ ] Code review guidelines documented
- [ ] Minimum 1 approval required to merge
- [ ] PR must pass CI checks before merge
- [ ] Team trained on how to give/receive feedback
- [ ] Review checklist created
- [ ] Branch naming convention established

Technical Notes:
- Create .github/pull_request_template.md
- Create CONTRIBUTING.md with review guidelines
- Configure branch protection rules
- Set up CODEOWNERS file (optional)

PR Template Checklist:
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Refactoring
- [ ] Documentation

## Checklist
- [ ] Tests added/updated
- [ ] Linter passes
- [ ] Self-reviewed code
- [ ] Documentation updated
- [ ] No console.logs
```

Files to Create:
- .github/pull_request_template.md
- CONTRIBUTING.md (code review guidelines)
- docs/CODEREVIEW.md (review checklist)
```

**Estimated Effort:** 16 hours  
**Developers:** 1 developer + team input

---

#### Story 2.5: Remove Console.log Statements

```
As a developer,
I want production code to be free of console.logs,
So that we don't leak information and slow down the app.

Acceptance Criteria:
- [ ] ESLint rule "no-console" set to "error" (not "warn")
- [ ] All 377 console.log statements removed or replaced
- [ ] Logging library implemented (loglevel)
- [ ] Production logs disabled
- [ ] Development logs work as expected
- [ ] Error tracking integrated (Sentry or similar)
- [ ] Documentation on when to use logs

Technical Notes:
- Install loglevel: npm install loglevel
- Replace console.log with log.debug()
- Replace console.error with log.error()
- Configure log levels per environment
- Add Sentry for production error tracking

Migration Pattern:
```typescript
// Before (remove these):
console.log('User logged in:', user);
console.error('API call failed:', error);

// After (do this):
import log from 'loglevel';
log.debug('User logged in:', user);     // Only in development
log.error('API call failed:', error);   // Always logs to Sentry
```

Files to Modify:
- .eslintrc.json (no-console: error)
- 33 files with console.logs
- Add: src/utils/logger.ts (wrapper around loglevel)
```

**Estimated Effort:** 40 hours  
**Developers:** 2 developers (split files 50/50)

---

### Sprint 2 - Tasks Breakdown

| Task | Owner | Hours | Status |
|------|-------|-------|--------|
| Story 2.1: Test Coverage Reporting | Dev 1 | 20 | Not Started |
| Story 2.2: Unit Tests for Critical Paths | Dev 2,3,4 | 60 | Not Started |
| Story 2.3: Integration Tests | Dev 5 & 1 | 50 | Not Started |
| Story 2.4: Code Review Process | Dev 2 | 16 | Not Started |
| Story 2.5: Remove Console.logs | Dev 3 & 4 | 40 | Not Started |
| **Total** | **All** | **186** | - |

---

### Sprint 2 - Learning Goals

**For  Developers:**
- Understand test pyramid (unit → integration → E2E)
- Write effective test descriptions
- Mock dependencies in tests
- Give constructive code review feedback
- Use logging libraries properly

**Resources:**
- Jest documentation: https://jestjs.io/docs/getting-started
- React Testing Library: https://testing-library.com/docs/react-testing-library/intro/
- Code review best practices: https://google.github.io/eng-practices/review/

---

## Sprint 3: UI/UX Consistency & Mobile

**Duration:** 2 weeks  
**Goal:** Make the UI look professional and work great on mobile

**Why This Sprint Matters:**
First impressions matter. Users judge apps in seconds. Let's make sure our app looks polished and works smoothly on all devices.

---

### Sprint 3 - User Stories

#### Story 3.1: Consistent Design System

```
As a user,
I want the app to look consistent across all pages,
So that it feels professional and I'm not confused.

Acceptance Criteria:
- [ ] All buttons use same styling (colors, sizes, hover states)
- [ ] All input fields use same styling
- [ ] Typography is consistent (font sizes, weights, colors)
- [ ] Spacing follows 8px grid system
- [ ] Color palette documented and used consistently
- [ ] Component library documented (buttons, inputs, cards)
- [ ] Design system document created

Technical Notes:
- Audit existing shadcn/ui components
- Create design tokens in CSS variables
- Document in Storybook or simple docs
- Update Tailwind config with brand colors

Example Design Tokens:
```css
:root {
  --color-primary: #007bff;
  --color-secondary: #6c757d;
  --color-success: #28a745;
  --color-error: #dc3545;
  --spacing-unit: 8px;
  --border-radius: 4px;
}
```

Files to Create/Modify:
- docs/DESIGN_SYSTEM.md
- src/styles/globals.css (design tokens)
- tailwind.config.ts (update theme)
```

**Estimated Effort:** 30 hours  
**Developers:** 1-2 developers

---

#### Story 3.2: Mobile-Responsive UI

```
As a mobile user,
I want the app to work well on my phone,
So that I can plan trips on the go.

Acceptance Criteria:
- [ ] All pages are mobile-responsive (320px to 1920px)
- [ ] Navigation has mobile hamburger menu
- [ ] Map is collapsible on mobile (doesn't block chat)
- [ ] Touch targets are minimum 44x44px
- [ ] Text is readable without zooming (min 16px)
- [ ] Tested on real iPhone and Android devices
- [ ] Mobile viewport meta tag configured

Technical Notes:
- Use Tailwind responsive classes (sm:, md:, lg:)
- Add mobile menu component
- Make map toggleable on small screens
- Test with Chrome DevTools device emulation
- Test on real devices (borrow team's phones)

Mobile Menu Pattern:
```typescript
// Add hamburger menu for mobile
<div className="md:hidden">
  <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
    <MenuIcon />
  </button>
</div>

// Hide desktop menu on mobile
<nav className="hidden md:block">
  {/* Desktop navigation */}
</nav>
```

Files to Modify:
- src/app/layout.tsx (add mobile menu)
- src/components/features/chat/ChatPageContent.tsx (collapsible map)
- All page components (add responsive classes)
```

**Estimated Effort:** 50 hours  
**Developers:** 2-3 developers

---

#### Story 3.3: Loading States and Feedback

```
As a user,
I want to see what's happening when I click buttons,
So that I know the app is working and I don't click multiple times.

Acceptance Criteria:
- [ ] Loading spinners show during async operations
- [ ] Buttons disable while loading
- [ ] Skeleton screens for loading content
- [ ] Progress indicators for long operations
- [ ] Success/error messages after actions
- [ ] Loading indicators have accessible labels
- [ ] Minimum 300ms spinner (avoid flash for fast requests)

Technical Notes:
- Create reusable LoadingSpinner component
- Create Skeleton component for content placeholders
- Use isLoading state for all async operations
- Add aria-busy and aria-live for accessibility

Loading Pattern:
```typescript
const [isLoading, setIsLoading] = useState(false);

const handleSend = async () => {
  setIsLoading(true);
  try {
    await sendMessage(message);
    toast.success('Message sent!');
  } catch (error) {
    toast.error('Failed to send. Please try again.');
  } finally {
    setIsLoading(false);
  }
};

return (
  <button disabled={isLoading}>
    {isLoading ? <LoadingSpinner /> : 'Send'}
  </button>
);
```

Files to Create/Modify:
- src/components/ui/LoadingSpinner.tsx
- src/components/ui/Skeleton.tsx
- All components with async actions
```

**Estimated Effort:** 40 hours  
**Developers:** 2 developers

---

#### Story 3.4: Better Error Messages

```
As a user,
I want clear error messages when something goes wrong,
So that I know what to do to fix it.

Acceptance Criteria:
- [ ] All errors have user-friendly messages
- [ ] Error messages explain what happened
- [ ] Error messages suggest next steps
- [ ] No technical jargon in user-facing errors
- [ ] Consistent error toast styling
- [ ] Errors logged to monitoring (Sentry)
- [ ] Document common errors in FAQ

Technical Notes:
- Create error message dictionary
- Wrap API calls in try/catch
- Transform backend errors to user-friendly messages
- Add Sentry for error tracking

Error Message Patterns:
```typescript
// ❌ BAD - Don't show this to users
toast.error('Error 500: Internal Server Error');

// ✅ GOOD - Show this instead
toast.error('We couldn't save your trip. Please check your internet connection and try again.');

// Error dictionary:
const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Connection lost. Check your internet and try again.',
  SESSION_EXPIRED: 'Your session expired. Please sign in again.',
  INVALID_INPUT: 'Please check your input and try again.',
  SERVER_ERROR: 'Something went wrong. We\'re working on it!'
};
```

Files to Create/Modify:
- src/utils/errorMessages.ts (error dictionary)
- src/lib/api.ts (transform API errors)
- All error toast.error() calls
```

**Estimated Effort:** 25 hours  
**Developers:** 1-2 developers

---

#### Story 3.5: Basic Accessibility

```
As a user with disabilities,
I want to use the app with keyboard and screen reader,
So that I'm not excluded.

Acceptance Criteria:
- [ ] All interactive elements keyboard accessible
- [ ] Tab order is logical
- [ ] ARIA labels on all buttons/icons
- [ ] Form fields have labels
- [ ] Error messages announced to screen readers
- [ ] Focus indicators visible
- [ ] Tested with screen reader (NVDA or VoiceOver)
- [ ] Color contrast meets WCAG AA standards

Technical Notes:
- Add aria-label to icon buttons
- Use semantic HTML (<button>, not <div onClick>)
- Add focus-visible styles
- Test with keyboard only (no mouse)
- Use axe DevTools for automated testing

Accessibility Checklist:
```typescript
// ✅ Good accessibility
<button
  aria-label="Send message"
  disabled={isLoading}
  aria-busy={isLoading}
>
  <SendIcon aria-hidden="true" />
</button>

// ❌ Bad accessibility
<div onClick={handleClick}>
  <SendIcon />
</div>
```

Files to Modify:
- All components with buttons/inputs
- src/styles/globals.css (focus styles)
```

**Estimated Effort:** 35 hours  
**Developers:** 2 developers

---

### Sprint 3 - Tasks Breakdown

| Task | Owner | Hours | Status |
|------|-------|-------|--------|
| Story 3.1: Design System | Dev 1 & 2 | 30 | Not Started |
| Story 3.2: Mobile Responsive | Dev 3,4,5 | 50 | Not Started |
| Story 3.3: Loading States | Dev 1 & 2 | 40 | Not Started |
| Story 3.4: Error Messages | Dev 3 | 25 | Not Started |
| Story 3.5: Accessibility | Dev 4 & 5 | 35 | Not Started |
| **Total** | **All** | **180** | - |

---

## Sprint 4: Performance & SEO Basics

**Duration:** 2 weeks  
**Goal:** Make the app fast and discoverable by search engines

**Why This Sprint Matters:**
Slow sites lose users. Sites without SEO don't get found. Let's make sure our app is fast and Google-friendly.

---

### Sprint 4 - User Stories

#### Story 4.1: Add SEO Metadata

```
As a content marketer,
I want proper SEO metadata on all pages,
So that Google can find and rank our site.

Acceptance Criteria:
- [ ] Every page has unique title tag
- [ ] Every page has meta description
- [ ] Open Graph tags for social sharing
- [ ] Twitter Card tags
- [ ] Canonical URLs set
- [ ] sitemap.xml generated
- [ ] robots.txt created
- [ ] Structured data (JSON-LD) for rich snippets

Technical Notes:
- Use Next.js metadata export
- Create generateMetadata functions for dynamic pages
- Add next-sitemap package for sitemap
- Test with Google's Rich Results Test

Example Metadata:
```typescript
// app/page.tsx
export const metadata = {
  title: 'Flomad Travel - AI-Powered Trip Planning',
  description: 'Plan perfect trips with AI. Get flight, hotel, and activity recommendations instantly.',
  openGraph: {
    title: 'Flomad Travel',
    description: 'AI-Powered Trip Planning',
    url: 'https://flomadtravel.com',
    siteName: 'Flomad Travel',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Flomad Travel',
    description: 'AI-Powered Trip Planning',
    images: ['/og-image.jpg'],
  },
};
```

Files to Create/Modify:
- app/layout.tsx
- app/page.tsx  
- app/chat/page.tsx
- app/about/page.tsx
- public/sitemap.xml
- public/robots.txt
```

**Estimated Effort:** 25 hours  
**Developers:** 1 developer

---

#### Story 4.2: Performance Optimization

```
As a user,
I want pages to load quickly,
So that I don't wait and get frustrated.

Acceptance Criteria:
- [ ] Lighthouse Performance score > 90
- [ ] Largest Contentful Paint < 2.5s
- [ ] First Input Delay < 100ms
- [ ] Cumulative Layout Shift < 0.1
- [ ] Images optimized (WebP, lazy loading)
- [ ] Code splitting implemented
- [ ] Bundle size < 500KB
- [ ] Unused dependencies removed

Technical Notes:
- Use Next.js Image component for optimization
- Lazy load heavy components (Map, Chat)
- Run webpack-bundle-analyzer
- Remove unused npm packages
- Enable Next.js compiler optimizations

Optimization Techniques:
```typescript
// Lazy load Map component
const MapPanel = dynamic(() => import('@/components/features/map/RightMapPanel'), {
  loading: () => <MapSkeleton />,
  ssr: false // Don't render on server
});

// Optimize images
<Image
  src="/hero.jpg"
  alt="Travel planning"
  width={1200}
  height={600}
  priority // Load immediately for above-fold images
/>
```

Files to Modify:
- next.config.mjs (optimization settings)
- All components with heavy imports
- All image tags → Image components
```

**Estimated Effort:** 50 hours  
**Developers:** 2-3 developers

---

#### Story 4.3: Basic Caching Strategy

```
As a user,
I want frequently used data to load instantly,
So that I don't wait for the same data to reload.

Acceptance Criteria:
- [ ] API responses cached for appropriate durations
- [ ] Static assets have cache headers
- [ ] Service worker configured for offline support
- [ ] Stale-while-revalidate for non-critical data
- [ ] Cache invalidation when data changes
- [ ] Cache size limits set
- [ ] Cache works across page navigations

Technical Notes:
- Use SWR or React Query for data fetching
- Configure Next.js caching headers
- Add service worker with Workbox
- Cache flight/hotel searches (30 min)
- Cache weather data (1 hour)

Caching Pattern:
```typescript
// Using SWR for caching
import useSWR from 'swr';

const { data, error } = useSWR(
  `/api/locations/${sessionId}`,
  fetcher,
  {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 60000, // Cache for 1 minute
  }
);
```

Files to Create/Modify:
- Install: swr or @tanstack/react-query
- src/lib/api.ts (add caching wrapper)
- public/sw.js (service worker)
```

**Estimated Effort:** 40 hours  
**Developers:** 2 developers

---

#### Story 4.4: Database Query Optimization

```
As a backend developer,
I want database queries to be fast,
So that users don't wait for data to load.

Acceptance Criteria:
- [ ] Indexes added on frequently queried fields
- [ ] Slow queries identified and optimized
- [ ] Query results paginated (not loading all at once)
- [ ] N+1 query problems fixed
- [ ] Database connection pool optimized
- [ ] Query performance monitored
- [ ] Explain plans reviewed for complex queries

Technical Notes:
- Add MongoDB indexes (see Discovery.md)
- Add pagination to message loading
- Use MongoDB aggregation pipeline for complex queries
- Monitor query performance with logs

Indexes Needed:
```java
// MessageRepository - add compound index
@Indexed
private String sessionId;

// In migration or startup:
mongoTemplate.indexOps(Message.class)
  .ensureIndex(new Index()
    .on("sessionId", Sort.Direction.ASC)
    .on("createdAt", Sort.Direction.ASC)
  );
```

Files to Modify:
- Backend: model/entities/*.java (add @Indexed)
- Backend: Add database migration for indexes
- Backend: repositories/*.java (add pagination)
```

**Estimated Effort:** 30 hours  
**Developers:** 1-2 developers (backend focus)

---

### Sprint 4 - Tasks Breakdown

| Task | Owner | Hours | Status |
|------|-------|-------|--------|
| Story 4.1: SEO Metadata | Dev 1 | 25 | Not Started |
| Story 4.2: Performance Optimization | Dev 2,3,4 | 50 | Not Started |
| Story 4.3: Caching Strategy | Dev 5 & 1 | 40 | Not Started |
| Story 4.4: Database Query Optimization | Dev 2 & 3 | 30 | Not Started |
| **Total** | **All** | **145** | - |

---

## Sprint 5: Collaboration Features & Polish

**Duration:** 2 weeks  
**Goal:** Add sharing features and final polish for production

**Why This Sprint Matters:**
Now that the app is stable, fast, and well-tested, we can add features users have been asking for. Plus, final cleanup before calling it "done"!

---

### Sprint 5 - User Stories

#### Story 5.1: Trip Sharing

```
As a user,
I want to share my trip with friends,
So that we can plan together.

Acceptance Criteria:
- [ ] User can generate shareable link for trip
- [ ] Shared link opens trip in read-only mode
- [ ] User can make trip public or private
- [ ] Share dialog with copy-to-clipboard button
- [ ] Shared trip shows creator's name
- [ ] Shared trip has unique URL
- [ ] Share via email, Twitter, Facebook buttons

Technical Notes:
- Backend: Generate unique share token
- Backend: Add public/private flag to Session
- Frontend: Share dialog component
- Frontend: Read-only view of shared trip

Implementation:
```java
// Backend: SessionController.java
@PostMapping("/sessions/{sessionId}/share")
public ShareLinkResponse createShareLink(@PathVariable String sessionId) {
  String shareToken = UUID.randomUUID().toString();
  session.setShareToken(shareToken);
  session.setIsPublic(true);
  return new ShareLinkResponse(baseUrl + "/shared/" + shareToken);
}
```

Files to Create/Modify:
- Backend: SessionController.java (share endpoints)
- Frontend: src/components/ShareDialog.tsx
- Frontend: app/shared/[token]/page.tsx
```

**Estimated Effort:** 45 hours  
**Developers:** 2 developers

---

#### Story 5.2: User Roles (Basic)

```
As an administrator,
I want to manage user accounts,
So that I can help users and moderate content.

Acceptance Criteria:
- [ ] Admin role exists in database
- [ ] Admin can view all users
- [ ] Admin can view all trips
- [ ] Admin dashboard created
- [ ] Admin can disable/enable users
- [ ] Admin actions are logged
- [ ] Admin role is secure (not assignable by users)

Technical Notes:
- Roles already exist in backend (ROLE_ADMIN)
- Create admin dashboard page
- Add authorization checks
- Log admin actions to database

Admin Dashboard:
```typescript
// app/admin/page.tsx
export default function AdminDashboard() {
  const { currentUser } = useAuth();
  
  if (currentUser.role !== 'ADMIN') {
    return <div>Access Denied</div>;
  }
  
  return (
    <div>
      <h1>Admin Dashboard</h1>
      <UserList />
      <TripList />
      <SystemStats />
    </div>
  );
}
```

Files to Create:
- Frontend: app/admin/page.tsx
- Frontend: src/components/admin/* (dashboard components)
- Backend: AdminController.java (admin endpoints)
```

**Estimated Effort:** 40 hours  
**Developers:** 2 developers

---

#### Story 5.3: Final Bug Fixes

```
As a team,
I want all known bugs fixed,
So that we can ship with confidence.

Acceptance Criteria:
- [ ] All P0 and P1 bugs from backlog fixed
- [ ] No critical linter errors
- [ ] No failing tests
- [ ] All console.logs removed
- [ ] All TODOs in code addressed
- [ ] Browser console has no errors
- [ ] Manual testing completed

Technical Notes:
- Review all GitHub issues
- Run full test suite
- Manual testing checklist
- Cross-browser testing (Chrome, Firefox, Safari)
- Mobile testing on real devices

Testing Checklist:
- [ ] Sign up flow works
- [ ] Sign in flow works
- [ ] OAuth login works (all providers)
- [ ] Chat history persists
- [ ] Guest → User transition works
- [ ] Map updates in real-time
- [ ] Mobile UI is usable
- [ ] Error messages are helpful
```

**Estimated Effort:** 50 hours  
**Developers:** All (10 hours each)

---

#### Story 5.4: Documentation Completion

```
As a new developer joining the team,
I want comprehensive documentation,
So that I can get up to speed quickly.

Acceptance Criteria:
- [ ] README has setup instructions
- [ ] API endpoints documented
- [ ] Component library documented
- [ ] Architecture documented
- [ ] Deployment process documented
- [ ] Troubleshooting guide created
- [ ] FAQ created
- [ ] Contributing guide updated

Technical Notes:
- Update all existing docs
- Add code examples where helpful
- Include screenshots
- Link to external resources

Documentation Structure:
- README.md - Quick start
- docs/SETUP.md - Detailed setup
- docs/ARCHITECTURE.md - System design
- docs/API.md - API endpoints
- docs/COMPONENTS.md - Component usage
- docs/DEPLOYMENT.md - How to deploy
- docs/TROUBLESHOOTING.md - Common issues
```

**Estimated Effort:** 30 hours  
**Developers:** All (6 hours each)

---

#### Story 5.5: Production Readiness Checklist

```
As a team lead,
I want to verify the app is production-ready,
So that we ship with confidence.

Acceptance Criteria:
- [ ] All environment variables documented
- [ ] Production secrets rotated
- [ ] Error tracking configured (Sentry)
- [ ] Monitoring configured (uptime checks)
- [ ] Analytics configured
- [ ] Backup strategy in place
- [ ] Rollback plan documented
- [ ] Performance benchmarks met
- [ ] Security audit completed
- [ ] Legal pages created (Privacy, Terms)

Technical Notes:
- Set up Sentry for error tracking
- Configure uptime monitoring (UptimeRobot)
- Verify Google Analytics working
- Create database backup schedule
- Review security best practices

Production Checklist:
```markdown
## Pre-Launch Checklist

### Security
- [ ] No hardcoded secrets
- [ ] HTTPS enforced
- [ ] CORS configured properly
- [ ] Rate limiting enabled
- [ ] Input validation on all forms

### Performance
- [ ] Lighthouse score > 90
- [ ] Images optimized
- [ ] Caching configured
- [ ] CDN enabled

### Monitoring
- [ ] Error tracking (Sentry)
- [ ] Analytics (Google Analytics)
- [ ] Uptime monitoring
- [ ] Performance monitoring

### Legal
- [ ] Privacy Policy published
- [ ] Terms of Service published
- [ ] Cookie consent (if needed)
```
```

**Estimated Effort:** 25 hours  
**Developers:** 1 developer + team review

---

### Sprint 5 - Tasks Breakdown

| Task | Owner | Hours | Status |
|------|-------|-------|--------|
| Story 5.1: Trip Sharing | Dev 1 & 2 | 45 | Not Started |
| Story 5.2: User Roles | Dev 3 & 4 | 40 | Not Started |
| Story 5.3: Bug Fixes | All | 50 | Not Started |
| Story 5.4: Documentation | All | 30 | Not Started |
| Story 5.5: Production Readiness | Dev 5 | 25 | Not Started |
| **Total** | **All** | **190** | - |

---

## Summary: 10-Week Roadmap

### Timeline Overview

```
Week 1-2:  Sprint 1 - Core Stabilization(MVP)
Week 3-4:  Sprint 2 - Testing Foundation
Week 5-6:  Sprint 3 - UI/UX & Mobile
Week 7-8:  Sprint 4 - Performance & SEO
Week 9-10: Sprint 5 - Features & Polish(Production ready)
```

### Total Effort Summary

| Sprint | Planned Hours | Buffer Hours | Total Capacity |
|--------|---------------|--------------|----------------|
| Sprint 1 | **242** | **78** | 320 |
| Sprint 2 | 186 | 134 | 320 |
| Sprint 3 | 180 | 140 | 320 |
| Sprint 4 | 145 | 175 | 320 |
| Sprint 5 | 190 | 130 | 320 |
| **Total** | **943** | **657** | **1600** |

**Note:** Buffer hours are for learning, meetings, code review, and unexpected issues.

---

## Team Roles & Responsibilities

### Recommended Structure

**Developer 1-2:** Frontend Focus
- React components
- UI/UX implementation
- Client-side state management

**Developer 3-4:** Full Stack
- API integration
- Backend endpoints
- Database queries

**Developer 5:** DevOps & Quality
- CI/CD setup
- Testing infrastructure
- Deployment automation

**Rotation:** Switch roles every sprint for cross-training!

---

## Learning Resources by Sprint

### Sprint 1 Resources
- React Context API: https://react.dev/learn/passing-data-deeply-with-context
- Next.js App Router: https://nextjs.org/docs/app
- GitHub Actions: https://docs.github.com/en/actions
- JWT & Refresh Tokens: https://auth0.com/blog/refresh-tokens-what-are-they-and-when-to-use-them/
- httpOnly Cookies: https://owasp.org/www-community/HttpOnly
- Browser Storage Security: https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/11-Client-side_Testing/12-Testing_Browser_Storage

### Sprint 2 Resources
- Jest Testing: https://jestjs.io/docs/getting-started
- React Testing Library: https://testing-library.com/docs/react-testing-library/intro/
- Code Review Guide: https://google.github.io/eng-practices/review/

### Sprint 3 Resources
- Responsive Design: https://web.dev/responsive-web-design-basics/
- Accessibility: https://www.w3.org/WAI/fundamentals/accessibility-intro/
- Tailwind CSS: https://tailwindcss.com/docs

### Sprint 4 Resources
- Web Performance: https://web.dev/performance/
- SEO Fundamentals: https://developers.google.com/search/docs/beginner/seo-starter-guide
- Next.js Performance: https://nextjs.org/docs/pages/building-your-application/optimizing

### Sprint 5 Resources
- Security Best Practices: https://owasp.org/www-project-top-ten/
- Production Deployment: https://vercel.com/docs/deployments/overview
- Monitoring: https://docs.sentry.io/

---

## Risk Management

### Common Risks & Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
|  devs get stuck | High | Medium | Daily standups, pair programming |
| Features take longer than estimated | High | Medium | 40% buffer time built in |
| Tests are hard to write | Medium | Low | Pair with senior dev, use examples |
| Production deployment fails | Low | High | Staging environment, rollback plan |
| User feedback requires changes | Medium | Medium | Prioritize after Sprint 5 |

---

## Success Metrics

### After 10 Weeks, We Should Have:

**Code Quality:**
- ✅ 70%+ test coverage
- ✅ 0 console.log statements
- ✅ All linter rules passing
- ✅ CI/CD pipeline operational

**User Experience:**
- ✅ Chat history 100% reliable
- ✅ Mobile-friendly UI
- ✅ Fast page loads (Lighthouse > 90)
- ✅ Clear error messages

**Team Growth:**
- ✅ All devs can write tests
- ✅ All devs understand the codebase
- ✅ Code review culture established
- ✅ Documentation maintained

---

## What Happens After Sprint 5?

### Next Steps (Week 11+)

1. **Sprint Retrospective**
   - What went well?
   - What can improve?
   - Lessons learned

2. **User Feedback Collection**
   - Beta testing
   - User interviews
   - Analytics review

3. **Plan Next Quarter**
   - New features
   - Performance improvements
   - Scaling preparation

4. **Celebrate! 🎉**
   - Team accomplished a lot
   - From broken to production-ready
   - Grew as developers

---

**Remember:** Done is better than perfect. Ship early, learn fast, iterate quickly!

**Next Document:** `FunctionalSpecification.md` for detailed feature requirements.
