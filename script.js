import { supabase } from "./supabaseClient.js";
const notifiedContests = new Set();
// Favorites saved in the browser for now
let favoriteContests = new Set(
    JSON.parse(localStorage.getItem("contestClockFavorites") || "[]")
);

function saveFavoritesLocally() {
    localStorage.setItem(
        "contestClockFavorites",
        JSON.stringify([...favoriteContests])
    );
}

async function loadFavoritesFromSupabase(userId) {
    try {
        const { data, error } = await supabase
            .from("user_preferences")
            .select("favorites")
            .eq("user_id", userId)
            .maybeSingle();

        if (error) throw error;

        
if (data) {
    // Merge browser favorites with this account's cloud favorites.
    const localFavorites = new Set(
        JSON.parse(localStorage.getItem("contestClockFavorites") || "[]")
    );

    const cloudFavorites = new Set(data.favorites || []);

    favoriteContests = new Set([
        ...cloudFavorites,
        ...localFavorites
    ]);

    // Save the merged list to the account's cloud row.
    const { error: mergeError } = await supabase
        .from("user_preferences")
        .upsert({
            user_id: userId,
            favorites: [...favoriteContests],
            preferences: data.preferences || {},
            updated_at: new Date().toISOString()
        });

    if (mergeError) throw mergeError;
}
 else {
            // First sync: preserve existing browser favorites.
            const { error: saveError } = await supabase
                .from("user_preferences")
                .upsert({
                    user_id: userId,
                    favorites: [...favoriteContests],
                    preferences: {},
                    updated_at: new Date().toISOString()
                });

            if (saveError) throw saveError;
        }

        saveFavoritesLocally();
        renderContests();

        console.log("Favorites synced with Supabase.");
    } catch (error) {
        console.error("Could not load cloud favorites:", error);
        alert("Could not sync favorites. Check the console and try again.");
    }
}

async function saveFavoritesToSupabase(userId) {
    const { data: existing, error: readError } = await supabase
        .from("user_preferences")
        .select("preferences")
        .eq("user_id", userId)
        .maybeSingle();

    if (readError) throw readError;

    const { error } = await supabase
        .from("user_preferences")
        .upsert({
            user_id: userId,
            favorites: [...favoriteContests],
            preferences: existing?.preferences || {},
            updated_at: new Date().toISOString()
        });

    if (error) throw error;
}


async function loadPreferencesFromSupabase(userId) {
    try {
        const { data, error } = await supabase
            .from("user_preferences")
            .select("preferences")
            .eq("user_id", userId)
            .maybeSingle();

        if (error) throw error;

        const preferences = data?.preferences || {};

        if (preferences.platformFilter) {
            platformFilter.value = preferences.platformFilter;
        }

        if (preferences.sortFilter) {
            sortFilter.value = preferences.sortFilter;
        }

        if (typeof preferences.showFavoritesOnly === "boolean") {
    showFavoritesOnly = preferences.showFavoritesOnly;
}

favoritesOnlyButton.textContent = showFavoritesOnly
    ? "★ Showing Favorites Only"
    : "☆ Show Favorites Only";

        renderContests();
        console.log("Preferences loaded from Supabase.");
    } catch (error) {
        console.error("Could not load preferences:", error);
    }
}

async function savePreferencesToSupabase(userId) {
    // Read the current row so favorites are preserved.
    const { data: existing, error: readError } = await supabase
        .from("user_preferences")
        .select("favorites, preferences")
        .eq("user_id", userId)
        .maybeSingle();

    if (readError) throw readError;

    const preferences = existing?.preferences || {};

    preferences.platformFilter = platformFilter.value;
    preferences.sortFilter = sortFilter.value;
    preferences.showFavoritesOnly = showFavoritesOnly;

    const { error } = await supabase
        .from("user_preferences")
        .upsert({
            user_id: userId,
            favorites: existing?.favorites || [...favoriteContests],
            preferences,
            updated_at: new Date().toISOString()
        });

    if (error) throw error;

    console.log("Preferences saved to Supabase.");
}

