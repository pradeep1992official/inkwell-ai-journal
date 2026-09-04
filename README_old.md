# Inkwell — Mindful Reflection Journal & Cognitive Space

Inkwell is a calm, paper-inspired AI reflection journal and mindful writing sanctuary built with **React 18**, **TypeScript**, **Tailwind CSS**, **Express**, **Firebase Authentication**, **Cloud Firestore**, and **Google Gemini AI**.

Inkwell pairs the warmth and tactile intimacy of personal journaling with empathetic, multi-turn AI perspective, comprehensive emotional tracking, semantic memory search, and privacy-first cloud synchronization.

---

## Complete Feature Matrix & Capabilities

### 1. User Identity & Privacy-Preserving Authentication
- **Federated Google Sign-In**: Streamlined, passwordless authentication via Firebase Auth with zero custom credential storage.
- **Guest / Demo Mode**: Full exploration mode with local memory and session persistence.
- **Sample Reflection Auto-Seeding**: Automatic provisioning of an interactive introductory journal entry for new users or upon vault reset to immediately demonstrate features.

### 2. Multi-Turn Conversational Reflection with Gemini AI
- **4 Guided Reflection Modes**:
  - 🌿 **Reflect (Mindful Listening)**: Empathetic, non-judgmental inquiry exploring core values, emotional clarity, and gentle cognitive reframing.
  - 💡 **Brainstorm (Lateral Thinking)**: Creative, constructive counter-intuitive perspectives and alternative interpretations.
  - 🎯 **Action Items (Cognitive Strategy)**: Extracts 3 high-impact, prioritized steps categorized by immediate grounding, clear boundaries, and energy preservation.
  - 📋 **Summarize (Executive Insights)**: Real-time synthesis of conversation key realizations and emotional takeaways.
- **Resilient 4-Tier Model Fallback Ladder**:
  1. Primary: `gemini-3.6-flash`
  2. High-Availability Fallback: `gemini-3.1-flash-lite`
  3. Dynamic Alias: `gemini-flash-latest`
  4. Deep Reasoning Fallback: `gemini-3.7-flash`
- **Mindful Offline Fallback Engine**: If upstream quota limits (429) or offline states occur, a deterministic heuristic engine provides empathetic reflection prompts accompanied by a transparent markdown notice banner.

### 3. Intelligent Automatic Title Generation
- **Topic Synthesis**: Generates a concise (4–8 word) descriptive headline capturing the core theme, emotional focus, or dilemma upon first submission.
- **Strict Multilingual Consistency**: Generates titles in the exact language and script of the user's reflection (English, Tamil, Hindi, Spanish, French).
- **Manual Title Lock**: Tracks `hasCustomTitle` metadata so user-edited titles are permanently preserved against automated overwriting.
- **Clean Word-Boundary Fallback**: Strips markdown symbols (`#`, `*`, `>`) and cleanly truncates with ellipses if AI is unreachable.

### 4. Visual Themes & Adaptive Typography
- **5 Accessible Theme Palettes**:
  - **Light**: Crisp, clean daylight canvas with calm blue accents (`#1A73E8`).
  - **Dark**: Deep ink-toned charcoal (`#1A1614`) with warm amber highlights (`#E8A33D`).
  - **Paper**: Cream parchment (`#FAF6EF`) with terracotta tones (`#B8722E`) and classic notebook warmth.
  - **Vellum**: Aged sepia (`#EFE6D8`) with warm burnt-orange accents (`#A8623B`) for a vintage tactile feel.
  - **Vivid**: High-energy canvas (`#F5F3FF`) with electric violet (`#7C5CFF`) and coral accents.
- **Proportional Typography Scaling**: 3 font scale tiers (Small, Medium, Large) paired with **Outfit** for display headings and **Plus Jakarta Sans** for body reading.
- **Cross-Device Settings Synchronization**: Preferences saved to `/users/{userId}/settings/preferences`.

