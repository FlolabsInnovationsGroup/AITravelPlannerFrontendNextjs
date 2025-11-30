# AI Travel Planner - Functional Specification (Simplified)

**Date:** October 22, 2025  
**Version:** 2.0 (Junior Team Edition)  
**Target Audience:** Junior Developers  
**Purpose:** Understand what the app does and how users interact with it

---

## What This Document Does

This document explains **what the app does from a user's perspective**, not how it's built technically (that's in TechnicalSpecification.md).

Think of this as the "instruction manual" for understanding user needs.

---

## Product Overview (What We're Building)

### The Big Picture

**Flomad Travel** is a website that helps people plan trips using AI.  
Instead of searching 10 different sites for flights, hotels, and activities, users just chat with our AI assistant.

**One-Sentence Description:**
"Chat with AI to plan perfect trips - get flights, hotels, and activities all in one place."

### How It's Different

**Traditional Trip Planning:**
1. User Googles "flights to Paris"
2. Opens 5 tabs (Expedia, Booking.com, TripAdvisor, etc.)
3. Manually compares prices
4. Forgets what they searched
5. Starts over when they close browser

**Our AI Trip Planning:**
1. User types "Plan a trip to Paris next month"
2. AI asks questions and shows options
3. Everything saves automatically
4. Map shows all locations
5. Trip is there when they come back

---

## User Types (Who Uses This?)

### 1. Guest User (Not Signed Up)

**Who They Are:**
- First-time visitors
- Trying out the app
- Not sure if they want to create account yet

**What They Can Do:**
- ✅ Chat with AI
- ✅ Get trip recommendations
- ✅ See locations on map
- ✅ Search flights/hotels/tours
- ❌ Can't save trips long-term
- ❌ Can't access from other devices
- ❌ Limited to 50 messages

**Why This Matters:**
Let people try before they commit. Like a "free sample" at the grocery store!

**Example User:**
Sarah wants to plan a weekend trip to London. She's not sure if she'll use the app again, so she just wants to try it quickly.

---

### 2. Authenticated User (Signed Up)

**Who They Are:**
- Created an account
- Planning trips seriously
- Want to save and access later

**What They Can Do:**
- ✅ Everything guests can do, PLUS:
- ✅ Save unlimited trips
- ✅ Access trips from any device
- ✅ Chat history saved forever
- ✅ Share trips with friends (Sprint 5)
- ✅ Export trip plans
- ✅ Manage profile and preferences

**Example User:**
Mike is planning a 2-week Europe trip. He needs to save his research, share with his girlfriend, and access from phone and laptop.

---

### 3. Administrator (Us!)

**Who They Are:**
- Team members
- Support staff
- System managers

**What They Can Do:**
- ✅ Everything users can do, PLUS:
- ✅ View all users and trips
- ✅ Help users with problems
- ✅ See system health
- ✅ Manage content

**Example Use:**
Support team needs to help a user who lost their trip data.

---

## Core Features (What the App Does)

### Feature 1: AI Chat Assistant

**What It Is:**
Users type questions in natural language (like texting a friend), and AI responds with helpful travel information.

**User's Perspective:**
```
User: "I want to visit Japan in spring"
AI: "Spring in Japan is beautiful! Cherry blossoms bloom March-April. 
     I can help you plan. When exactly are you thinking? And what's 
     your budget?"

User: "Mid-April, around $3000"
AI: "Perfect! Let me search flights and hotels for you..."
```

**Why Users Like It:**
- No forms to fill out
- Conversational and friendly
- Understands context
- Remembers what you said earlier

**Technical Note (for devs):**
Behind the scenes, AI calls "functions" to search flights, hotels, etc. But user just sees natural conversation.

---

### Feature 2: Trip Planning & Saving

**What It Is:**
Every conversation is a "trip." Users can have multiple trips (Paris trip, Tokyo trip, etc.) and switch between them.

**User Flow:**
```
1. User starts chatting → New trip created automatically
2. AI suggests locations → Locations save to trip
3. User can switch between trips in sidebar
4. All trips saved forever (if authenticated)
```

**Why Users Need This:**
People often plan multiple trips at once. Maybe comparing Paris vs Rome, or planning now for future trips.

**What Can Go Wrong:**
- **Problem:** Chat history disappears (Issue #1 in Discovery.md)
- **Fix:** Always save to database, even for guests

---

### Feature 3: Interactive Map

**What It Is:**
As AI suggests locations, they automatically appear on a Google Map in real-time.

**User Experience:**
```
User: "Show me cool places in Paris"
AI: "Here are some favorites..."
*Eiffel Tower appears on map*
*Louvre appears on map*
*Notre Dame appears on map*
```

**Why Users Love This:**
- Visual! See where everything is
- Understand distances between places
- Discover nearby attractions
- Plan logical routes

**How It Works (Simplified):**
1. AI adds location via function call
2. Backend saves to database
3. WebSocket tells frontend "new location!"
4. Map updates instantly
5. User sees marker appear

---

### Feature 4: Flight Search

**What It Is:**
Users ask about flights, AI searches Amadeus API and shows options.

**User Conversation:**
```
User: "Find flights from NYC to London"
AI: "I found 15 flights for you. Here are the best options:
     
     1. British Airways - $450 - Direct
     2. Delta - $425 - 1 stop
     3. United - $480 - Direct
     
     Would you like to see more details on any of these?"
```

**Important:**
We DON'T book flights. We show options and link to airline/booking sites.

**Why Not Book Directly:**
- Requires payment processing (complex!)
- Legal/regulatory issues
- Focus on planning, not booking

---

### Feature 5: Hotel Search

**What It Is:**
AI finds hotels near user's destination using Google Places API.

**User Experience:**
```
User: "Hotels near Eiffel Tower"
AI: "I found 20 hotels nearby:
     
     🏨 Hotel Paris Eiffel - $200/night - ⭐ 4.5
     🏨 Le Parisis - $150/night - ⭐ 4.2
     🏨 Pullman Paris - $180/night - ⭐ 4.4
     
     All are within walking distance. Need more info on any?"
```

**Features:**
- Filter by price range
- Sort by rating or distance
- Show amenities
- Link to booking sites

---

### Feature 6: Tours & Activities

**What It Is:**
Using Viator API, AI suggests things to do at destination.

**User Example:**
```
User: "What can I do in Rome?"
AI: "Lots of amazing options!
     
     🎨 Colosseum Skip-the-Line Tour - $45
     🍕 Rome Food Tour - $80
     🏛️ Vatican Museums Tour - $60
     
     Want details on any of these?"
```

**Why This Helps:**
Users often book flights/hotels but forget to plan activities. We make it easy!

---

### Feature 7: Budget Optimization

**What It Is:**
AI helps users save money on their trips.

**User Conversation:**
```
User: "I only have $1000 for a week in Thailand"
AI: "No problem! Here's how to make it work:
     
     💰 Budget Breakdown:
     - Accommodation: $200 (hostels/budget hotels)
     - Food: $150 (street food + local restaurants)
     - Activities: $200 (mix of free and paid)
     - Transport: $100 (public transport)
     - Buffer: $350
     
     💡 Money-Saving Tips:
     - Book flights 6-8 weeks in advance (save 25%)
     - Stay in Chiang Mai instead of Bangkok (30% cheaper)
     - Eat at local markets (save 60% on food)
     
     Want specific hotel/flight recommendations?"
```

**Why Users Need This:**
Travel can be expensive. AI helps stretch budgets further.

---

### Feature 8: Emergency Assistance

**What It Is:**
If user has travel emergency, AI provides immediate help.

**Critical Use Case:**
```
User: "Help! I lost my passport in Madrid"
AI: "🆘 Don't worry, here's what to do RIGHT NOW:
     
     1. FILE A POLICE REPORT
        Nearest station: Comisaría de Policía
        Address: Calle Leganitos 19
        Emergency: 112
     
     2. CONTACT US EMBASSY
        Address: Calle Serrano 75
        Phone: +34 91 587 2200
        Emergency: +34 91 587 2240
     
     3. DOCUMENTS YOU NEED:
        - Police report
        - Passport photos
        - ID (driver's license, etc.)
     
     4. TIMELINE:
        - Emergency passport: 1-2 days
        - Regular passport: 2-3 weeks
     
     Need more help? I'm here for you."
```

**Why This Feature Is Critical:**
Emergencies are stressful. Clear, immediate help can make huge difference.

---

### Feature 9: User Authentication

**What It Is:**
Users can create accounts and log in.

**Sign-Up Options:**
1. Email & Password
2. Sign in with Google
3. Sign in with LinkedIn
4. Sign in with Facebook

**What Happens:**
1. User clicks "Sign Up"
2. Fills form or chooses OAuth provider
3. Creates account
4. Gets redirected to chat
5. Previous guest session transfers (if applicable)

**Common Problem (Fix in Sprint 1):**
- OAuth redirects go to wrong page → 404 error
- Guest data doesn't transfer after sign-up

---

### Feature 10: Weather Information

**What It Is:**
AI shows weather forecasts for trip destinations.

**Example:**
```
User: "What's the weather like in Bali in June?"
AI: "Bali weather in June:
     🌡️ Temperature: 75-80°F (24-27°C)
     🌧️ Rainfall: Moderate (dry season!)
     ☀️ Sunshine: 8 hours/day
     
     Perfect time to visit! Pack:
     - Light clothing
     - Swimsuit
     - Light rain jacket (occasional showers)
     - Sunscreen SPF 50+"
```

**Why Users Need This:**
Helps pack appropriately and plan activities.

---

## User Flows (How People Use the App)

### Flow 1: First-Time Visitor (Guest User)

**Story:**
Emma has never heard of Flomad Travel. She clicks a Google ad.

**Current Steps:** (How it works now - with issues)
1. **Lands on Homepage**
   - System creates guest token automatically on first load
   - Sees: "Explore your way, all the way."
   - Sees input box with placeholder "Start planning your trip..."
   - Has two options:
     a) Enter prompt directly and click "Start Chatting" 
     b) Click "Go to Chat" button to go to chat
   - If enters prompt:
     - Full page reload to chat page (window.location.href)
     - Shows their message
     - Shows AI response
   - If clicks "Go to chat":
     - Full page reload to chat page as guest user

