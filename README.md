# SkillShare - Peer-to-Peer Learning Platform

A modern React application that connects people who want to exchange skills through video calls, chat, and file sharing.

## 🚀 Features

- **User Authentication**: Secure email/password registration and login
- **Skill Matching**: Find people who have skills you want to learn and want to learn skills you have
- **Profile Management**: Create and update your profile with skills and personal information
- **Real-time Chat**: Text messaging during learning sessions
- **Video Calls**: WebRTC-powered video calls for face-to-face learning
- **File Sharing**: Upload and share documents during learning sessions
- **Match Management**: Accept/reject matches and manage learning partnerships

## 🛠 Tech Stack

- **Frontend**: React 19 with functional components and hooks
- **Styling**: TailwindCSS with custom components
- **Authentication**: Firebase Authentication
- **Database**: Cloud Firestore
- **File Storage**: Firebase Storage
- **Routing**: React Router v6
- **Video**: WebRTC (ready for implementation)
- **Package Manager**: Yarn

## 📋 Prerequisites

- Node.js (v16 or higher)
- Yarn package manager
- Firebase project with Authentication, Firestore, and Storage enabled

## 🔧 Setup Instructions

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <your-repo-url>
cd skill_share

# Install dependencies
yarn install
```

### 2. Firebase Configuration

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable the following services:
   - Authentication (Email/Password)
   - Firestore Database
   - Storage
3. Copy your Firebase configuration from Project Settings
4. Create a `.env` file in the root directory:

```env
REACT_APP_FIREBASE_API_KEY=your_api_key_here
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

### 3. Firebase Security Rules

Deploy the security rules to your Firebase project:

```bash
# Install Firebase CLI if you haven't already
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project
firebase init

# Deploy the rules
firebase deploy --only firestore:rules
firebase deploy --only storage
```

### 4. Start the Development Server

```bash
yarn start
```

The application will be available at `http://localhost:3000`

## 📁 Project Structure

```
src/
├── components/
│   ├── ui/                 # Reusable UI components
│   │   ├── Button.js
│   │   ├── Card.js
│   │   ├── Input.js
│   │   ├── SkillTag.js
│   │   └── LoadingSpinner.js
│   └── Navigation.js       # Main navigation component
├── contexts/
│   └── AuthContext.js      # Authentication context
├── firebase/
│   ├── config.js          # Firebase configuration
│   └── services.js        # Firebase service functions
├── pages/
│   ├── Login.js           # Login page
│   ├── Register.js        # Registration page
│   ├── Dashboard.js       # Main dashboard with matches
│   ├── Profile.js         # User profile page
│   ├── MatchDetails.js    # Match details and actions
│   └── Learning.js        # Learning session with video/chat
├── App.js                 # Main app component with routing
└── index.js               # App entry point
```

## 🔐 Security Features

- **Firestore Rules**: Users can only access their own data and matches they're part of
- **Storage Rules**: File access restricted to match participants
- **Authentication**: Protected routes require valid authentication
- **Data Validation**: Input validation on both client and server side

## 🎨 UI/UX Features

- **Responsive Design**: Works on desktop, tablet, and mobile
- **Clean Interface**: Minimal, modern design with TailwindCSS
- **Loading States**: Proper loading indicators throughout the app
- **Error Handling**: User-friendly error messages
- **Accessibility**: Semantic HTML and keyboard navigation support

## 🚀 Deployment

### Build for Production

```bash
yarn build
```

### Deploy to Firebase Hosting

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login and initialize
firebase login
firebase init hosting

# Deploy
firebase deploy
```

## 🔧 Available Scripts

- `yarn start` - Start development server
- `yarn build` - Build for production
- `yarn test` - Run tests
- `yarn eject` - Eject from Create React App

## 📝 Environment Variables

Create a `.env` file with the following variables:

```env
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the Firebase console for any configuration issues
2. Ensure all environment variables are set correctly
3. Verify that Firebase services are enabled
4. Check the browser console for any JavaScript errors

## 🔮 Future Enhancements

- [ ] WebRTC video call implementation with Simple Peer
- [ ] Push notifications for new matches
- [ ] Rating and review system
- [ ] Google Docs integration for collaborative editing
- [ ] Mobile app with React Native
- [ ] Advanced search and filtering
- [ ] Calendar integration for scheduling sessions
- [ ] Multi-language support