let currentTimetableUserId = null;

const smartTimetableSection = document.getElementById("smartTimetable");

function updateTimetableVisibility() {
    if (smartTimetableSection) {
        smartTimetableSection.hidden = !currentTimetableUserId;
    }
}

updateTimetableVisibility();

supabase.auth.onAuthStateChange((event, session) => {
    if (
        (event === "INITIAL_SESSION" || event === "SIGNED_IN") &&
        session?.user
    ) {
        const userId = session.user.id;

        // Wait until the auth callback finishes before making Supabase queries.
        setTimeout(async () => {
            await loadFavoritesFromSupabase(userId);
            await loadPreferencesFromSupabase(userId);
            await loadTimetableForUser(userId);

            updateTimetableVisibility();
        }, 0);
    }

    
if (event === "SIGNED_OUT") {
    // Keep this browser's favorites instead of erasing them.
    favoriteContests = new Set(
        JSON.parse(localStorage.getItem("contestClockFavorites") || "[]")
    );

    // Reset filters after signing out.
    platformFilter.value = "all";
    sortFilter.value = "soonest";

currentTimetableUserId = null;
weeklyClasses = [];

updateTimetableVisibility();
renderSmartTimetable();

    showFavoritesOnly = false;
    favoritesOnlyButton.textContent = "☆ Show Favorites Only";

    renderContests();
}

});


const contestList = document.getElementById("contestList");
const connectionStatus = document.getElementById("connectionStatus");
const refreshButton = document.getElementById("refreshButton");

const totalContests = document.getElementById("totalContests");
const codeforcesCount = document.getElementById("codeforcesCount");
const codechefCount = document.getElementById("codechefCount");

const searchInput = document.getElementById("searchInput");
const platformFilter = document.getElementById("platformFilter");
const sortFilter = document.getElementById("sortFilter");
const favoritesOnlyButton =
    document.getElementById("favoritesOnlyButton");

let showFavoritesOnly = false;

favoritesOnlyButton.addEventListener("click", async () => {
    showFavoritesOnly = !showFavoritesOnly;

    favoritesOnlyButton.textContent = showFavoritesOnly
        ? "★ Showing Favorites Only"
        : "☆ Show Favorites Only";

    renderContests();

    await saveCurrentPreferences();
});
const reminderMinutesSelect = document.getElementById("reminderMinutes");
async function loadReminderSetting() {
    try {
        const response = await fetch("/api/reminder-settings");
        if (!response.ok) throw new Error("Could not load reminder setting.");

        const data = await response.json();
        reminderMinutesSelect.value = String(data.reminderMinutes);
    } catch (error) {
        console.error("Could not load reminder setting:", error);
    }
}

reminderMinutesSelect.addEventListener("change", async () => {
    try {
        const response = await fetch("/api/reminder-settings", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                reminderMinutes: Number(reminderMinutesSelect.value)
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Could not save reminder setting.");
        }

        console.log(
            `Reminder setting saved: ${data.reminderMinutes} minutes.`
        );
    } catch (error) {
        console.error("Could not save reminder setting:", error);
        alert("Could not save your reminder setting. Please try again.");
    }
});

loadReminderSetting();



let contests = [];
let selectedDate = dateKey(new Date());
let calendarMonth = new Date();
let countdownTimer;


if ("serviceWorker" in navigator) {
    window.addEventListener("load", async () => {
        try {
            await navigator.serviceWorker.register("/sw.js");
            console.log("ContestClock service worker registered!");
        } catch (error) {
            console.error("Service worker registration failed:", error);
        }
    });
}


function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

function dateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function formatDate(timestamp) {
    return new Date(timestamp * 1000).toLocaleString([], {
        dateStyle: "medium",
        timeStyle: "short"
    });
}

