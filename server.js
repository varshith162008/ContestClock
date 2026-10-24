require("dotenv").config();

const express = require("express");
const webpush = require("web-push");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const REMINDER_SETTINGS_FILE = path.join(
    __dirname,
    "reminder-settings.json"
);

const ALLOWED_REMINDER_MINUTES = [5, 10, 15, 30];

function loadReminderMinutes() {
    try {
        if (fs.existsSync(REMINDER_SETTINGS_FILE)) {
            const saved = JSON.parse(
                fs.readFileSync(REMINDER_SETTINGS_FILE, "utf8")
            );

            if (ALLOWED_REMINDER_MINUTES.includes(saved.reminderMinutes)) {
                return saved.reminderMinutes;
            }
        }
    } catch (error) {
        console.error("Could not load reminder settings:", error.message);
    }

    return 15;
}

let reminderMinutes = loadReminderMinutes();
webpush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
);

app.use(express.static(__dirname));

app.use(express.json());


const SUBSCRIPTIONS_FILE = path.join(
    __dirname,
    "subscriptions.json"
);

let subscriptions = new Map();

function loadSubscriptions() {
    try {
        if (fs.existsSync(SUBSCRIPTIONS_FILE)) {
            const savedData = fs.readFileSync(
                SUBSCRIPTIONS_FILE,
                "utf8"
            );

            const savedSubscriptions = JSON.parse(savedData);

            subscriptions = new Map(
                savedSubscriptions.map(subscription => [
                    subscription.endpoint,
                    subscription
                ])
            );

            console.log(
                `Loaded ${subscriptions.size} saved subscription(s).`
            );
        }
    } catch (error) {
        console.error("Could not load subscriptions:", error.message);
    }
}

function saveSubscriptions() {
    fs.writeFileSync(
        SUBSCRIPTIONS_FILE,
        JSON.stringify([...subscriptions.values()], null, 2),
        "utf8"
    );
}

loadSubscriptions();


app.get("/api/vapid-public-key", (req, res) => {
    res.json({
        publicKey: process.env.VAPID_PUBLIC_KEY
    });
});

app.get("/api/reminder-settings", (req, res) => {
    res.json({ reminderMinutes });
});

app.post("/api/reminder-settings", (req, res) => {
    const minutes = Number(req.body.reminderMinutes);

    if (!ALLOWED_REMINDER_MINUTES.includes(minutes)) {
        return res.status(400).json({
            error: "Invalid reminder time."
        });
    }

    reminderMinutes = minutes;
    fs.writeFileSync(
    REMINDER_SETTINGS_FILE,
    JSON.stringify({ reminderMinutes }, null, 2),
    "utf8"
);

    console.log(`Reminder time changed to ${reminderMinutes} minutes.`);

    res.json({
        success: true,
        reminderMinutes
    });
});

app.post("/api/subscribe", (req, res) => {
    const subscription = req.body;

    if (
        !subscription ||
        !subscription.endpoint ||
        !subscription.keys ||
        !subscription.keys.p256dh ||
        !subscription.keys.auth
    ) {
        return res.status(400).json({
            error: "Invalid push subscription."
        });
    }

    subscriptions.set(subscription.endpoint, subscription);
    saveSubscriptions();

    res.status(201).json({
        message: "Push subscription saved."
    });
});


app.post("/api/test-push", async (req, res) => {
    const subscriptionList = [...subscriptions.values()];

    if (subscriptionList.length === 0) {
        return res.status(404).json({
            error: "No browser subscriptions found. Subscribe first."
        });
    }

    const payload = JSON.stringify({
        title: "ContestClock 🚀",
        body: "Success! Your server sent a real push notification.",
        url: "/"
    });

    const results = await Promise.allSettled(
        subscriptionList.map(subscription =>
            webpush.sendNotification(subscription, payload)
        )
    );

    const successful = results.filter(
        result => result.status === "fulfilled"
    ).length;

    
    results.forEach((result, index) => {
        if (result.status === "rejected") {
            console.error(
                "Push failed:",
                result.reason?.statusCode || result.reason?.message
            );

            if (
                result.reason?.statusCode === 404 ||
                result.reason?.statusCode === 410
            ) {
                subscriptions.delete(subscriptionList[index].endpoint);
            }
        }
    });

    // Save subscription changes to the file
    saveSubscriptions();


    res.json({
        message: "Push attempt completed.",
        successful,
        total: subscriptionList.length
    });
});






app.get("/api/codechef", async (req, res) => {
    try {
        const response = await fetch(
            "https://www.codechef.com/api/list/contests/all?sort_by=START&sorting_order=asc&offset=0&mode=all",
            {
                headers: {
                    "User-Agent": "ContestClock/1.0",
                    "Accept": "application/json"
                },
                signal: AbortSignal.timeout(10000)
            }
        );

        if (!response.ok) {
            return res.status(502).json({
                error: "CodeChef returned HTTP " + response.status
            });
        }

        const data = await response.json();

        res.json(data);
    } catch (error) {
        console.error("CodeChef API error:", error.message);

        res.status(502).json({
            error: "Could not retrieve contest data from CodeChef.",
            details: error.message
        });
    }
});