**What Can Go Wrong (Current Issues):**
- ❌ Guest token fails to generate → User can't start chatting → Shows error message
- ❌ Network error during redirect → User stuck on homepage → Retry button appears
- ❌ AI response fails → User sees loading forever → Shows timeout message after 30s
- ❌ Close browser tab → Session ID lost (stored in sessionStorage) → All work gone
- ❌ Token expires (24hr) → Creates NEW guest token → User loses authenticated session
- ❌ Sign up after planning trip → Full page reload → React state lost (but data saved if migrated)
- ❌ Multiple API calls + token expires → Multiple refresh attempts → Race condition

**Current Problems (Why Users Are Frustrated):**
- 😞 Close tab, come back tomorrow → Everything is gone (sessionStorage cleared)
- 😞 Sign up to save trip → Page flickers/reloads → Feels broken
- 😞 Use app for 25 hours → Token expires → Suddenly kicked out
- 😞 Refresh page mid-conversation → Map markers reload slowly

**Future Steps:** (After Sprint 1 - How it WILL work)
1. **Lands on Homepage**
   - System checks for previous session (device UUID in localStorage)
   - If session found (<7 days old):
     - Shows: "Welcome back! Continue planning your Paris trip?"
     - User can click [Continue] or [Start New]
   - If no previous session:
     - Creates guest token automatically
   - Sees: "Explore your way, all the way."
   - Sees input box with placeholder "Start planning your trip..."