function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours >= 24) {
        return `${Math.floor(hours / 24)}d ${hours % 86400 / 3600}h`;
    }

    return `${hours}h ${minutes}m`;
}

function getCountdown(startTime) {
    const remaining = startTime * 1000 - Date.now();

    if (remaining <= 0) return "Starting now";

    const days = Math.floor(remaining / 86400000);
    const hours = Math.floor((remaining % 86400000) / 3600000);
    const minutes = Math.floor((remaining % 3600000) / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);

    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

function googleCalendarUrl(contest) {
    const start = new Date(contest.startTime * 1000);
    const end = new Date((contest.startTime + contest.duration) * 1000);

    function toGoogleDate(date) {
        return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    }

    const params = new URLSearchParams({
        action: "TEMPLATE",
        text: `${contest.platform}: ${contest.name}`,
        dates: `${toGoogleDate(start)}/${toGoogleDate(end)}`,
        details: `Contest tracked by ContestClock.\nPlatform: ${contest.platform}\n${contest.url}`,
        location: contest.url
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

async function loadCodeforces() {
    const response = await fetch(
        "https://codeforces.com/api/contest.list?gym=false"
    );

    if (!response.ok) {
        throw new Error("Codeforces API request failed.");
    }

    const data = await response.json();

    if (data.status !== "OK") {
        throw new Error("Codeforces returned an unsuccessful response.");
    }

    return data.result
        .filter(contest => contest.phase === "BEFORE")
        .map(contest => ({
            id: `cf-${contest.id}`,
            name: contest.name,
            platform: "Codeforces",
            startTime: contest.startTimeSeconds,
            duration: contest.durationSeconds,
            url: `https://codeforces.com/contests/${contest.id}`
        }));
}

async function loadCodeChef() {
    const response = await fetch("/api/codechef");

    if (!response.ok) {
        throw new Error("CodeChef backend returned HTTP " + response.status);
    }

    const data = await response.json();

    if (!Array.isArray(data.future_contests)) {
        throw new Error("CodeChef future_contests was not found.");
    }

    return data.future_contests.map(contest => ({
        id: "cc-" + contest.contest_code,
        name: contest.contest_name,
        platform: "CodeChef",
        startTime: Date.parse(contest.contest_start_date_iso) / 1000,
        duration: (
            Date.parse(contest.contest_end_date_iso) -
            Date.parse(contest.contest_start_date_iso)
        ) / 1000,
        url: "https://www.codechef.com/" + contest.contest_code
    })).filter(contest =>
        Number.isFinite(contest.startTime) &&
        Number.isFinite(contest.duration) &&
        contest.duration > 0 &&
        contest.startTime * 1000 >= Date.now()
    );
}

function getFilteredContests() {
    const query = searchInput.value.trim().toLowerCase();
    const platform = platformFilter.value;

    const filtered = contests.filter(contest => {
        const matchesSearch = contest.name.toLowerCase().includes(query);
        const matchesPlatform =
            platform === "all" || contest.platform === platform;
const matchesFavorites =
    !showFavoritesOnly || favoriteContests.has(contest.id);

return matchesSearch && matchesPlatform && matchesFavorites;
    });

    if (sortFilter.value === "soonest") {
        filtered.sort((a, b) => a.startTime - b.startTime);
    } else if (sortFilter.value === "latest") {
        filtered.sort((a, b) => b.startTime - a.startTime);
    } else {
        filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    return filtered;
}

function renderContests() {
    const filtered = getFilteredContests();

    totalContests.textContent = contests.length;
    codeforcesCount.textContent =
        contests.filter(c => c.platform === "Codeforces").length;
    codechefCount.textContent =
        contests.filter(c => c.platform === "CodeChef").length;

    if (filtered.length === 0) {
        contestList.innerHTML = `
            <div class="message">
                No upcoming contests match your search.
            </div>
        `;
        return;
    }

    contestList.innerHTML = filtered.map(contest => `
        <article class="contest-card">
            <div class="contest-card-top">
                <span class="platform-badge ${contest.platform === "Codeforces" ? "cf-badge" : "cc-badge"}">
                    ${escapeHTML(contest.platform)}
                </span>
                <span class="contest-duration">
                    ${escapeHTML(formatDuration(contest.duration))}
                </span>
            </div>

            <h3>${escapeHTML(contest.name)}</h3>
            <p class="contest-date">
                <span>Starts</span>
                ${escapeHTML(formatDate(contest.startTime))}
            </p>

            <div class="countdown">
                <span>Starts in</span>
                <strong data-countdown="${escapeHTML(contest.id)}">
                    ${escapeHTML(getCountdown(contest.startTime))}
                </strong>
            </div>

         <div class="contest-actions">
    <a class="primary-link"
       href="${escapeHTML(contest.url)}"
       target="_blank"
       rel="noopener noreferrer">View contest ↗</a>

    <a class="secondary-link"
       href="${escapeHTML(googleCalendarUrl(contest))}"
       target="_blank"
       rel="noopener noreferrer">+ Google Calendar</a>

    <button
        type="button"
        class="favorite-button"
        data-favorite-id="${escapeHTML(contest.id)}">
        ${favoriteContests.has(contest.id) ? "★ Favorited" : "☆ Favorite"}
    </button>
</div>
        </article>
    `).join("");
        contestList.querySelectorAll("[data-favorite-id]").forEach(button => {
        button.addEventListener("click", async () => {
            const contestId = button.dataset.favoriteId;

            if (favoriteContests.has(contestId)) {
                favoriteContests.delete(contestId);
            } else {
                favoriteContests.add(contestId);
            }

saveFavoritesLocally();
renderContests();

try {
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
        await saveFavoritesToSupabase(user.id);
        console.log("Favorites saved to Supabase.");
    }
} catch (error) {
    console.error("Could not save cloud favorites:", error);
    alert("Favorite saved in this browser, but cloud sync failed.");
}

        });
    });
}

function updateCountdowns() {
    document.querySelectorAll("[data-countdown]").forEach(element => {
        const contest = contests.find(
            item => item.id === element.dataset.countdown
        );

        if (contest) {
            element.textContent = getCountdown(contest.startTime);
        }
    });
}

function renderCalendar() {
    const calendar = document.getElementById("calendarGrid");
    const monthLabel = document.getElementById("calendarMonthLabel");

    if (!calendar || !monthLabel) return;

    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();

    monthLabel.textContent = calendarMonth.toLocaleDateString([], {
        month: "long",
        year: "numeric"
    });

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const headings = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    let html = headings.map(day =>
        `<div class="calendar-weekday">${day}</div>`
    ).join("");

    for (let i = 0; i < firstDay; i++) {
        html += `<div class="calendar-cell empty"></div>`;
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const key = dateKey(date);

        const dayContests = contests.filter(contest =>
            dateKey(new Date(contest.startTime * 1000)) === key
        );

        const classes = [
            "calendar-cell",
            key === selectedDate ? "selected" : "",
            key === dateKey(new Date()) ? "today" : ""
        ].filter(Boolean).join(" ");

        html += `
            <button type="button" class="${classes}"
                    data-date="${key}">
                <span>${day}</span>
                ${dayContests.length
                    ? `<small>${dayContests.length} contest${dayContests.length > 1 ? "s" : ""}</small>`
                    : ""}
            </button>
        `;
    }

    calendar.innerHTML = html;

    calendar.querySelectorAll("[data-date]").forEach(button => {
        button.addEventListener("click", () => {
            selectedDate = button.dataset.date;
            renderCalendar();
            renderSelectedDate();
        });
    });

    renderSelectedDate();
}

function renderSelectedDate() {
    const target = document.getElementById("selectedDateContests");
    const label = document.getElementById("selectedDateLabel");

    if (!target || !label) return;

    const date = new Date(`${selectedDate}T12:00:00`);

    label.textContent = date.toLocaleDateString([], {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
    });

    const dayContests = contests
        .filter(contest =>
            dateKey(new Date(contest.startTime * 1000)) === selectedDate
        )
        .sort((a, b) => a.startTime - b.startTime);

    target.innerHTML = dayContests.length
        ? dayContests.map(contest => `
            <p>
                <strong>${escapeHTML(contest.platform)}</strong> —
                ${escapeHTML(contest.name)}
                · ${escapeHTML(new Date(contest.startTime * 1000).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit"
                }))}
                · <a href="${escapeHTML(contest.url)}"
                     target="_blank" rel="noopener noreferrer">Open</a>
            </p>
        `).join("")
        : `<p class="muted">No upcoming contests on this date.</p>`;
}

async function loadContests() {
    refreshButton.disabled = true;
    connectionStatus.textContent = "Fetching contests...";

    contestList.innerHTML =
        `<div class="message">Loading live contest data...</div>`;

    try {
        const results = await Promise.allSettled([
            loadCodeforces(),
            loadCodeChef()
        ]);

        const codeforces = results[0].status === "fulfilled"
            ? results[0].value : [];
        const codechef = results[1].status === "fulfilled"
            ? results[1].value : [];

        contests = [...codeforces, ...codechef];

renderContests();
renderCalendar();
renderTimetableClashes();

        const failed = [];
        if (results[0].status === "rejected") {
            failed.push("Codeforces");
            console.error("Codeforces error:", results[0].reason);
        }
        if (results[1].status === "rejected") {
            failed.push("CodeChef");
            console.error("CodeChef error:", results[1].reason);
        }

        connectionStatus.textContent = failed.length === 0
            ? `Both platforms connected · Updated ${new Date().toLocaleTimeString()}`
            : failed.length === 2
                ? "Both platforms failed"
                : `One platform unavailable: ${failed[0]}`;
    } catch (error) {
        console.error("ContestClock error:", error);
        connectionStatus.textContent = "Could not load contests";
    } finally {
        refreshButton.disabled = false;
    }
}

refreshButton.addEventListener("click", loadContests);
searchInput.addEventListener("input", renderContests);

async function saveCurrentPreferences() {
    try {
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            await savePreferencesToSupabase(user.id);
        }
    } catch (error) {
        console.error("Could not sync preferences:", error);
    }
}

platformFilter.addEventListener("change", () => {
    renderContests();
    saveCurrentPreferences();
});

sortFilter.addEventListener("change", () => {
    renderContests();
    saveCurrentPreferences();
});


document.getElementById("previousMonth")?.addEventListener("click", () => {
    calendarMonth.setMonth(calendarMonth.getMonth() - 1);
    renderCalendar();
});

document.getElementById("nextMonth")?.addEventListener("click", () => {
    calendarMonth.setMonth(calendarMonth.getMonth() + 1);
    renderCalendar();
});

document.getElementById("todayButton")?.addEventListener("click", () => {
    const today = new Date();
    calendarMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    selectedDate = dateKey(today);
    renderCalendar();
});

if (typeof countdownTimer !== "undefined") {
    clearInterval(countdownTimer);
}

countdownTimer = setInterval(updateCountdowns, 1000);

loadContests();


const notificationButton =
    document.getElementById("enableNotifications");

// Check whether this browser supports notifications.
if (!("Notification" in window)) {
    notificationButton.textContent = "Notifications Not Supported";
    notificationButton.disabled = true;
} else {
    // Show the current permission state.
    if (Notification.permission === "granted") {
        notificationButton.textContent = "🔔 Notifications Enabled";
    } else if (Notification.permission === "denied") {
        notificationButton.textContent = "Notifications Blocked";
    }
}


notificationButton.addEventListener("click", async () => {
    try {
        if (!("serviceWorker" in navigator) ||
            !("PushManager" in window)) {
            alert("Push notifications are not supported.");
            return;
        }

        const permission = await Notification.requestPermission();

        if (permission !== "granted") {
            alert("Please allow notifications in Chrome.");
            return;
        }

        const registration = await navigator.serviceWorker.ready;

        const keyResponse = await fetch("/api/vapid-public-key");

        if (!keyResponse.ok) {
            throw new Error("Could not fetch public key.");
        }

        const { publicKey } = await keyResponse.json();

        const applicationServerKey = Uint8Array.from(
            atob(publicKey.replace(/-/g, "+").replace(/_/g, "/")),
            character => character.charCodeAt(0)
        );

        let subscription =
            await registration.pushManager.getSubscription();

        if (!subscription) {
            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey
            });
        }

        const response = await fetch("/api/subscribe", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(subscription)
        });

        if (!response.ok) {
            throw new Error("Could not save subscription on server.");
        }

        notificationButton.textContent = "🔔 Push Notifications Enabled";
        alert("Success! Your browser is subscribed!");
    } catch (error) {
        console.error("Push subscription error:", error);
        alert("Error: " + error.message);
    }
});