### 5. 5-Language Full UI Internationalization (i18n)
- Comprehensive interface localization across:
  - 🇬🇧 **English (`en`)**
  - 🇪🇸 **Spanish (`es`)**
  - 🇫🇷 **French (`fr`)**
  - 🇮🇳 **Hindi (`hi`)**
  - 🇮🇳 **Tamil (`ta`)**
- Localizes navigation chrome, buttons, timestamps, weather conditions, prompts, dialogs, and error diagnostics.

### 6. Mood Tracking & Visual Analytics (Recharts)
- **10 Nuanced Emotional States**: Reflective, Calm, Optimistic, Challenged, Inspired, Grateful, Anxious, Peaceful, Nostalgic, Focused.
- **Time-Range Filtering**: Last 2 Weeks, Last Month, Last 3 Months, All Time.
- **Interactive Visualizations**:
  - **Mood Trajectory**: Smooth line charts showing emotional progression over time.
  - **Mood Frequency & Distribution**: Donut and bar charts tracking habit consistency.
  - **Atmospheric Weather Correlation**: Analyzes emotional state against weather patterns and word counts.
- **Export Mood Trends as PDF or PNG**: Instant visual snapshot download of charts and summary metrics.

### 7. Multi-Format Journal Export & Sharing
- **Single & Batch Exporting**:
  - 📄 **PDF**: Formatted document with typography, mood chips, timestamps, and AI dialogue.
  - 📝 **Markdown (`.md`)**: Clean text document ready for Obsidian, Notion, or GitHub.
  - 📋 **Plain Text (`.txt`)**: Raw conversational transcript.
  - 📊 **JSON (`.json`)**: Full structured metadata payload for backup and migration.
- **Native Web Share**: Share reflection summaries via mobile or desktop system share sheets.

### 8. Google Calendar Day Review Integration
- **OAuth 2.0 Integration**: Granular Google Calendar read access (`calendar.readonly`, `calendar.events.readonly`).
- **Mindful Schedule Synthesis**: Fetches daily calendar meetings and tasks; Gemini generates a reflective day timeline, energy-drain analysis, and key accomplishment highlights.
- **One-Click Vault Save**: Insert calendar analysis directly into the active draft or save as a dedicated journal entry.

### 9. "Ask My Life" Semantic Vector Memory Search
- **Natural Language Memory Queries**: Ask open-ended questions across your entire journal archive (e.g. *"When did I feel most energized?"*, *"What lessons have I learned about work-life balance?"*).
- **High-Dimensional Embeddings (`text-embedding-004`)**: Generates 768-dimensional vector representations stored alongside entry metadata.
- **Grounded AI Synthesis & Direct Citations**: Gemini synthesizes an empathetic answer quoting verified reflection dates, titles, and exact quotes with one-click jump links.
- **Batch Memory Indexer**: One-click background tool to embed un-indexed past reflections with live progress tracking.

### 10. Privacy-Preserving Location Tagging & "My Memories"
- **Place Tagging**: Attach city or venue names via Google Places Autocomplete API.
- **"My Memories" City Hub**: Browse reflections grouped by city/locality without exposing raw GPS coordinates.
- **Vault Search by Location**: Filter entries instantly by typing city or landmark names in search.

### 11. Ambient Atmospheric Weather (Open-Meteo)
- **Real-Time Weather Stamp**: Automatically captures weather condition, temperature (°C/°F), and humidity for each reflection.
- **Historical Weather Backfilling**: Backfill historical weather for older tagged entries using the Open-Meteo Archive API.
- **Privacy Controls**: Opt-in toggle in Settings allows disabling weather tracking at any time.

### 12. Voice Dictation & Text-to-Speech Audio
- **Speech-to-Text Reflection**: Dictate entries using the browser's native Web Speech API.
- **Read Aloud Audio**: Built-in speech synthesis engine with multi-voice selection and speed controls.