2. **User Continues Previous Session** (New Feature!)
   - Clicks [Continue]
   - All previous messages load from database
   - All map locations restore
   - Can pick up exactly where they left off ✅

3. **User Starts Chatting**
   - Types message or clicks "Go to Chat"
   - Smooth navigation (router.push, no page reload)
   - React state preserved
   - Device UUID saved to localStorage
   - Session ID mapped to device UUID in backend

4. **Token Management (Invisible to User)**
   - Access token: 15 minutes (in localStorage)
   - Refresh token: 7 days (in httpOnly cookie)
   - Every minute, frontend checks if token expires soon
   - If <5 min remaining: Auto-refresh in background
   - User never gets kicked out unexpectedly ✅

5. **User Signs Up After Planning**
   - Clicks "Sign Up" button
   - Completes sign-up form or OAuth
   - Smooth transition (router.push, no reload)
   - Guest session automatically migrates to user account
   - All messages and locations preserved
   - Shows: "Welcome! Your trip has been saved" ✅

6. **User Returns After Browser Close** (New Feature!)
   - Opens site next day
   - System detects device UUID
   - Backend finds last session (within 7 days)
   - Shows restoration prompt with preview
   - All work preserved ✅

7. **Sees Map Update**
   - AI mentions Sagrada Familia
   - Marker appears on map
   - Emma clicks marker, sees info

