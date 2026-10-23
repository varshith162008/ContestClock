
self.addEventListener("push", event => {
    let data = {
        title: "ContestClock",
        body: "A coding contest is starting soon!"
    };

    if (event.data) {
        try {
            data = {
                ...data,
                ...event.data.json()
            };
        } catch (error) {
            data.body = event.data.text();
        }
    }

    event.waitUntil(
        self.registration.showNotification(data.title, {
            body: data.body,
            icon: "/favicon.ico",
            badge: "/favicon.ico",
            data: {
                url: data.url || "/"
            }
        })
    );
});

self.addEventListener("notificationclick", event => {
    event.notification.close();

    event.waitUntil(
        clients.openWindow(event.notification.data?.url || "/")
    );
});