const SENT_REMINDERS_FILE = path.join(
    __dirname,
    "sent-reminders.json"
);

const CHECK_INTERVAL_MS = 60 * 1000;

let sentReminders = new Set();

function loadSentReminders() {
    try {
        if (fs.existsSync(SENT_REMINDERS_FILE)) {
            const saved = JSON.parse(
                fs.readFileSync(SENT_REMINDERS_FILE, "utf8")
            );

            sentReminders = new Set(saved);
        }
    } catch (error) {
        console.error("Could not load sent reminders:", error.message);
    }
}

function saveSentReminders() {
    fs.writeFileSync(
        SENT_REMINDERS_FILE,
        JSON.stringify([...sentReminders], null, 2),
        "utf8"
    );
}

async function sendContestReminder(contest) {
    const subscriptionList = [...subscriptions.values()];

    if (subscriptionList.length === 0) {
        console.log("No subscribed browsers for:", contest.name);
        return false;
    }

    const payload = JSON.stringify({
        title: "ContestClock: Starting Soon! 🚀",
        body: `${contest.name} starts in about ${reminderMinutes} minutes.`,
        url: contest.url || "/"
    });

    const results = await Promise.allSettled(
        subscriptionList.map(subscription =>
            webpush.sendNotification(subscription, payload)
        )
    );

    let successCount = 0;
    let subscriptionChanged = false;

    results.forEach((result, index) => {
        if (result.status === "fulfilled") {
            successCount++;
            return;
        }

        const error = result.reason;

        console.error(
            "Contest reminder push failed:",
            error?.statusCode || error?.message
        );

        if (error?.statusCode === 404 || error?.statusCode === 410) {
            subscriptions.delete(subscriptionList[index].endpoint);
            subscriptionChanged = true;
        }
    });

    if (subscriptionChanged) {
        saveSubscriptions();
    }

    console.log(
        `Reminder for "${contest.name}": ${successCount}/${subscriptionList.length} push(es) accepted.`
    );

    return successCount > 0;
}

async function checkContestReminders() {
    try {
        const now = Date.now();
        const reminderWindow = reminderMinutes * 60 * 1000;

        const [cfResponse, ccResponse] = await Promise.all([
            fetch("https://codeforces.com/api/contest.list?gym=false", {
                signal: AbortSignal.timeout(15000)
            }),
            fetch(
                "https://www.codechef.com/api/list/contests/all?sort_by=START&sorting_order=asc&offset=0&mode=all",
                {
                    headers: {
                        "User-Agent": "ContestClock/1.0",
                        "Accept": "application/json"
                    },
                    signal: AbortSignal.timeout(15000)
                }
            )
        ]);

        if (!cfResponse.ok || !ccResponse.ok) {
            throw new Error("A contest platform returned an HTTP error.");
        }

        const cfData = await cfResponse.json();
        const ccData = await ccResponse.json();

        if (cfData.status !== "OK") {
            throw new Error("Codeforces API did not return OK.");
        }

        const contestsToCheck = [];

        for (const contest of cfData.result) {
            if (contest.phase !== "BEFORE") continue;

            contestsToCheck.push({
                id: `codeforces-${contest.id}`,
                name: contest.name,
                startTime: contest.startTimeSeconds * 1000,
                url: `https://codeforces.com/contests/${contest.id}`
            });
        }

        for (const contest of ccData.future_contests || []) {
            const startTime = Date.parse(contest.contest_start_date_iso);

            if (!Number.isFinite(startTime)) {
                console.warn(
                    "Skipping CodeChef contest with invalid ISO start date:",
                    contest.contest_name
                );
                continue;
            }

            contestsToCheck.push({
                id: `codechef-${contest.contest_id}`,
                name: contest.contest_name,
                startTime,
                url: "https://www.codechef.com/contests"
            });
        }

        console.log(
    `[Reminder check] ${new Date().toLocaleString()} — found ${contestsToCheck.length} upcoming contests.`
);

        for (const contest of contestsToCheck) {
           const reminderKey = `${contest.id}-${reminderMinutes}`;

            const reminderTime =
                contest.startTime - reminderWindow;

            // Send once the reminder time has arrived, but before
            // the contest starts. The key prevents duplicate pushes.
            if (
                now >= reminderTime &&
                now < contest.startTime &&
                !sentReminders.has(reminderKey)
            ) {
                const sent = await sendContestReminder(contest);

                if (sent) {
                    sentReminders.add(reminderKey);
                    saveSentReminders();
                }
            }
        }
    } catch (error) {
        console.error(
            "Automatic contest reminder check failed:",
            error.message
        );
    }
}




loadSentReminders();

console.log(
    `Automatic contest reminders enabled: ${reminderMinutes} minutes before contests.`
);

checkContestReminders();

setInterval(checkContestReminders, CHECK_INTERVAL_MS);







app.listen(PORT, () => {
    console.log(`ContestClock running at http://localhost:${PORT}`);
});
