# Diagram Architektury Autentykacji - VibeTravels

## 1. Przegląd Architektury Systemu Autentykacji

```mermaid
graph TB
    subgraph "Client Layer - Browser"
        User[👤 User]
        SignupPage["/auth/signup<br/>Signup Page"]
        LoginPage["/auth/login<br/>Login Page"]
        TripsPage["/trips<br/>Trips List"]
        TripDetailPage["/trips/:id<br/>Trip Details"]

        SignupForm["SignupForm.tsx<br/>(React Component)"]
        LoginForm["LoginForm.tsx<br/>(React Component)"]
        UserMenu["UserMenu.tsx<br/>(React Component)"]
        TripsList["TripsList.tsx<br/>(React Component)"]

        useAuth["useAuth Hook<br/>(Client-side Auth State)"]
    end

    subgraph "Astro SSR Layer"
        Middleware["Middleware<br/>(index.ts)<br/>🔒 Protected Routes Check"]

        subgraph "Protected Pages"
            TripsIndexAstro["trips/index.astro"]
            TripsNewAstro["trips/new.astro"]
            TripDetailAstro["trips/[id].astro"]
            TripEditAstro["trips/[id]/edit.astro"]
        end

        subgraph "Auth Pages"
            SignupAstro["auth/signup.astro"]
            LoginAstro["auth/login.astro"]
        end
    end

    subgraph "API Layer"
        TripsAPI["API: /api/trips<br/>GET, POST"]
        TripByIdAPI["API: /api/trips/:id<br/>GET, PATCH, DELETE"]
        GenerateAIAPI["API: /api/trips/:id/generate-ai<br/>POST"]

        AuthHelper["authenticateRequest()<br/>JWT Token Validation"]
        TripService["TripService.ts<br/>Business Logic"]
        Validation["validation.ts<br/>Input Validation"]
    end

    subgraph "Supabase Backend"
        SupabaseAuth["Supabase Auth<br/>Authentication Service"]
        SupabaseDB["PostgreSQL Database<br/>with Row Level Security"]

        subgraph "Database Tables"
            UsersTable["auth.users<br/>(Managed by Supabase)"]
            TripsTable["public.trips<br/>(User Data)"]
        end

        RLSPolicies["RLS Policies<br/>🔒 User-specific filtering"]
    end

    subgraph "External Services"
        OpenRouter["OpenRouter API<br/>AI Content Generation"]
    end

    %% User interactions
    User -->|1. Navigate to| SignupPage
    User -->|2. Navigate to| LoginPage
    User -->|3. Access protected| TripsPage

    %% Signup flow
    SignupPage -->|Embeds| SignupForm
    SignupForm -->|signUp()| SupabaseAuth
    SupabaseAuth -->|Create user| UsersTable
    SupabaseAuth -->|Return JWT| SignupForm
    SignupForm -->|Redirect| TripsPage

    %% Login flow
    LoginPage -->|Embeds| LoginForm
    LoginForm -->|signInWithPassword()| SupabaseAuth
    SupabaseAuth -->|Verify credentials| UsersTable
    SupabaseAuth -->|Return JWT + session| LoginForm
    LoginForm -->|Store in localStorage| useAuth
    LoginForm -->|Redirect| TripsPage

    %% Protected route access
    TripsPage -->|SSR Request| Middleware
    Middleware -->|Check session| SupabaseAuth
    SupabaseAuth -->|Valid session?| Middleware
    Middleware -->|✅ Authorized| TripsIndexAstro
    Middleware -->|❌ Unauthorized| LoginPage

    %% Component rendering
    TripsIndexAstro -->|Renders| TripsList
    TripsList -->|useAuth| useAuth
    useAuth -->|getSession()| SupabaseAuth

    %% API calls with auth
    TripsList -->|GET /api/trips<br/>Bearer Token| TripsAPI
    TripsAPI -->|Validate token| AuthHelper
    AuthHelper -->|getUser()| SupabaseAuth
    SupabaseAuth -->|Return user| AuthHelper
    AuthHelper -->|Create client with token| TripService
    TripService -->|Query with RLS| SupabaseDB
    SupabaseDB -->|Apply RLS| RLSPolicies
    RLSPolicies -->|Filter by user_id| TripsTable
    TripsTable -->|Return user's trips| TripService
    TripService -->|Transform to DTO| TripsAPI
    TripsAPI -->|JSON response| TripsList

    %% Logout flow
    TripsPage -->|Embeds| UserMenu
    UserMenu -->|signOut()| SupabaseAuth
    SupabaseAuth -->|Clear session| useAuth
    UserMenu -->|Redirect| LoginPage

    %% AI generation
    TripsList -->|Create trip with AI| TripsAPI
    TripsAPI -->|Call| TripService
    TripService -->|Insert trip status=generating| TripsTable
    TripsList -->|POST /api/trips/:id/generate-ai| GenerateAIAPI
    GenerateAIAPI -->|Generate content| OpenRouter
    OpenRouter -->|Return AI content| GenerateAIAPI
    GenerateAIAPI -->|Update trip| TripsTable

    %% Styling
    classDef clientLayer fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    classDef astroLayer fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    classDef apiLayer fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef supabaseLayer fill:#e8f5e9,stroke:#388e3c,stroke-width:2px
    classDef externalLayer fill:#fce4ec,stroke:#c2185b,stroke-width:2px

    class User,SignupPage,LoginPage,TripsPage,TripDetailPage,SignupForm,LoginForm,UserMenu,TripsList,useAuth clientLayer
    class Middleware,TripsIndexAstro,TripsNewAstro,TripDetailAstro,TripEditAstro,SignupAstro,LoginAstro astroLayer
    class TripsAPI,TripByIdAPI,GenerateAIAPI,AuthHelper,TripService,Validation apiLayer
    class SupabaseAuth,SupabaseDB,UsersTable,TripsTable,RLSPolicies supabaseLayer
    class OpenRouter externalLayer
```

