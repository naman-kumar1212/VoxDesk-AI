# 10. UI and UX Specification

## 1. Design direction

Build a professional support SaaS interface. It should look like a usable business application, not a generic AI chat page.

Suggested visual direction:

- Light neutral page background.
- Dark navy sidebar or header.
- One restrained accent color for primary actions.
- Clear typography and spacing.
- High-contrast ticket status and priority chips.
- Responsive layouts for laptop and mobile.

Avoid excessive gradients, animated backgrounds and oversized decorative elements.

## 2. Routes

- `/` - customer voice support page.
- `/admin` - admin login/access gate and ticket dashboard.
- `/admin/tickets/:id` - ticket details panel or route.

## 3. Customer page

Required components:

1. Brand/header: VoxDesk AI.
2. Short explanation: "Describe your issue. We'll register a support ticket."
3. Large microphone record/stop button.
4. Recording duration indicator.
5. Recording waveform or simple audio-level indicator (optional).
6. Processing status.
7. Editable transcript area.
8. Confirm and create ticket button.
9. Ticket confirmation card.
10. Audio playback button or spoken confirmation state.
11. Text-entry fallback for unsupported or denied microphone permission.

Required behavior:

- Prevent multiple simultaneous recordings.
- Disable submit while requests are in progress.
- Show helpful errors for mic permission, network, transcription and ticket creation.
- Do not claim success before API confirms a database write.
- Preserve ticket confirmation in the visible UI after the response.

## 4. Admin dashboard

Required components:

- Admin key entry.
- Sidebar or top navigation.
- Metric cards: total, open, high priority, escalated.
- Ticket table.
- Filter controls for category, priority and status.
- Refresh action.
- Ticket detail panel/drawer or detail page.
- Activity timeline.

Ticket detail fields:

- Ticket reference.
- Category.
- Priority.
- Department.
- Status.
- Escalation flag/reason.
- Customer transcript.
- AI summary and description.
- Created and updated times.
- Event history.

## 5. Status colors

Use consistent semantic visual treatment:

- Open: neutral/blue.
- In Progress: amber.
- Escalated: red or orange.
- Resolved: green.

Priority:

- Low: neutral.
- Medium: amber.
- High: red.

Do not rely on color alone; include readable text labels.

## 6. Loading and empty states

- Empty ticket list: "No tickets yet. Submit a voice complaint to create the first ticket."
- Loading: skeleton rows or a simple spinner.
- Error: message plus retry action.
- No filter matches: explain that no tickets match the filters.
- TTS unavailable: show a text-only reply and a play-with-browser-voice fallback.

## 7. Component suggestions

- `VoiceRecorder`
- `TranscriptReview`
- `TicketConfirmation`
- `AudioReplyPlayer`
- `AdminAccessGate`
- `DashboardMetrics`
- `TicketFilters`
- `TicketTable`
- `TicketDetail`
- `TicketEventTimeline`

Keep state local to the feature where practical. No global state library is required for the MVP.