### 13. Resilient Offline Storage & Vault Management
- **Zero-Loss Auto-Drafting**: Automatically preserves in-progress writing in local storage buffers (`inkwell_draft_*`).
- **Zero-Crash Payload Hygiene**: Recursive `undefined`-stripping ensures clean Firestore writes.
- **Trash & Recovery Vault**: Soft-deletion (`deletedAt`), recoverable trash bin, and permanent purge protection.

---

## Technical Architecture

```
                                  +---------------------------------------+
                                  |         Google Cloud Run              |
                                  |    (Node.js / Express Backend)        |
                                  +-------------------+-------------------+
                                                      |
                                    +-----------------+-----------------+
                                    |                                   |
                         +----------v----------+             +----------v----------+
                         |  Google Gemini API  |             | Cloud Secret Manager|
                         | (3.6/3.7 Flash,     |             | (GEMINI_API_KEY)    |
                         | text-embedding-004) |             +---------------------+
                         +---------------------+
                                    ^
                                    | (Proxied via /api/*)
                                    |
+-----------------------------------+-----------------------------------+
|                         Inkwell React Client                          |
|             (Vite + React 18 + Tailwind CSS + Lucide Icons)           |
+-----------------+-----------------+-----------------+-----------------+
                  |                 |                 |
        +---------v---------+  +----v-----+     +-----v-----+
        |  Firebase Auth    |  | Firestore|     |Open-Meteo |
        | (Google Sign-In)  |  | Database |     | Weather   |
        +-------------------+  +----------+     +-----------+
```

---

## 1. Prerequisites & Google Cloud APIs

Ensure the required Google Cloud APIs are enabled for your project:

```bash
gcloud services enable \
  run.googleapis.com \
  secretmanager.googleapis.com \
  firestore.googleapis.com \
  cloudbuild.googleapis.com
```

---

## 2. Secret Manager Configuration

Secure your Gemini API key in Google Cloud Secret Manager and grant access to your Cloud Run service account:

```bash
# 1. Create and populate the secret
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# 2. Grant your Cloud Run compute service account access
# Replace YOUR_PROJECT_NUMBER with your actual Google Cloud Project Number
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:YOUR_PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 3. Firestore Security Rules

Deploy the following owner-bound security rules in `firestore.rules` to enforce complete user isolation:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Owner-bound isolation for user profile document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // User reflections and journal entries
      match /entries/{entryId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }

      // User preferences and settings
      match /settings/{settingDoc} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      
      // Catch-all isolation for any user subcollections
      match /{allSubcollections=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

---

## 4. Firestore Vector Search Index (Ask My Life)

To enable native vector similarity search on Firestore across 768-dimensional embeddings generated by `text-embedding-004`:

```bash
# Create Firestore Vector Search Index on the 'entries' collection group
gcloud firestore indexes composite create \
  --collection-group=entries \
  --query-scope=COLLECTION \
  --field-config=vector-config='{"dimension":"768","flat": "{}"}',field-path=embedding
```

---

## 5. Cloud Run Deployment Flow

Deploy Inkwell directly to Google Cloud Run from source:

```bash
# Deploy to Cloud Run from source with Secret Manager binding
gcloud run deploy inkwell \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-secrets=GEMINI_API_KEY=GEMINI_API_KEY:latest \
  --port 3000
