(() => {
    "use strict";

    const REDIRECT_URL = "https://cometsploit.com";
    const ALLOWED_HOST = "ace.cometsploit.com";

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
            window.location.replace(REDIRECT_URL);
        } catch (_) {
            window.location.href = REDIRECT_URL;
        }
    }

    function startupCheck() {
        const host =
            String(location.hostname || "").toLowerCase();

        if (host !== ALLOWED_HOST) {
            redirect();
            return false;
        }

        if (window.top !== window.self) {
            redirect();
            return false;
        }

        return true;
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

        for (const id of ids) {
            if (!$(id)) {
                return false;
            }
        }

        return true;
    }

    function runtimeIntegrityCheck() {
        if (failed) return;

        if (!document.body) {
            redirect();
            return;
        }

        if (!$("site-content")) {
            redirect();
            return;
        }

        if (!$("page")) {
            redirect();
            return;
        }

        if (!$("audio")) {
            redirect();
            return;
        }

        const scriptFound =
            Array.from(document.scripts).some(script => {
                const src =
                    String(script.src || "").toLowerCase();

                return src.includes(
                    "/scripts/integrity.js"
                );
            });

        if (!scriptFound) {
            redirect();
        }
    }

    function setupProtection() {
        document.addEventListener(
            "contextmenu",
            event => {
                event.preventDefault();
            },
            true
        );

        document.addEventListener(
            "dragstart",
            event => {
                event.preventDefault();
            },
            true
        );

        document.addEventListener(
            "selectstart",
            event => {
                event.preventDefault();
            },
            true
        );

        document.addEventListener(
            "keydown",
            event => {
                const key =
                    String(event.key || "").toLowerCase();

                const devtools =
                    event.key === "F12" ||
                    (
                        event.ctrlKey &&
                        event.shiftKey &&
                        (
                            key === "i" ||
                            key === "j" ||
                            key === "c"
                        )
                    ) ||
                    (
                        event.metaKey &&
                        event.altKey &&
                        (
                            key === "i" ||
                            key === "j" ||
                            key === "c"
                        )
                    );

                const source =
                    (
                        event.ctrlKey &&
                        (
                            key === "u" ||
                            key === "s"
                        )
                    ) ||
                    (
                        event.metaKey &&
                        (
                            key === "u" ||
                            key === "s"
                        )
                    );

                if (devtools || source) {
                    event.preventDefault();
                    event.stopImmediatePropagation();
                    redirect();
                }
            },
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

    function setupDevToolsCheck() {
        let triggered = false;

        setInterval(() => {
            if (failed || triggered) {
                return;
            }

            const width =
                window.outerWidth -
                window.innerWidth;

            const height =
                window.outerHeight -
                window.innerHeight;

            if (
                width > 220 ||
                height > 220
            ) {
                triggered = true;
                redirect();
            }
        }, 2500);
    }

    function setupCursor() {
        const cursor =
            $("custom-cursor");

        let mouseX =
            window.innerWidth / 2;

        let mouseY =
            window.innerHeight / 2;

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

        function lerp(a, b, amount) {
            return a + (b - a) * amount;
        }

        function animate() {
            if (failed) {
                return;
            }

            const dx =
                mouseX - previousX;

            const dy =
                mouseY - previousY;

            previousX = mouseX;
            previousY = mouseY;

            velocityX =
                lerp(
                    velocityX,
                    dx,
                    0.45
                );

            velocityY =
                lerp(
                    velocityY,
                    dy,
                    0.45
                );

            const speed =
                Math.sqrt(
                    velocityX * velocityX +
                    velocityY * velocityY
                );

            if (speed > 2) {
                const nx =
                    velocityX / speed;

                const ny =
                    velocityY / speed;

                directionX =
                    lerp(
                        directionX,
                        nx,
                        0.18
                    );

                directionY =
                    lerp(
                        directionY,
                        ny,
                        0.18
                    );

                const length =
                    Math.sqrt(
                        directionX * directionX +
                        directionY * directionY
                    );

                if (length > 0.001) {
                    directionX /= length;
                    directionY /= length;
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

            stretch =
                lerp(
                    stretch,
                    targetStretch,
                    0.075
                );

            blur =
                lerp(
                    blur,
                    targetBlur,
                    0.075
                );

            cursorX =
                lerp(
                    cursorX,
                    mouseX,
                    0.4
                );

            cursorY =
                lerp(
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

        document
            .querySelectorAll(
                "button, a, input"
            )
            .forEach(element => {
                element.addEventListener(
                    "mouseenter",
                    () => {
                        cursor.style.width = "17px";
                        cursor.style.height = "17px";
                    }
                );

                element.addEventListener(
                    "mouseleave",
                    () => {
                        cursor.style.width = "11px";
                        cursor.style.height = "11px";
                    }
                );
            });
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
                    {
                        weekday: "long"
                    }
                )
                .toUpperCase();

        $("date").textContent =
            `${now
                .toLocaleDateString(
                    "en-GB",
                    {
                        month: "long"
                    }
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

        const secondsLeft =
            Math.floor(seconds % 60)
                .toString()
                .padStart(2, "0");

        return `${minutes}:${secondsLeft}`;
    }

    function setPlayIcon(playing) {
        const icon =
            $("play-icon");

        if (!icon) return;

        icon.innerHTML =
            playing
                ? '<path d="M7 5h3v14H7zM14 5h3v14h-3z"/>'
                : '<path d="M8 5v14l11-7z"/>';
    }

    function loadSong(index) {
        if (
            failed ||
            !songs.length
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

        if (!song) {
            return;
        }

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
        $("current-time").textContent = "0:00";
        $("duration").textContent = "0:00";

        setPlayIcon(false);
    }

    async function loadSongs() {
        try {
            const response =
                await fetch(
                    "songs/songs.json",
                    {
                        cache: "no-store"
                    }
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
                    "songs.json isn't an array"
                );
            }

            songs = data;

            if (songs.length > 0) {
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
        const audio =
            $("audio");

        const seek =
            $("seek-bar");

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
            () => {
                setPlayIcon(true);
            }
        );

        audio.addEventListener(
            "pause",
            () => {
                setPlayIcon(false);
            }
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
        if (!startupCheck()) {
            return;
        }

        if (!requiredDOMExists()) {
            return;
        }

        document.body.classList.add(
            "integrity-passed"
        );

        setupProtection();
        setupMobileRedirect();
        setupDevToolsCheck();
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
            {
                once: true
            }
        );
    } else {
        initialize();
    }
})();
