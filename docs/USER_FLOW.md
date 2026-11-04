# VoxDesk AI — User Flow & Interaction Lifecycles

> **Interactive Journeys & System State Machines**  
> **Author:** Naman Kumar  
> **Repository:** [https://github.com/naman-kumar1212/VoxDesk-AI](https://github.com/naman-kumar1212/VoxDesk-AI)  
> **Live App:** [https://voxdesk-web-lac.vercel.app](https://voxdesk-web-lac.vercel.app)

---

## 1. Customer Interaction Flows

### Flow 1: Primary Voice Grievance Submission Flow

```mermaid
flowchart TD
    Start(["Customer Lands on Home Page (/)"]) --> ClickFile["Clicks 'File a Grievance Now'"]
    ClickFile --> ScreenReport["Navigates to /report"]

    ScreenReport --> CheckMic{"Microphone Permission Granted?"}
    CheckMic -->|No / Blocked| TextMode["Switch to Text Input Mode"]
    CheckMic -->|Yes| MicIdle["Microphone Ready (Max 45s, 4 MB)"]

    MicIdle --> ClickRecord["Customer clicks Microphone Icon"]
    ClickRecord --> Recording["Recording Active (Pulsing Waveform + Countdown)"]

    Recording --> RecControl{"Customer Action"}
    RecControl -->|Clicks 'Cancel'| MicIdle
    RecControl -->|Reaches 45s or Clicks 'Done & Submit'| UploadAudio["POST /api/voice/transcribe"]

    UploadAudio --> GroqWhisper["Groq Whisper Turbo Processing"]
    GroqWhisper --> ScreenReview["Navigates to /review (Editable Transcript)"]

    TextMode --> EnterText["Types complaint text or selects demo sample"]
    EnterText --> ScreenReview

    ScreenReview --> EditTranscript["Customer inspects / edits transcript"]
    EditTranscript --> ReviewPreview["Live Heuristic Preview displays detected Category & Dept"]
    ReviewPreview --> ClickSubmit["Customer clicks 'Submit Complaint'"]

    ClickSubmit --> SubmitAPI["POST /api/tickets/from-transcript (with Idempotency-Key)"]
    SubmitAPI --> GeminiAI["Gemini 3.8 Flash Classification"]
    GeminiAI --> BusinessRules["Python Business Rules & Escalation Check"]
    BusinessRules --> DBCommit["Supabase PostgreSQL Atomic Transaction"]

    DBCommit --> ScreenConfirm["Navigates to /confirmation"]
    ScreenConfirm --> SpokenReply["Browser Web Speech API speaks voice confirmation"]
    ScreenConfirm --> ViewTicket["Displays Ticket ID (VD-XXXX), Priority & Dept"]
    ViewTicket --> CopyTrack["Customer copies ID or clicks 'Track Ticket'"]
```

---

### Flow 2: Customer Public Grievance Tracking Flow

```mermaid
flowchart TD
    TrackStart(["Customer navigates to /track"]) --> EnterID["Inputs Ticket Reference Number (e.g. VD-10500)"]
    EnterID --> SubmitTrack["Clicks 'Track' button"]
    SubmitTrack --> FetchTrack["GET /api/tickets/track/:ticket_number"]

    FetchTrack --> CheckTicket{"Ticket Exists?"}
    CheckTicket -->|No / 404| ErrorNotice["Displays friendly error alert with retry option"]
    ErrorNotice --> EnterID

    CheckTicket -->|Yes / 200| DisplayTicket["Renders Ticket Tracking Details"]
    DisplayTicket --> Badges["Status Badge (Open, In Progress, Resolved, Escalated)"]
    DisplayTicket --> Details["Assigned Department & Severity Priority"]
    DisplayTicket --> Timeline["Chronological ActivityTimeline with timestamps"]
```

---

## 2. Administrator & Operator Flows

### Flow 3: Administrator Daily Triage & Console Navigation

```mermaid
flowchart TD
    AdminStart(["Administrator visits /admin"]) --> CheckAuth{"Is Authenticated?"}
    CheckAuth -->|No| LoginScreen["Render Supabase Auth Login Screen"]
    LoginScreen --> InputCreds["Enter admin@voxdesk.ai & Password"]
    InputCreds --> SubmitLogin["POST /api/auth/login"]
    SubmitLogin --> VerifyCreds{"Valid Credentials?"}
    VerifyCreds -->|No| ShowAuthError["Display invalid credentials alert"]
    ShowAuthError --> LoginScreen
    VerifyCreds -->|Yes| StoreToken["Store bearer token in localStorage"]
    StoreToken --> DashboardView

    CheckAuth -->|Yes| DashboardView["Operational Overview Dashboard (/admin/dashboard)"]

    DashboardView --> NavChoice{"Sidebar Navigation"}
    NavChoice -->|Overview| DashboardView
    NavChoice -->|Tickets| TicketsView["Tickets Management (/admin/tickets)"]
    NavChoice -->|Analytics| AnalyticsView["Analytics & Performance (/admin/analytics)"]
    NavChoice -->|Departments| DeptsView["Department Directory (/admin/departments)"]
    NavChoice -->|Users| UsersView["Users Directory (/admin/users)"]
    NavChoice -->|Logout| Logout["POST /api/auth/logout & clear cache"]
    Logout --> LoginScreen
```

---

### Flow 4: Ticket Investigation & Lifecycle State Machine

```mermaid
stateDiagram-v2
    [*] --> open: Customer Submits Grievance
    open --> in_progress: Operator accepts / starts investigation
    open --> escalated: Fraud detected OR repeat contact heuristic
    open --> resolved: Direct quick resolution

    in_progress --> resolved: Problem fixed / customer updated
    in_progress --> escalated: Issue requires supervisor escalation
    in_progress --> open: Reverted to queue

    escalated --> in_progress: Senior lead takes ownership
    escalated --> resolved: Senior lead resolves complaint

    resolved --> in_progress: Customer re-opens / followup needed
    resolved --> [*]: Case archived
```

---

### Flow 5: Analytics & Operational Intelligence Flow

```mermaid
flowchart TD
    AnalyticsStart(["Operator opens /admin/analytics"]) --> CheckCache{"Chart Cache in Memory?"}

    CheckCache -->|Cache Hit| Sub5ms["Return chart buffers in < 5ms"]
    CheckCache -->|Cache Miss / TTL expired| RunAggregation["Execute Consolidated SQL Query"]

    RunAggregation --> PandasEngine["Pandas DataFrame Aggregation"]
    PandasEngine --> MatplotlibSeaborn["Matplotlib & Seaborn in-memory figure render"]
    MatplotlibSeaborn --> SaveCache["Cache in _CHART_CACHE with 60s TTL"]
    SaveCache --> Sub5ms

    Sub5ms --> RenderCharts["Display 4 High-Resolution Visualizations:
    1. Volume Over Time
    2. Status Distribution
    3. Department Workload
    4. Resolution Time Spread"]

    RenderCharts --> DateToggle{"Operator selects Date Range"}
    DateToggle -->|7 Days| InvalidateReq["Re-fetch with range=7d"]
    DateToggle -->|30 Days| InvalidateReq
    DateToggle -->|90 Days| InvalidateReq
    DateToggle -->|All Time| InvalidateReq
    DateToggle -->|Custom Range| CustomForm["Apply start & end date filter"]
    CustomForm --> InvalidateReq
    InvalidateReq --> CheckCache
```

