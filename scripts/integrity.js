(() => {
    "use strict";

    let failed = false;
    let songs = [];
    let currentSong = 0;

    const $ = id => document.getElementById(id);

    function redirect() {
        if (failed) return;

        failed = true;

        try {
            document.documentElement.style.visibility = "hidden";
        } catch (_) {}

        try {
            window.location.replace("https://cometsploit.com");
        } catch (_) {
            window.location.href = "https://cometsploit.com";
        }
    }

    function requiredDOMExists() {
        const ids = [
            "site-content",
            "custom-cursor",
            "entry-screen",
            "enter-button",
            "page",
            "greeting",
            "day",
            "date",
            "year",
            "live-time",
            "song-pfp",
            "song-title",
            "song-artist",
            "current-time",
            "duration",
            "seek-bar",
            "pause",
            "previous",
            "next",
            "play-icon",
            "audio"
        ];

        return ids.every(id => $(id));
    }

    function runtimeIntegrityCheck() {
        if (failed) return;

        if (!document.body ||
            !$("site-content") ||
            !$("page") ||
            !$("audio")) {
            redirect();
        }
    }

    function setupProtection() {
        document.addEventListener(
            "contextmenu",
            event => event.preventDefault(),
            true
        );

        document.addEventListener(
            "dragstart",
            event => event.preventDefault(),
            true
        );

        document.addEventListener(
            "selectstart",
            event => event.preventDefault(),
            true
        );
    }

    function setupMobileRedirect() {
        function check() {
            if (
                window.matchMedia(
                    "(max-width: 768px)"
                ).matches
            ) {
                redirect();
            }
        }

        check();

        window.addEventListener(
            "resize",
            check,
            true
        );
    }

    function setupCursor() {
        const cursor = $("custom-cursor");

        if (!cursor) return;

        let mouseX = innerWidth / 2;
        let mouseY = innerHeight / 2;

        let cursorX = mouseX;
        let cursorY = mouseY;

        let previousX = mouseX;
        let previousY = mouseY;

        let velocityX = 0;
        let velocityY = 0;

        let directionX = 1;
        let directionY = 0;

        let stretch = 1;
        let blur = 0;

        document.addEventListener(
            "mousemove",
            event => {
                mouseX = event.clientX;
                mouseY = event.clientY;
            },
            true
        );

        const lerp = (a, b, amount) =>
            a + (b - a) * amount;

        function animate() {
            if (failed) return;

            const dx = mouseX - previousX;
            const dy = mouseY - previousY;

            previousX = mouseX;
            previousY = mouseY;

            velocityX = lerp(
                velocityX,
                dx,
                0.45
            );

            velocityY = lerp(
                velocityY,
                dy,
                0.45
            );

            const speed = Math.sqrt(
                velocityX ** 2 +
                velocityY ** 2
            );

            if (speed > 2) {
                const length = speed;

                const nx =
                    velocityX / length;

                const ny =
                    velocityY / length;

                directionX = lerp(
                    directionX,
                    nx,
                    0.18
                );

                directionY = lerp(
                    directionY,
                    ny,
                    0.18
                );

                const directionLength =
                    Math.sqrt(
                        directionX ** 2 +
                        directionY ** 2
                    );

                if (directionLength > 0.001) {
                    directionX /=
                        directionLength;

                    directionY /=
                        directionLength;
                }
            }

            let targetStretch = 1;
            let targetBlur = 0;

            if (speed > 18) {
                const intensity =
                    Math.min(
                        (speed - 18) / 45,
                        1
                    );

                targetStretch =
                    1 + intensity * 2.4;

                targetBlur =
                    intensity * 2.5;
            }

            stretch = lerp(
                stretch,
                targetStretch,
                0.075
            );

            blur = lerp(
                blur,
                targetBlur,
                0.075
            );

            cursorX = lerp(
                cursorX,
                mouseX,
                0.4
            );

            cursorY = lerp(
                cursorY,
                mouseY,
                0.4
            );

            const tail =
                11 * (stretch - 1);

            cursor.style.transform =
                `translate3d(
                    ${cursorX - directionX * tail}px,
                    ${cursorY - directionY * tail}px,
                    0
                ) translate(-50%, -50%)`;

            cursor.style.filter =
                `blur(${blur}px)`;

            requestAnimationFrame(animate);
        }

        animate();

        document.addEventListener(
            "mouseleave",
            () => {
                cursor.style.opacity = "0";
            }
        );

        document.addEventListener(
            "mouseenter",
            () => {
                cursor.style.opacity = "1";
            }
        );
    }

    function updateDate() {
        if (failed) return;

        const now = new Date();
        const hour = now.getHours();

        let greeting;

        if (hour >= 5 && hour < 12) {
            greeting = "GOOD MORNING,";
        } else if (hour >= 12 && hour < 18) {
            greeting = "GOOD AFTERNOON,";
        } else if (hour >= 18 && hour < 22) {
            greeting = "GOOD EVENING,";
        } else {
            greeting = "GOOD NIGHT,";
        }

        $("greeting").textContent =
            greeting;

        $("day").textContent =
            now
                .toLocaleDateString(
                    "en-GB",
                    { weekday: "long" }
                )
                .toUpperCase();

        $("date").textContent =
            `${now
                .toLocaleDateString(
                    "en-GB",
                    { month: "long" }
                )
                .toUpperCase()}, ${now.getDate()}`;

        $("year").textContent =
            now.getFullYear();

        $("live-time").textContent =
            now.toLocaleTimeString(
                "en-GB",
                {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit"
                }
            );
    }

    function formatTime(seconds) {
        if (!Number.isFinite(seconds)) {
            return "0:00";
        }

        const minutes =
            Math.floor(seconds / 60);

        const remaining =
            Math.floor(seconds % 60)
                .toString()
                .padStart(2, "0");

        return `${minutes}:${remaining}`;
    }

    function setPlayIcon(playing) {
        const icon = $("play-icon");

        if (!icon) return;

        icon.innerHTML = playing
            ? '<path d="M7 5h3v14H7zM14 5h3v14h-3z"/>'
            : '<path d="M8 5v14l11-7z"/>';
    }

    function loadSong(index) {
        if (
            failed ||
            songs.length === 0
        ) {
            return;
        }

        currentSong =
            (
                index +
                songs.length
            ) %
            songs.length;

        const song =
            songs[currentSong];

        if (!song) return;

        $("song-title").textContent =
            song.title ||
            "Unknown Title";

        $("song-artist").textContent =
            song.artist ||
            "Unknown Artist";

        $("song-pfp").src =
            `songs/pfps/${song.pfp}`;

        $("audio").src =
            `songs/mp3/${song.mp3}`;

        $("audio").load();

        $("seek-bar").value = 0;
        $("current-time").textContent =
            "0:00";

        $("duration").textContent =
            "0:00";

        setPlayIcon(false);
    }

    async function loadSongs() {
        try {
            const response =
                await fetch(
                    "songs/songs.json",
                    { cache: "no-store" }
                );

            if (!response.ok) {
                throw new Error(
                    "songs.json failed"
                );
            }

            const data =
                await response.json();

            if (!Array.isArray(data)) {
                throw new Error(
                    "songs.json must contain an array"
                );
            }

            songs = data;

            if (songs.length) {
                loadSong(0);
            }
        } catch (error) {
            console.error(
                "song loader:",
                error
            );
        }
    }

    function setupPlayer() {
        const audio = $("audio");
        const seek = $("seek-bar");

        $("enter-button").addEventListener(
            "click",
            async () => {
                $("entry-screen")
                    .classList
                    .add("hidden");

                $("page")
                    .classList
                    .add("visible");

                try {
                    await audio.play();
                } catch (_) {}
            }
        );

        $("previous").addEventListener(
            "click",
            () => {
                loadSong(
                    currentSong - 1
                );

                audio.play().catch(
                    () => {}
                );
            }
        );

        $("next").addEventListener(
            "click",
            () => {
                loadSong(
                    currentSong + 1
                );

                audio.play().catch(
                    () => {}
                );
            }
        );

        $("pause").addEventListener(
            "click",
            () => {
                if (audio.paused) {
                    audio.play().catch(
                        () => {}
                    );
                } else {
                    audio.pause();
                }
            }
        );

        audio.addEventListener(
            "loadedmetadata",
            () => {
                $("duration").textContent =
                    formatTime(
                        audio.duration
                    );
            }
        );

        audio.addEventListener(
            "timeupdate",
            () => {
                $("current-time").textContent =
                    formatTime(
                        audio.currentTime
                    );

                if (audio.duration) {
                    seek.value =
                        (
                            audio.currentTime /
                            audio.duration
                        ) * 100;
                }
            }
        );

        seek.addEventListener(
            "input",
            () => {
                if (audio.duration) {
                    audio.currentTime =
                        (
                            seek.value / 100
                        ) *
                        audio.duration;
                }
            }
        );

        audio.addEventListener(
            "play",
            () => setPlayIcon(true)
        );

        audio.addEventListener(
            "pause",
            () => setPlayIcon(false)
        );

        audio.addEventListener(
            "ended",
            () => {
                loadSong(
                    currentSong + 1
                );

                audio.play().catch(
                    () => {}
                );
            }
        );
    }

    function initialize() {
        if (!requiredDOMExists()) {
            return;
        }

        document.body.classList.add(
            "integrity-passed"
        );

        setupProtection();
        setupMobileRedirect();
        setupCursor();
        setupPlayer();

        updateDate();

        setInterval(
            updateDate,
            1000
        );

        loadSongs();

        setInterval(
            runtimeIntegrityCheck,
            4000
        );
    }

    if (
        document.readyState ===
        "loading"
    ) {
        document.addEventListener(
            "DOMContentLoaded",
            initialize,
            { once: true }
        );
    } else {
        initialize();
    }
})();