---

## 2. Szczegółowy Przepływ Rejestracji (US-001)

```mermaid
sequenceDiagram
    autonumber
    actor User as 👤 User
    participant Page as /auth/signup<br/>(Astro SSR)
    participant Form as SignupForm<br/>(React)
    participant Supabase as Supabase Auth
    participant DB as PostgreSQL
    participant Trips as /trips Page

    User->>Page: Navigate to /auth/signup
    Page->>Page: Check session (server-side)
    alt Already logged in
        Page-->>User: Redirect to /trips
    else Not logged in
        Page->>Form: Render SignupForm<br/>client:only="react"
        Form-->>User: Display form
    end

    User->>Form: Fill email, password, confirmPassword
    User->>Form: Click "Utwórz konto"

    Form->>Form: Validate email format
    Form->>Form: Validate password (min 8 chars)
    Form->>Form: Validate passwords match

    alt Validation fails
        Form-->>User: Display error message
    else Validation passes
        Form->>Form: setIsLoading(true)
        Form->>Supabase: signUp({ email, password })

        Supabase->>Supabase: Hash password (bcrypt)
        Supabase->>DB: INSERT INTO auth.users
        DB-->>Supabase: User created (id, email)

        alt Email confirmation disabled
            Supabase->>Supabase: Generate JWT access_token
            Supabase->>Supabase: Generate refresh_token
            Supabase-->>Form: { session, user }
            Form->>Form: Store tokens in localStorage
            Form->>Form: setSuccessMessage()
            Form-->>User: "Konto utworzone!"
            Form->>Trips: window.location.href = '/trips'
        else Email confirmation required
            Supabase-->>Form: { user, session: null }
            Form-->>User: "Sprawdź email aby potwierdzić"
        end
    end
```

---

## 3. Szczegółowy Przepływ Logowania (US-002)

```mermaid
sequenceDiagram
    autonumber
    actor User as 👤 User
    participant Page as /auth/login<br/>(Astro SSR)
    participant Form as LoginForm<br/>(React)
    participant Supabase as Supabase Auth
    participant DB as PostgreSQL
    participant Trips as /trips Page

    User->>Page: Navigate to /auth/login?redirect=/trips
    Page->>Page: Check session (server-side)
    alt Already logged in
        Page-->>User: Redirect to /trips
    else Not logged in
        Page->>Form: Render LoginForm<br/>redirectTo="/trips"
        Form-->>User: Display form
    end

    User->>Form: Fill email, password
    User->>Form: Click "Zaloguj się"

    Form->>Form: Validate email format
    Form->>Form: setIsLoading(true)
    Form->>Supabase: signInWithPassword({ email, password })

    Supabase->>DB: SELECT FROM auth.users<br/>WHERE email = ?
    DB-->>Supabase: User record
    Supabase->>Supabase: Verify password hash (bcrypt)

    alt Credentials invalid
        Supabase-->>Form: Error: "Invalid login credentials"
        Form-->>User: "Nieprawidłowy email lub hasło"
        Form->>Form: setIsLoading(false)
    else Email not confirmed
        Supabase-->>Form: Error: "Email not confirmed"
        Form-->>User: "Potwierdź email przed logowaniem"
    else Credentials valid
        Supabase->>Supabase: Generate JWT access_token
        Supabase->>Supabase: Generate refresh_token
        Supabase-->>Form: { session, user }

        Form->>Form: Store tokens in localStorage
        Note over Form: Supabase SDK handles this automatically

        Form->>Trips: window.location.href = redirectTo
        Trips-->>User: Display trips list
    end
```