5. **Gets Hooked**
   - Has 10+ messages about Barcelona trip
   - Map has 5 locations marked
   - Sees prompt: "Sign up to save your trip!"

6. **Creates Account**
   - Clicks "Sign Up"
   - Uses "Sign in with Google"
   - **CRITICAL:** Trip data transfers to account
   - Sees confirmation: "Your Barcelona trip is saved!"

7. **Continues Planning**
   - Now everything saves forever
   - Can access from phone later
   - Can share with friends

**What Can Go Wrong:**
- ❌ Chat history disappears on refresh → Emma loses work → Leaves frustrated
- ❌ Guest data doesn't transfer after signup → Emma loses Barcelona trip → Never comes back

**Success Criteria:**
- ✅ Emma completes sign-up
- ✅ All her Barcelona data transfers
- ✅ She continues using the app

---

### Flow 2: Returning User (Planning Multiple Trips)

**Story:**
Mike is planning a 3-week Europe trip. He's comparing Paris vs Amsterdam for week 2.

**Steps:**
1. **Returns to App**
   - Opens app URL directly
   - If last session < 7 days old:
     - Automatically enters chat page
     - Previous conversation loads
   - If session expired:
     - Prompted to sign in
     - Can use credentials or OAuth
     - Redirected to chat

2. **Sees Previous Trips**
   - Sidebar shows:
     - "Paris Trip" (3 days ago)
     - "Amsterdam Research" (1 day ago)
   - Clicks "Paris Trip"

3. **Reviews Paris Plan**
   - All previous messages load
   - Map shows all Paris locations
   - Remembers where conversation left off

4. **Compares to Amsterdam**
   - Clicks "New Chat"
   - Types: "Show me Amsterdam hotels"
   - Creates new trip session
   - Compares both in separate tabs

5. **Makes Decision**
   - Decides on Amsterdam
   - Continues planning in Amsterdam chat
   - Can archive Paris trip for later

6. **Shares with Girlfriend**
   - Clicks "Share Trip" button
   - Copies link
   - Sends to girlfriend
   - She can view (read-only)

**What Can Go Wrong:**
- ❌ Previous trips don't load → Mike can't find Paris plan
- ❌ Messages load in wrong order → Conversation doesn't make sense
- ❌ Share link broken → Girlfriend can't see trip

**Success Criteria:**
- ✅ All trips load correctly
- ✅ Messages in chronological order
- ✅ Share feature works smoothly

---

### Flow 3: Emergency Situation

**Story:**
Lisa is in Tokyo. She loses her wallet with credit cards and ID.

**Steps:**
1. **Opens App in Panic**
   - Types frantically: "HELP! I lost my wallet in Tokyo"

2. **AI Detects Emergency**
   - Recognizes emergency keywords
   - Responds IMMEDIATELY (no delay)