```

### Challenge Campaign Labeling

Apply the required campaign label for automated challenge verification:

```bash
gcloud run services update inkwell \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=us-central1
```

---

## 6. Comprehensive Functional Walkthrough & Test Suite

| Test ID | Interaction / User Flow | Expected System Outcome |
| :--- | :--- | :--- |
| **TC-01** | Open Settings Panel via Gear Icon in Navbar | Modal opens displaying Theme Canvas (5 choices), Font Size (3 choices), Interface Language (5 choices), and Sound / Weather toggles. |
| **TC-02** | Select "Paper", "Vellum", or "Vivid" Theme | Immediate visual palette and typography update; selection persists to Firestore `/users/{userId}/settings/preferences`. |
| **TC-03** | Select "Small", "Medium", or "Large" Font Size | Reading and reflection typography scales proportionally across the entire app interface. |
| **TC-04** | Change Language to Spanish, French, Hindi, or Tamil | All navigation, buttons, placeholders, dialogs, and labels translate immediately into the selected language. |
| **TC-05** | Quick Theme Toggle in Navbar (Sun/Moon) | Instantly alternates between Dark and Light while saving preference to cloud profile. |
| **TC-06** | Google Sign-In Authentication | Initiates Firebase Google popup, provisions user session, and fetches isolated reflections and saved preferences. |
| **TC-07** | Automatic Sample Reflection Seeding | New users or users resetting their vault receive an introductory sample entry showcasing mood, tags, and AI reflection features. |
| **TC-08** | Write & Send Reflection in Any Mode | Messages are securely saved in real time to `/users/{userId}/entries/{entryId}` and processed with Gemini 3.6 Flash fallback ladder. |
| **TC-09** | Automatic Title Generation on First Message | Gemini generates a concise 4-8 word topical headline in the reflection's language and updates the entry title automatically. |
| **TC-10** | Manual Title Override Protection | Manually clicking and editing the title locks `hasCustomTitle: true`, preventing automated AI title overwrite. |
| **TC-11** | Mode Switch (Reflect, Brainstorm, Actions, Summary) | Toggling reflection modes dynamically updates the AI system instructions and conversation framing. |
| **TC-12** | Executive Insights Extraction | Clicking "Insights" generates reflection synthesis, key realizations, and emotional tone with instant copyable summary. |
| **TC-13** | Audio Read-Aloud (Text-to-Speech) | Tapping the audio speaker icon reads the AI response or full reflection aloud with configurable speed and voice. |
| **TC-14** | Voice Dictation via Microphone | Tapping the microphone icon begins speech recognition and streams transcribed text into the reflection input. |
| **TC-15** | Tag Location via Google Places Modal | Tapping the "Location" button opens the place picker; selecting a venue attaches locality and address to entry metadata. |
| **TC-16** | Browse Reflections by City in "My Memories" | Opening "My Memories" displays grouped cards by city/locality with count pills, mood badges, and direct reflection links. |
| **TC-17** | Vault Search by Place / Locality | Typing a city name (e.g. "Paris", "Kyoto") into vault search immediately filters entries matching the tagged place. |
| **TC-18** | Ambient Weather Display & Opt-In | Opening a reflection with location access displays an ambient weather badge (emoji + temperature + humidity) in the toolbar. |
| **TC-19** | Historical Weather Backfill | Clicking "Add Weather" under Settings triggers batch backfilling via Open-Meteo Archive API for all past entries with tagged places. |
| **TC-20** | Mood Trends Visualizer & Analytics | Opening Mood Trends renders interactive line charts (trajectory) and distribution charts with customizable time windows. |
| **TC-21** | Export Mood Trends as PDF or PNG | Clicking "Export" in the Mood Trends header downloads a high-resolution PDF report or PNG image of the charts and summary metrics. |
| **TC-22** | Export Entry (PDF, Markdown, Text, JSON) | Clicking "Export" on any journal entry generates and downloads the formatted file in the selected format. |
| **TC-23** | Google Calendar Day Review Synthesis | Authorizing Google Calendar pulls the day's event timeline; Gemini generates an accomplishment and energy-drain analysis for one-click journal insertion. |
| **TC-24** | "Ask My Life" Semantic Search & Citations | Asking a conversational question (e.g., *"When did I feel most proud?"*) retrieves top semantically similar memories and provides a cited AI response. |
| **TC-25** | Trash & Recovery Vault | Soft-deleting an entry moves it to Trash; entries can be restored to active vault or permanently purged. |

---

## 7. License & Compliance

Inkwell is open-source under the Apache 2.0 License. Designed for deployment on Google Cloud Run with Cloud Firestore and Google AI Studio APIs.