---

## 4. Przepływ Middleware i Ochrony Routes (US-011)

```mermaid
sequenceDiagram
    autonumber
    actor User as 👤 User
    participant Browser as Browser
    participant Middleware as Astro Middleware
    participant Supabase as Supabase Auth
    participant Page as Protected Page<br/>(/trips)
    participant Login as /auth/login

    User->>Browser: Navigate to /trips
    Browser->>Middleware: HTTP Request

    Middleware->>Middleware: Extract pathname: "/trips"
    Middleware->>Middleware: Check if protected route

    alt Not protected route (/, /auth/*)
        Middleware->>Page: Continue to page
    else Protected route (/trips, /trips/*)
        Middleware->>Supabase: auth.getSession()

        alt Session exists
            Supabase-->>Middleware: { session, user }
            Middleware->>Middleware: context.locals.user = user
            Middleware->>Middleware: context.locals.session = session
            Middleware->>Page: Continue to page
            Page-->>User: Render protected content
        else No session
            Supabase-->>Middleware: { session: null }
            Middleware->>Middleware: Build redirect URL<br/>?redirect=/trips
            Middleware->>Login: Redirect to /auth/login?redirect=/trips
            Login-->>User: Display login form
            Note over User,Login: After successful login,<br/>user is redirected back to /trips
        end
    end
```

---

## 5. Przepływ Wywołania API z Autentykacją (CRUD Operations)

```mermaid
sequenceDiagram
    autonumber
    actor User as 👤 User
    participant Component as TripsList<br/>(React)
    participant Hook as useAuth Hook
    participant Supabase as supabaseClient
    participant API as /api/trips
    participant Auth as authenticateRequest()
    participant Service as TripService
    participant DB as PostgreSQL + RLS

    User->>Component: View trips list
    Component->>Hook: useAuth()
    Hook->>Supabase: auth.getSession()
    Supabase-->>Hook: { session, user }
    Hook-->>Component: { isAuthenticated: true, user }

    Component->>Component: Prepare API request
    Component->>Supabase: auth.getSession()
    Supabase-->>Component: { session }
    Component->>Component: Extract access_token

    Component->>API: GET /api/trips<br/>Authorization: Bearer {token}

    API->>Auth: authenticateRequest(request)
    Auth->>Auth: Extract token from header
    Auth->>Supabase: createClientWithAuth(token)
    Auth->>Supabase: auth.getUser()

    alt Token invalid or expired
        Supabase-->>Auth: Error: Invalid token
        Auth-->>API: { error: "INVALID_TOKEN" }
        API-->>Component: 401 Unauthorized
        Component->>Component: Clear session
        Component->>User: Redirect to /auth/login
    else Token valid
        Supabase-->>Auth: { user }
        Auth-->>API: { supabase, userId }

        API->>API: Validate query params
        API->>Service: new TripService(supabase)
        API->>Service: listTrips(userId, params)

        Service->>DB: SELECT FROM trips<br/>WHERE user_id = ?<br/>ORDER BY created_at DESC

        Note over DB: RLS Policy Applied:<br/>auth.uid() = user_id

        DB-->>Service: [ trip1, trip2, trip3 ]
        Service->>Service: Transform to DTOs
        Service-->>API: { success: true, data: {...} }

        API-->>Component: 200 OK + JSON
        Component->>Component: Update state
        Component-->>User: Display trips list
    end
```

---

## 6. Przepływ Row Level Security (RLS) - US-012