/* ==========================================
   SMART TIMETABLE - ContestClock
   ========================================== */


const timetableStorageKey = "contestClockWeeklyClasses";

let weeklyClasses = [];

function getTimetableStorageKey(userId) {
    return `${timetableStorageKey}:${userId}`;
}

const classForm = document.getElementById("classForm");
const weeklyClassesContainer = document.getElementById("weeklyClasses");
const timetableClashesContainer =
    document.getElementById("timetableClashes");

    const weekdayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"
];


async function loadTimetableForUser(userId) {
    currentTimetableUserId = userId;
    updateTimetableVisibility();

    const storageKey = getTimetableStorageKey(userId);

    // Preserve this account's existing browser timetable.
    let localClasses = [];

    try {
        const saved = localStorage.getItem(storageKey);

        // Also check the older shared key if this account
        // has never had its own account-specific timetable.
        const legacySaved = localStorage.getItem(timetableStorageKey);

        const parsed = JSON.parse(
            saved !== null ? saved : (legacySaved || "[]")
        );

        localClasses = Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.error("Could not read local timetable:", error);
    }

    // Use local data immediately so the timetable doesn't
    // appear empty while the cloud request is running.
    weeklyClasses = localClasses;
    renderSmartTimetable();

    try {
        const { data, error } = await supabase
            .from("user_timetables")
            .select("classes")
            .eq("user_id", userId)
            .maybeSingle();

        if (error) throw error;

        if (data) {
            // Cloud data is authoritative when a cloud row exists.
            if (!Array.isArray(data.classes)) {
                throw new Error("Cloud timetable data is not an array.");
            }

            weeklyClasses = data.classes;

            localStorage.setItem(
                storageKey,
                JSON.stringify(weeklyClasses)
            );

            console.log("Timetable loaded from Supabase.");
        } else {
            // First cloud sync: migrate existing local classes.
            weeklyClasses = localClasses;

            await saveTimetableToSupabase(userId, weeklyClasses);

            console.log("Existing local timetable synced to Supabase.");
        }
    } catch (error) {
        // Never clear local classes just because cloud sync failed.
        console.error("Could not sync timetable with Supabase:", error);

        weeklyClasses = localClasses;

        console.warn(
            "Using the saved local timetable. Cloud sync can be retried later."
        );
    }

    // Do not render another account's timetable if the user
    // signed out or switched accounts during the request.
    if (currentTimetableUserId !== userId) return;

    renderSmartTimetable();
}

