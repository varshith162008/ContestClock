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
- Supabase Authentication and PostgreSQL
- Codeforces API
- CodeChef contest data through the project's backend
- Browser Notifications and Service Workers
- Google Calendar event links

## Requirements

- A modern web browser
- Node.js or Python, depending on the backend used by this project
- A Supabase project
- The required backend environment variables

## Setup

1. Clone or download this repository.
2. Configure the Supabase project and required environment variables.
3. Install the backend dependencies according to the project's package or requirements file.
4. Start the backend using the documented project command.
5. Open the application through the local server URL.

Do not open `index.html` directly as a `file://` URL if the application requires ES modules, API routes, or service workers.

## Supabase Setup

Create the required database tables and configure Row Level Security policies for user-specific data. See the project's database setup instructions for the exact SQL.

Use only frontend-safe Supabase publishable credentials in browser code. Keep server secrets in environment variables.

## Project Status

ContestClock is a student project under development. Its core features have been manually tested. API availability and browser notification behavior may vary by platform and browser.

## Future Improvements

- More programming contest platforms
- Improved reminder scheduling
- Additional timetable and contest filters
- Further automated testing

## License

Add a license before distributing or reusing this project. If no license is selected, all rights remain reserved by default.