```mermaid
flowchart TB
    Start([User makes API request])

    Start --> Auth[API authenticates JWT token]
    Auth --> Extract[Extract user_id from token]
    Extract --> Query[Execute SQL query]

    Query --> RLS{RLS Policy Check}

    RLS --> Policy1["Policy: SELECT<br/>WHERE auth.uid() = user_id"]
    RLS --> Policy2["Policy: INSERT<br/>CHECK auth.uid() = user_id"]
    RLS --> Policy3["Policy: UPDATE<br/>WHERE auth.uid() = user_id"]
    RLS --> Policy4["Policy: DELETE<br/>WHERE auth.uid() = user_id"]

    Policy1 --> Filter1[Filter rows:<br/>Only return trips<br/>where user_id matches]
    Policy2 --> Check1[Verify:<br/>New trip has<br/>correct user_id]
    Policy3 --> Filter2[Filter rows:<br/>Only update user's<br/>own trips]
    Policy4 --> Filter3[Filter rows:<br/>Only delete user's<br/>own trips]

    Filter1 --> Result[Return filtered results]
    Check1 --> Result
    Filter2 --> Result
    Filter3 --> Result

    Result --> Success{Operation<br/>successful?}

    Success -->|Yes| Return200[Return data to API]
    Success -->|No access| Return403[Return empty result<br/>or 403 error]

    Return200 --> End([Response to client])
    Return403 --> End

    style RLS fill:#4caf50,stroke:#2e7d32,stroke-width:3px,color:#fff
    style Policy1 fill:#81c784,stroke:#388e3c,stroke-width:2px
    style Policy2 fill:#81c784,stroke:#388e3c,stroke-width:2px
    style Policy3 fill:#81c784,stroke:#388e3c,stroke-width:2px
    style Policy4 fill:#81c784,stroke:#388e3c,stroke-width:2px
```

---

## 7. Przepływ Wylogowania (US-003)

```mermaid
sequenceDiagram
    autonumber
    actor User as 👤 User
    participant Page as Any Page<br/>(/trips)
    participant Nav as Navigation<br/>(Astro)
    participant Menu as UserMenu<br/>(React)
    participant Supabase as supabaseClient
    participant Storage as localStorage
    participant Login as /auth/login

    User->>Page: View any page (logged in)
    Page->>Nav: Render Navigation
    Nav->>Nav: Check session (SSR)<br/>user exists?
    Nav->>Menu: Render UserMenu<br/>with user data
    Menu-->>User: Display user menu dropdown

    User->>Menu: Click "Wyloguj się"
    Menu->>Menu: setIsLoggingOut(true)
    Menu->>Supabase: auth.signOut()

    Supabase->>Storage: Remove auth tokens<br/>from localStorage
    Storage-->>Supabase: Tokens cleared

    Supabase->>Supabase: Trigger onAuthStateChange<br/>event: SIGNED_OUT

    Supabase-->>Menu: Success
    Menu->>Login: window.location.href = '/auth/login'

    Note over Login,User: useAuth hook in other components<br/>will detect SIGNED_OUT event<br/>and update state

    Login-->>User: Display login form
```

---

## 8. Architektura Komponentów

```mermaid
graph TB
    subgraph "Pages Layer (Astro SSR)"
        A1["/auth/signup.astro"]
        A2["/auth/login.astro"]
        A3["/trips/index.astro"]
        A4["/trips/new.astro"]
        A5["/trips/[id].astro"]
        A6["/trips/[id]/edit.astro"]
    end

    subgraph "React Components Layer"
        R1["SignupForm.tsx"]
        R2["LoginForm.tsx"]
        R3["UserMenu.tsx"]
        R4["TripsList.tsx"]
        R5["TripForm.tsx"]
        R6["TripDetail.tsx"]
        R7["TripEditForm.tsx"]
    end

    subgraph "Hooks Layer"
        H1["useAuth.ts<br/>Auth state management"]
        H2["useTrips.ts<br/>Trips data fetching"]
        H3["useCreateTrip.ts<br/>Trip creation logic"]
    end

    subgraph "Services Layer"
        S1["supabase.client.ts<br/>Supabase instance"]
        S2["TripService.ts<br/>Business logic"]
        S3["validation.ts<br/>Input validation"]
    end

    subgraph "API Layer"
        API1["/api/trips<br/>GET, POST"]
        API2["/api/trips/[id]<br/>GET, PATCH, DELETE"]
        API3["/api/trips/[id]/generate-ai<br/>POST"]
    end

    %% Pages embed components
    A1 -->|Embeds| R1
    A2 -->|Embeds| R2
    A3 -->|Embeds| R4
    A3 -->|Embeds| R3
    A4 -->|Embeds| R5
    A5 -->|Embeds| R6
    A5 -->|Embeds| R3
    A6 -->|Embeds| R7

    %% Components use hooks
    R1 -->|Uses| H1
    R2 -->|Uses| H1
    R3 -->|Uses| H1
    R4 -->|Uses| H1
    R4 -->|Uses| H2
    R5 -->|Uses| H1
    R5 -->|Uses| H3
    R6 -->|Uses| H1
    R7 -->|Uses| H1

    %% Hooks use services
    H1 -->|Uses| S1
    H2 -->|Uses| S1
    H2 -->|Calls| API1
    H3 -->|Uses| S1
    H3 -->|Calls| API1

    %% API uses services
    API1 -->|Uses| S1
    API1 -->|Uses| S2
    API1 -->|Uses| S3
    API2 -->|Uses| S1
    API2 -->|Uses| S2
    API2 -->|Uses| S3
    API3 -->|Uses| S1
    API3 -->|Uses| S2

    %% Styling
    classDef pagesClass fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    classDef reactClass fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    classDef hooksClass fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef servicesClass fill:#e8f5e9,stroke:#388e3c,stroke-width:2px
    classDef apiClass fill:#fce4ec,stroke:#c2185b,stroke-width:2px

    class A1,A2,A3,A4,A5,A6 pagesClass
    class R1,R2,R3,R4,R5,R6,R7 reactClass
    class H1,H2,H3 hooksClass
    class S1,S2,S3 servicesClass
    class API1,API2,API3 apiClass
```