async function saveTimetableToSupabase(userId, classes) {
    const { error } = await supabase
        .from("user_timetables")
        .upsert({
            user_id: userId,
            classes: classes,
            updated_at: new Date().toISOString()
        });

    if (error) throw error;
}

function saveWeeklyClasses() {
    if (!currentTimetableUserId) {
        alert("Please sign in to save your timetable.");
        return;
    }

    const userId = currentTimetableUserId;
    const classesToSave = JSON.parse(JSON.stringify(weeklyClasses));

    // Save locally first so changes survive a temporary network issue.
    localStorage.setItem(
        getTimetableStorageKey(userId),
        JSON.stringify(classesToSave)
    );

    // Then sync the same snapshot to the cloud.
    saveTimetableToSupabase(userId, classesToSave)
        .then(() => {
            console.log("Timetable saved to Supabase.");
        })
        .catch(error => {
            console.error("Cloud timetable save failed:", error);
            console.warn(
                "Your timetable remains saved in this browser."
            );
        });
}


function timeToMinutes(time) {
  const parts = time.split(":").map(Number);
  return parts[0] * 60 + parts[1];
}

function displayClassTime(time) {
  const [hour, minute] = time.split(":").map(Number);
  const date = new Date();
  date.setHours(hour, minute, 0, 0);

  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit"
  });
}

