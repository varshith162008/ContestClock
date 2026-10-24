# ContestClock

**A contest reminder website for student programmers.**

ContestClock helps students discover upcoming programming contests, track start times, organize contests in a calendar, and identify clashes with their weekly college timetable.

## Features

- Live upcoming contests from Codeforces and CodeChef
- Search and platform filtering
- Contest countdown timers
- Favorites and saved preferences
- Google Calendar links for contests
- Browser notification and reminder features
- Monthly contest calendar
- Smart Timetable with upcoming contest-clash detection
- Supabase authentication and cloud synchronization
- Dark and light themes

## Tech Stack

- HTML, CSS and JavaScript
- Node.js backend
- Supabase Authentication and PostgreSQL
- Codeforces API
- CodeChef contest data through the project's backend
- Browser Notifications and Service Workers
- Google Calendar event links

## Requirements

- Node.js and npm
- A modern web browser
- A configured Supabase project
- The environment variables required by the backend

## Setup

1. Clone or download this repository.
2. Open a terminal in the project folder.
3. Install the project dependencies:

   ```bash
   npm install
   ```

4. Create a `.env` file in the project root and configure the environment variables required by `server.js`. Use the variable names expected by the project; do not commit `.env` or share secret values.
5. Start the backend:

   ```bash
   node server.js
   ```

6. Open the local URL printed by the server in your browser. The current development setup uses port `3000` when available.

Keep the terminal running while using the application. Do not open `index.html` directly as a `file://` URL because the application uses backend API routes and other browser features that require a local server.

## Supabase Setup

Create and configure the Supabase project required by the application.

Configure the database tables and Row Level Security (RLS) policies required for user-specific data. Use the database setup instructions and SQL associated with this project.

Use only frontend-safe Supabase publishable credentials in browser code. Keep server secrets in environment variables, and never commit secret credentials to GitHub.

## Testing Status

The following features have been manually tested during development:

- Codeforces and CodeChef contest listings
- Search and existing platform and duration filters
- Contest countdowns and Google Calendar event links
- Favorites and persistence after refresh
- Smart Timetable, clash detection, and persistence after refresh
- Registration, login, logout, and per-user data isolation
- Backend startup and reminder-settings API

These are manual development checks, not a complete automated test suite or independent security audit.

## Known Limitations

- Browser notification behavior depends on browser permissions and secure-context requirements.
- Notifications on the local HTTP development address have not been verified successfully on Android Chrome.
- Contest data and API availability depend on the relevant services.

## Project Status

ContestClock is a student project under development. Its core features have been manually tested, and further improvements may be made as development continues.

## Future Improvements

- Support for additional programming contest platforms
- Improved reminder scheduling
- Additional timetable and contest filters
- Further automated testing

## License

No license has been selected yet. Unless a license is added, the project remains subject to the default copyright rules. Do not assume others have permission to reuse or redistribute it.