---

## 9. Stan Sesji i Przepływ Tokenów

```mermaid
stateDiagram-v2
    [*] --> NotAuthenticated: Initial State

    NotAuthenticated --> Authenticating: User submits login/signup

    Authenticating --> Authenticated: Supabase returns JWT
    Authenticating --> NotAuthenticated: Invalid credentials

    Authenticated --> TokenRefreshing: Token expires (1 hour)
    TokenRefreshing --> Authenticated: Refresh successful
    TokenRefreshing --> NotAuthenticated: Refresh failed

    Authenticated --> LoggingOut: User clicks logout
    LoggingOut --> NotAuthenticated: Tokens cleared

    NotAuthenticated --> [*]

    note right of Authenticated
        - access_token stored in localStorage
        - refresh_token stored in localStorage
        - useAuth hook: isAuthenticated = true
        - Protected routes accessible
    end note

    note right of NotAuthenticated
        - No tokens in localStorage
        - useAuth hook: isAuthenticated = false
        - Protected routes redirect to /auth/login
    end note

    note right of TokenRefreshing
        - Supabase SDK automatically refreshes
        - Uses refresh_token to get new access_token
        - Transparent to user
    end note
```

---

## 10. Przepływ Danych - Create Trip z AI

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Form as TripForm<br/>(React)
    participant Hook as useCreateTrip
    participant API1 as POST /api/trips
    participant Service as TripService
    participant DB as PostgreSQL
    participant API2 as POST /api/trips/:id/generate-ai
    participant OpenRouter as OpenRouter API

    User->>Form: Fill destination, dates, description
    User->>Form: Click "Generate with AI"

    Form->>Hook: createTrip(data, true)
    Hook->>Hook: Get access_token from session

    Hook->>API1: POST /api/trips<br/>{ ...data, generate_ai: true }
    API1->>API1: Authenticate request
    API1->>Service: createTrip(userId, command)
    Service->>Service: Set status = "generating"
    Service->>DB: INSERT trip (status=generating)
    DB-->>Service: New trip created
    Service-->>API1: { id, status: "generating" }
    API1-->>Hook: 201 Created + trip data

    Hook->>API2: POST /api/trips/:id/generate-ai
    API2->>API2: Authenticate request
    API2->>OpenRouter: Generate itinerary prompt

    Note over OpenRouter: AI generates day-by-day<br/>travel itinerary<br/>(30-60 seconds)

    OpenRouter-->>API2: AI-generated content
    API2->>DB: UPDATE trip<br/>SET ai_generated_content = ...<br/>status = "completed"
    DB-->>API2: Updated
    API2-->>Hook: 200 OK + AI content

    Hook->>Hook: Update local state
    Hook-->>Form: Success
    Form->>Form: Redirect to /trips/:id
    Form-->>User: Display trip with AI content