function renderWeeklyClasses() {
  if (!weeklyClasses.length) {
    weeklyClassesContainer.innerHTML =
      '<div class="timetable-empty">No classes added yet.</div>';
    return;
  }

  weeklyClassesContainer.innerHTML = weeklyClasses.map(item => `
    <article class="class-item">
      <div>
        <h4>${escapeHTML(item.subject)}</h4>
        <p>
          ${weekdayNames[item.day]} ·
          ${displayClassTime(item.start)}–${displayClassTime(item.end)}
        </p>
      </div>
      <button
        type="button"
        class="class-delete"
        data-delete-class="${escapeHTML(item.id)}"
        aria-label="Remove ${escapeHTML(item.subject)}"
        title="Remove class">×</button>
    </article>
  `).join("");
}

function findTimetableClashes() {
  const results = [];
  const now = Date.now();
  const horizon = now + 30 * 24 * 60 * 60 * 1000;

  // Uses the contests array already populated by ContestClock.
  for (const contest of contests) {
    const contestStart = contest.startTime * 1000;
    const contestEnd =
      contestStart + contest.duration * 1000;

    if (contestEnd <= now || contestStart >= horizon) {
      continue;
    }

    const startDate = new Date(contestStart);
    const endDate = new Date(contestEnd);

    // Check every calendar date touched by the contest.
    const dayCursor = new Date(
      startDate.getFullYear(),
      startDate.getMonth(),
      startDate.getDate()
    );

    const lastDay = new Date(
      endDate.getFullYear(),
      endDate.getMonth(),
      endDate.getDate()
    );

    while (dayCursor <= lastDay) {
      const day = dayCursor.getDay();

      const dayStart = new Date(dayCursor);
      const dayEnd = new Date(dayCursor);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const overlapStart = Math.max(
        contestStart,
        dayStart.getTime()
      );

      const overlapEnd = Math.min(
        contestEnd,
        dayEnd.getTime()
      );

      if (overlapStart < overlapEnd) {
        const start = new Date(overlapStart);
        const end = new Date(overlapEnd);

        const classStartMinutes =
          start.getHours() * 60 + start.getMinutes();

        const classEndMinutes =
          end.getHours() * 60 + end.getMinutes() +
          (end.getSeconds() > 0 ? 1 : 0);

        for (const item of weeklyClasses) {
          if (item.day !== day) continue;

          const classStart = timeToMinutes(item.start);
          const classEnd = timeToMinutes(item.end);

          if (
            classStart < classEnd &&
            classStart < classEndMinutes &&
            classEnd > classStartMinutes
          ) {
            results.push({
              contest,
              subject: item.subject,
              date: new Date(dayCursor),
              overlapStart: new Date(Math.max(
                overlapStart,
                dayStart.getTime() +
                  classStart * 60 * 1000
              )),
              overlapEnd: new Date(Math.min(
                overlapEnd,
                dayStart.getTime() +
                  classEnd * 60 * 1000
              ))
            });
          }
        }
      }

      dayCursor.setDate(dayCursor.getDate() + 1);
    }
  }

  return results.sort(
    (a, b) => a.overlapStart - b.overlapStart
  );
}