3. **Gets Action Steps**
   - AI shows step-by-step guide:
     - Contact bank to freeze cards
     - File police report
     - Contact embassy if passport in wallet
     - Get emergency cash

4. **Gets Contact Info**
   - US Embassy Tokyo address & phone
   - Nearest police station
   - 24/7 hotline numbers

5. **Follows Steps**
   - Has clear plan
   - Knows exactly what to do
   - Stays calm because she has help

**Why This Flow Matters:**
This could be the difference between a bad situation and a disaster. Our app becomes a lifeline.

**Success Criteria:**
- ✅ Emergency detected within 1 second
- ✅ Response shows within 2 seconds
- ✅ Clear, actionable steps provided
- ✅ Contact info accurate

---

### Flow 4: Budget-Conscious Traveler

**Story:**
Kevin is a student with limited money. He wants to visit Thailand but only has $1200.

**Steps:**
1. **States Budget Up Front**
   - Types: "I have $1200 for 2 weeks in Thailand, help me budget"

2. **AI Detects Budget Keywords**
   - Activates budget optimization mode
   - Doesn't ask for more details, provides immediate help

3. **Gets Budget Breakdown**
   - Daily budget calculated
   - Money-saving tips provided
   - Budget-friendly options shown

4. **Sees Specific Recommendations**
   - Hostels instead of hotels
   - Street food locations
   - Free activities
   - Public transport routes

5. **Adjusts Plan**
   - Kevin: "Actually I only have $1000"
   - AI recalculates
   - Shows even more budget options
   - Suggests shorter trip or different destination

6. **Books with Confidence**
   - Knows exactly how much to spend
   - Has buffer for emergencies
   - Feels prepared

**Success Criteria:**
- ✅ Budget advice shows immediately
- ✅ All recommendations fit budget
- ✅ User feels empowered, not restricted

---

## Common User Problems (Edge Cases)

### Problem 1: User Misspells Location

**What Happens:**
```
User: "Show me hotles in Londn"
```

**How We Handle It:**
- AI understands intent (hotels, London)
- Corrects spelling silently
- Shows results
- OR asks: "Did you mean hotels in London?"

**Wrong Way:**
"Error: Location not found"

---

### Problem 2: User Asks Impossible Request

**What Happens:**
```
User: "I want to visit every country in 1 week"
```

**How We Handle It:**
- AI politely explains it's not feasible
- Suggests alternatives
- Asks about priorities

**Response Example:**
"That's an ambitious goal! Unfortunately, visiting every country in a week isn't possible. But I can help you plan an amazing trip! Which region interests you most? Europe, Asia, Americas?"

---

### Problem 3: API Fails (Flight Search Down)

**What Happens:**
Backend can't reach Amadeus API.

**How We Handle It:**
```
AI: "I'm having trouble reaching the flight search service right now. 
     Would you like me to:
     1. Try again in a minute
     2. Help with hotels/activities instead
     3. Show you direct links to airline sites"
```

**Wrong Way:**
"Error 500: Internal Server Error"

---

### Problem 4: User Loses Internet Connection

**What Happens:**
User's WiFi drops mid-conversation.

**How We Handle It:**
- Show "Offline" indicator
- Queue messages locally
- Send when connection restores
- Load from cache if available

**Wrong Way:**
Spinning loader forever, no feedback.

---

## Feature Requirements (Must-Haves vs Nice-to-Haves)

### Must-Have (Can't ship without)
- ✅ AI chat works
- ✅ Messages persist
- ✅ Guest users can use basic features
- ✅ Sign up/sign in works
- ✅ Map shows locations
- ✅ Flight/hotel search works
- ✅ Mobile-responsive

### Should-Have (Important but can wait)
- ⏸️ Trip sharing
- ⏸️ Export trips
- ⏸️ User profile management
- ⏸️ Admin dashboard
- ⏸️ Dark mode