```

---

## 11. Kluczowe Pliki i Ich Relacje

```mermaid
graph LR
    subgraph "Authentication Core"
        MW["middleware/index.ts<br/>🔒 Route Protection"]
        SC["db/supabase.client.ts<br/>🔌 Supabase Client"]
        UA["hooks/useAuth.ts<br/>📱 Auth State Hook"]
    end

    subgraph "Auth Forms"
        SF["components/forms/SignupForm.tsx"]
        LF["components/forms/LoginForm.tsx"]
        UM["components/navigation/UserMenu.tsx"]
    end

    subgraph "Auth Pages"
        SP["pages/auth/signup.astro"]
        LP["pages/auth/login.astro"]
    end

    subgraph "Protected Pages"
        TI["pages/trips/index.astro"]
        TN["pages/trips/new.astro"]
        TD["pages/trips/[id].astro"]
        TE["pages/trips/[id]/edit.astro"]
    end

    subgraph "API Endpoints"
        AT["pages/api/trips.ts<br/>authenticateRequest()"]
        ATI["pages/api/trips/[id].ts<br/>authenticateRequest()"]
        AG["pages/api/trips/[id]/generate-ai.ts"]
    end

    subgraph "Business Logic"
        TS["services/trip.service.ts<br/>TripService"]
        VAL["lib/validation.ts"]
        AH["lib/api-helpers.ts"]
    end

    %% Relationships
    SP -->|renders| SF
    LP -->|renders| LF
    SF -->|uses| SC
    LF -->|uses| SC
    UM -->|uses| UA
    UA -->|uses| SC

    MW -->|uses| SC
    MW -->|protects| TI
    MW -->|protects| TN
    MW -->|protects| TD
    MW -->|protects| TE

    AT -->|uses| SC
    AT -->|uses| TS
    AT -->|uses| VAL
    ATI -->|uses| SC
    ATI -->|uses| TS
    AG -->|uses| SC
    AG -->|uses| TS

    TS -->|uses| SC

    %% Styling
    classDef authCore fill:#4caf50,stroke:#2e7d32,stroke-width:2px,color:#fff
    classDef forms fill:#2196f3,stroke:#1565c0,stroke-width:2px,color:#fff
    classDef pages fill:#ff9800,stroke:#e65100,stroke-width:2px
    classDef api fill:#9c27b0,stroke:#4a148c,stroke-width:2px,color:#fff
    classDef services fill:#00bcd4,stroke:#006064,stroke-width:2px

    class MW,SC,UA authCore
    class SF,LF,UM forms
    class SP,LP,TI,TN,TD,TE pages
    class AT,ATI,AG api
    class TS,VAL,AH services
```

---

## 12. Podsumowanie Architektury

### 🔑 Kluczowe Komponenty:

1. **Middleware** (`src/middleware/index.ts`)
   - Sprawdza sesję przy każdym request
   - Chroni routes: `/trips`, `/trips/*`
   - Przekierowuje do `/auth/login?redirect=...`

2. **Supabase Client** (`src/db/supabase.client.ts`)
   - Singleton klienta Supabase
   - `createSupabaseClientWithAuth(token)` dla API calls
   - Auto-refresh tokenów

3. **useAuth Hook** (`src/hooks/useAuth.ts`)
   - Zarządzanie stanem autentykacji client-side
   - Nasłuchiwanie `onAuthStateChange`
   - Metoda `signOut()`

4. **Formularze Auth** (React Components)
   - `SignupForm.tsx` - rejestracja
   - `LoginForm.tsx` - logowanie
   - `UserMenu.tsx` - dropdown z wylogowaniem

5. **API Authentication Helper**
   - `authenticateRequest()` w każdym endpoincie
   - Walidacja JWT tokenu
   - Przekazanie `userId` do service layer

6. **Row Level Security** (PostgreSQL)
   - Polityki na tabeli `trips`
   - Automatyczne filtrowanie po `user_id`
   - Ochrona na poziomie bazy danych

### 🔐 Przepływ Autoryzacji:

```
User → Component → API (Bearer Token) → authenticateRequest()
→ Supabase.auth.getUser() → TripService → PostgreSQL + RLS
→ Filter by user_id → Return data → User
```

### ✅ Realizacja User Stories:

- **US-001** (Rejestracja): `SignupForm.tsx` → `Supabase Auth` → Auto-login
- **US-002** (Logowanie): `LoginForm.tsx` → `Supabase Auth` → Redirect
- **US-003** (Wylogowanie): `UserMenu.tsx` → `signOut()` → Clear session
- **US-011** (Protected routes): `Middleware` → Check session → Redirect
- **US-012** (Data protection): RLS policies → Filter by `auth.uid()`

---

**Koniec diagramów architektury autentykacji**