function renderTimetableClashes() {
  const clashes = findTimetableClashes();

  if (!weeklyClasses.length) {
    timetableClashesContainer.innerHTML =
      '<div class="timetable-empty">Add your classes to check for contest clashes.</div>';
    return;
  }

  if (!clashes.length) {
    timetableClashesContainer.innerHTML =
      '<div class="timetable-empty">No clashes found in the next 30 days based on the contests currently loaded.</div>';
    return;
  }

  timetableClashesContainer.innerHTML = clashes.map(item => `
    <article class="clash-item">
      <div>
        <h4>⚠️ ${escapeHTML(item.contest.name)}</h4>
        <p>
          ${escapeHTML(item.contest.platform)} ·
          ${escapeHTML(item.subject)}
        </p>
        <p>
          ${item.date.toLocaleDateString([], {
            weekday: "short",
            day: "numeric",
            month: "short",
            year: "numeric"
          })}
          · ${item.overlapStart.toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit"
          })}
          – ${item.overlapEnd.toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit"
          })}
        </p>
      </div>
    </article>
  `).join("");
}

function renderSmartTimetable() {
  renderWeeklyClasses();
  renderTimetableClashes();
}

classForm.addEventListener("submit", event => {
  event.preventDefault();

  if (!currentTimetableUserId) {
    alert("Please sign in to use your Smart Timetable.");
    return;
}

  const subject = document
    .getElementById("classSubject").value.trim();

  const day = Number(
    document.getElementById("classDay").value
  );

  const start = document.getElementById("classStart").value;
  const end = document.getElementById("classEnd").value;

  if (!subject || !start || !end) {
    alert("Please complete all timetable fields.");
    return;
  }

  if (timeToMinutes(start) >= timeToMinutes(end)) {
    alert("End time must be later than start time. Classes crossing midnight aren't supported.");
    return;
  }

  weeklyClasses.push({
    id: crypto.randomUUID
      ? crypto.randomUUID()
      : String(Date.now()) + Math.random().toString(16).slice(2),
    subject,
    day,
    start,
    end
  });

  saveWeeklyClasses();
  classForm.reset();
  renderSmartTimetable();
});

weeklyClassesContainer.addEventListener("click", event => {
  const button = event.target.closest("[data-delete-class]");
  if (!button) return;

  weeklyClasses = weeklyClasses.filter(
    item => item.id !== button.dataset.deleteClass
  );

  saveWeeklyClasses();
  renderSmartTimetable();
});

// Run after the timetable elements have been added to the page.
renderSmartTimetable();


/* Dark / Light Theme Toggle */
const themeToggle = document.getElementById("themeToggle");

function applyTheme(theme) {
    if (theme === "light") {
        document.documentElement.classList.add("light-theme");
        document.documentElement.style.colorScheme = "light";
        themeToggle.textContent = "🌙 Dark Mode";
    } else {
        document.documentElement.classList.remove("light-theme");
        document.documentElement.style.colorScheme = "dark";
        themeToggle.textContent = "☀️ Light Mode";
    }

    localStorage.setItem("contestClockTheme", theme);
}

if (themeToggle) {
    const savedTheme = localStorage.getItem("contestClockTheme") || "dark";
    applyTheme(savedTheme);

    themeToggle.addEventListener("click", () => {
        const isLight = document.documentElement.classList.contains("light-theme");
        applyTheme(isLight ? "dark" : "light");
    });
}