### Nice-to-Have (Future features)
- 💡 Voice input
- 💡 Multi-language support
- 💡 Collaborative trip planning
- 💡 Calendar integration
- 💡 Price alerts
- 💡 Trip recommendations based on history

---

## Business Rules (How the App Should Work)

### Rule 1: Guest User Limitations
- Maximum 50 messages per session
- Session expires after 24 hours of inactivity
- Data can be lost if browser cleared
- No access across devices

**Why:** Encourage sign-ups while still allowing trials.

---

### Rule 2: Message Persistence
- All messages save to database immediately
- Guest messages tied to session, not user
- After sign-up, guest messages transfer to user account
- Messages load in chronological order

**Why:** Users hate losing work.

---

### Rule 3: Location Management
- Maximum 100 locations per trip
- Duplicate locations prevented (same name + coordinates)
- Locations must be valid (geocodable)
- Real-time updates via WebSocket

**Why:** Prevent abuse and ensure data quality.

---

### Rule 4: External API Results
- Flight results cached 30 minutes
- Hotel results cached 1 hour
- Weather cached 3 hours
- Tour results cached 24 hours

**Why:** Reduce API costs and improve speed.

---

### Rule 5: Error Handling
- Always show user-friendly errors
- Never show technical stack traces
- Suggest next steps
- Log errors to monitoring (Sentry)

**Why:** Users shouldn't see our internal problems.

---

## Accessibility Requirements

### Keyboard Navigation
- All features accessible without mouse
- Tab order is logical
- Enter/Space activates buttons
- Escape closes modals

**Why:** Some users can't use a mouse.

---

### Screen Reader Support
- All buttons have labels
- Images have alt text
- Forms have labels
- Errors announced
- Loading states announced

**Why:** Blind users need to hear what's on screen.

---

### Color Contrast
- Text meets WCAG AA standards
- Important info not color-only
- Focus indicators visible

**Why:** Users with vision impairments need high contrast.

---

## Performance Requirements

### Speed
- Pages load in < 3 seconds
- Chat responses in < 2 seconds
- Map updates in < 1 second
- Button clicks respond < 100ms

**Why:** Slow sites lose users.

---

### Mobile
- Works on phones (320px+ width)
- Touch targets 44x44px minimum
- Readable text (16px+ font size)
- No horizontal scroll

**Why:** 60%+ of users are on mobile.

---

## Security & Privacy

### User Data
- Passwords hashed (bcrypt)
- Tokens encrypted
- HTTPS only
- No data sold to third parties

---

### Chat Content
- Trip data private by default
- Only visible to owner (and shared users)
- Admins can view for support only
- No AI training on user data

---

## Success Metrics (How We Know It Works)

### User Engagement
- Average session time: 10+ minutes
- Messages per session: 15+
- Return rate: 40%+
- Guest → User conversion: 30%+

---

### Technical Performance
- Uptime: 99.5%+
- API response time: < 2s (95th percentile)
- Error rate: < 1%
- Zero data loss incidents

---

### User Satisfaction
- App rating: 4.5+ stars
- NPS score: 50+
- Support tickets: < 5% of users
- Feature requests: tracked and prioritized

---

## Glossary (Simple Definitions)

**AI Assistant** = Computer program that understands and responds to natural language

**OAuth** = "Sign in with Google" - letting other sites handle login

**Session** = One conversation or trip plan

**Guest User** = Someone using the app without signing up

**WebSocket** = Technology for real-time updates (like map markers appearing instantly)

**API** = Way for different computer programs to talk to each other

**Cache** = Temporarily saving data so it loads faster next time

**Responsive** = Website adapts to different screen sizes

---

## Next Steps for Developers

**After Reading This:**
1. You understand WHAT the app does
2. You understand WHO uses it
3. You understand WHY features exist

**Next Read:**
- `TechnicalSpecification.md` - HOW it's built
- `Architecture.md` - System design overview
- `SprintBreakdown.md` - What to build when

---

**Remember:** We're building for real people with real needs. Every feature should make their lives easier!

**Questions?** Ask the team! Understanding users is everyone's job.
