# WeChat - WhatsApp-like Chat Application

A production-quality WhatsApp clone built with Next.js 15, Firebase, and modern web technologies.

## Tech Stack

- **Next.js 16** (App Router) - React framework
- **TypeScript** - Type safety
- **Tailwind CSS v4** - Styling
- **shadcn/ui** - UI components
- **Firebase** (Auth, Firestore, Storage) - Backend-as-a-Service
- **Zustand** - State management
- **Framer Motion** - Animations
- **Emoji Mart** - Emoji picker

## Features

### Authentication
- Email/password sign up and login
- Google Sign-In
- Persistent login session
- Profile with avatar, name, bio

### Chat
- One-to-one real-time messaging
- Text, images, videos, documents, voice messages
- Online/offline status with last seen
- Typing indicators
- Message status (sending, sent, delivered, read)
- Emoji picker
- Unread message counter with badges
- Search chats and users

### UI
- WhatsApp Web-inspired design
- Dark/Light mode
- Responsive (mobile, tablet, desktop)
- Smooth animations and transitions
- Message bubbles (green for outgoing, white for incoming)
- Double tick read receipts
- Loading skeletons and optimistic UI

## Getting Started

### Prerequisites

- Node.js 18+
- Firebase project with Authentication, Firestore, and Storage enabled

### Setup

1. Clone the repository:
```bash
git clone <repo-url>
cd wechat
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the root:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

4. Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Firebase Setup

### Authentication
- Enable Email/Password and Google providers in Firebase Console
- Configure OAuth consent screen for Google Sign-In

### Firestore Database

Create the following collections with indexes:

#### `users` Collection
```
uid (string) - Document ID
name (string)
email (string)
avatar (string)
bio (string)
lastSeen (timestamp)
online (boolean)
createdAt (timestamp)
```

#### `chats` Collection
```
id (string) - Document ID
participants (array<string>)
lastMessage (map)
  text (string)
  senderId (string)
  createdAt (timestamp)
  type (string)
unreadCount (map<string, number>)
updatedAt (timestamp)
createdAt (timestamp)

Indexes:
- participants (Array), updatedAt (Descending)
```

#### `chats/{chatId}/messages` Subcollection
```
id (string) - Document ID
chatId (string)
senderId (string)
text (string)
type (string) - text|image|video|document|voice
mediaUrl (string)
mediaName (string)
mediaSize (number)
duration (number)
status (string) - sending|sent|delivered|read
createdAt (timestamp)

Indexes:
- createdAt (Ascending)
```

#### `chats/{chatId}/typing` Subcollection
```
userId (string) - Document ID
timestamp (timestamp)
```

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    match /chats/{chatId} {
      allow read: if request.auth != null && request.auth.uid in resource.data.participants;
      allow create: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid in resource.data.participants;
      match /messages/{messageId} {
        allow read, write: if request.auth != null && request.auth.uid in get(/databases/$(database)/documents/chats/$(chatId)).data.participants;
      }
    }
  }
}
```

### Storage Security Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null
        && request.resource.size < 10 * 1024 * 1024;
    }
  }
}
```

## Project Structure

```
wechat/
├── src/
│   ├── app/
│   │   ├── (auth)/           # Authentication routes (login, register)
│   │   ├── chat/             # Chat routes
│   │   │   ├── [chatId]/     # Individual chat
│   │   │   └── layout.tsx    # Chat layout with sidebar
│   │   ├── globals.css       # Global styles
│   │   ├── layout.tsx        # Root layout
│   │   └── page.tsx          # Home page (redirects)
│   ├── components/
│   │   ├── auth/             # Auth components
│   │   ├── chat/             # Chat components
│   │   │   ├── ChatPanel.tsx
│   │   │   ├── EmojiPicker.tsx
│   │   │   ├── MediaPreview.tsx
│   │   │   ├── MessageBubble.tsx
│   │   │   └── VoiceRecorder.tsx
│   │   ├── sidebar/
│   │   │   └── Sidebar.tsx
│   │   └── ui/               # shadcn/ui components
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # Utilities and config
│   ├── providers/            # Context providers
│   ├── services/             # Firebase services
│   ├── store/                # Zustand stores
│   ├── types/                # TypeScript types
│   └── styles/               # Additional styles
├── .env.example
├── next.config.ts
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

## Deployment

### Deploy to Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables from `.env.example`
4. Deploy

### Deploy to Firebase Hosting

```bash
npm install -g firebase-tools
firebase init hosting
firebase deploy --only hosting
```

## Performance Optimizations

- Dynamic imports for EmojiPicker (code splitting)
- Lazy loading images
- Efficient Firestore queries with indexes
- Optimistic UI updates
- Debounced search
- Memoized components
- Scroll restoration

## License

MIT
