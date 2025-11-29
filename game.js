// ==========================================
//   VIDEOJUEGO EDÉN - VERSIÓN MAESTRA FINAL
//   Fix: Game Over Audio Stop & Interfaz
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    
    // --- 1. REFERENCIAS AL DOM ---
    const hud = document.getElementById("hud");
    const game = document.getElementById("game");
    const player = document.getElementById("player");
    const tree = document.getElementById("tree");
    
    // Textos del HUD
    const scoreText = document.getElementById("score-display");
    const applesText = document.getElementById("apples-collected");
    const requiredText = document.getElementById("required-apples");
    const levelText = document.getElementById("current-level");
    const livesText = document.getElementById("lives");
    const timerText = document.getElementById("timer-display"); 
    
    // Pantallas
    const mainMenu = document.getElementById("main-menu");
    const helpMenu = document.getElementById("help-menu");
    const message = document.getElementById("message");
    const messageTitle = document.getElementById("message-title");
    const messageBody = document.getElementById("message-text");
    const pauseOverlay = document.getElementById("pause-overlay");
    const gameControls = document.getElementById("game-controls");

    // Botones de Audio
    const btnMute = document.getElementById("btn-mute");
    const volSlider = document.getElementById("volumen-slider");

    // --- 2. VARIABLES DEL JUEGO ---
    const MAX_LEVELS = 5;
    const INITIAL_TIME = 60;
    const POWER_UP_DURATION = 5000;
    
    let currentLevel = 1;
    let score = 0;
    let applesCollected = 0;
    let totalApples = 5;
    let lives = 3;
    let timeLeft = 60;
    
    let posX = 20; 
    let posY = 20; 
    let playerSpeed = 10;
    
    let apples = [];
    let enemies = [];
    let powerUps = []; 
    
    let gameActive = false;
    let isPaused = false;
    let isInvincible = false;
    let isSlowed = false;
    
    let gameLoopId;
    let timerId;
    let powerUpTimerId;

    // ======================================================
    // 🎵 GESTOR DE AUDIO (Ruta: ./Sonidos/)
    // ======================================================
    const audioManager = {
        sounds: {},
        currentMusic: null,
        isMuted: false,

        load(name, path) {
            const audio = new Audio(path);
            audio.preload = 'auto';
            // Loop solo para música de fondo, gameover suena una vez
            if (name.includes('Music')) {
                audio.loop = true;
                audio.volume = 0.3;
            }
            audio.onerror = () => console.warn(`Falta archivo: ${path}`);
            this.sounds[name] = audio;
        },

        // Reproducir Efectos (Se superponen)
        play(name) {
            if (this.isMuted || !this.sounds[name]) return;
            const sound = this.sounds[name];
            
            // Solo clonamos efectos cortos (comer, powerup)
            // NO clonamos gameover para poder pararlo
            if (!name.includes('Music') && name !== 'gameover') {
                const clone = sound.cloneNode();
                clone.volume = sound.volume;
                clone.play().catch(() => {});
            }
        },

        // Reproducir Música o Estados (Menú, Juego, GameOver)
        playMusic(name) {
            if (this.isMuted || !this.sounds[name]) return;
            
            // Si ya suena, no reiniciar (excepto si es gameover, ese siempre reinicia)
            if (this.currentMusic === name && !this.sounds[name].paused && name !== 'gameover') return;

            this.stopMusic(); // Paramos todo lo anterior

            const music = this.sounds[name];
            music.currentTime = 0;
            music.play().catch(() => console.log("Esperando clic..."));
            this.currentMusic = name;
        },

        // Detener absolutamente todo
        stopMusic() {
            // Parar la música actual registrada
            if (this.currentMusic && this.sounds[this.currentMusic]) {
                this.sounds[this.currentMusic].pause();
                this.sounds[this.currentMusic].currentTime = 0;
            }
            // Parar explícitamente gameover por seguridad
            if(this.sounds['gameover']) {
                this.sounds['gameover'].pause();
                this.sounds['gameover'].currentTime = 0;
            }
        },

        toggleMute() {
            this.isMuted = !this.isMuted;
            if (this.isMuted) {
                this.stopMusic();
            } else {
                if (gameActive && !isPaused) this.playMusic('gameMusic');
                else if (!gameActive) this.playMusic('menuMusic');
            }
            return this.isMuted;
        },

        setVolume(val) {
            const vol = parseFloat(val);
            Object.keys(this.sounds).forEach(key => {
                const s = this.sounds[key];
                if (key.includes('Music')) s.volume = Math.min(1.0, vol * 0.4);
                else s.volume = vol;
            });
        }
    };

    // CARGA DE ARCHIVOS
    audioManager.load('menuMusic', './Sonidos/menuMusic.mp3');
    audioManager.load('gameMusic', './Sonidos/gameMusic.mp3');
    audioManager.load('comer',     './Sonidos/comer.mp3');
    audioManager.load('powerup',   './Sonidos/powerup.mp3');
    audioManager.load('gameover',  './Sonidos/gameover.mp3');


    // ======================================================
    // 🎮 LÓGICA DEL JUEGO
    // ======================================================

    function startGame(level) {
        // FIX: Reiniciar Vidas si perdiste
        if (lives <= 0 || level === 1) {
            lives = 3;
        }
        if (level === 1) {
            score = 0;
        }

        gameActive = true;
        isPaused = false;
        currentLevel = level;
        
        totalApples = 5 + (currentLevel - 1) * 2;
        playerSpeed = 18 + (currentLevel * 2);
        timeLeft = INITIAL_TIME + (currentLevel - 1) * 10;
        
        // Aquí empieza la música del juego, lo que CORTA el gameover
        audioManager.playMusic('gameMusic'); 
        
        resetScene(); 
        setAmbience(currentLevel);

        clearInterval(gameLoopId);
        gameLoopId = setInterval(update, 1000 / 60); 
        startTimer();
    }

    function resetScene() {
        apples.forEach(a => a.remove()); apples = [];
        enemies.forEach(e => e.remove()); enemies = [];
        powerUps.forEach(p => p.element.remove()); powerUps = [];
        
        clearTimeout(powerUpTimerId);
        isSlowed = false;
        isInvincible = false;
        applesCollected = 0;

        // Actualizar HUD INMEDIATAMENTE
        scoreText.textContent = score;
        applesText.textContent = 0;
        requiredText.textContent = totalApples;
        livesText.textContent = lives;
        levelText.textContent = currentLevel;
        timerText.textContent = timeLeft;
        timerText.style.color = "white";

        mainMenu.classList.add("hidden");
        message.style.display = "none";
        hud.classList.remove("hidden");
        game.classList.remove("hidden");
        gameControls.classList.remove("hidden");
        helpMenu.classList.add("hidden");
        pauseOverlay.classList.add("hidden");

        posX = 20; posY = 20;
        player.classList.remove("blinking");
        tree.classList.remove("tree-ready");
        updatePlayerPos();

        spawnEntities();
    }

    function setAmbience(level) {
        const body = document.body;
        if (level === 1) body.style.background = "linear-gradient(to bottom, #87CEEB, #E0F7FA)";
        else if (level === 2) body.style.background = "linear-gradient(to bottom, #FF8C00, #FAD0C4)";
        else body.style.background = "linear-gradient(to bottom, #0f2027, #203a43, #2c5364)";
    }

    function spawnEntities() {
        for(let i=0; i<totalApples; i++) createItem('apple', '🍎');
        
        for(let i=0; i<currentLevel; i++) {
            let e = createItem('enemy', '👻');
            e.initialSpeed = 0.8 + (currentLevel * 0.4);
            e.speed = e.initialSpeed;
            e.dirX = Math.random() < 0.5 ? 1 : -1;
            e.dirY = currentLevel > 1 ? (Math.random() < 0.5 ? 1 : -1) : 0;
            enemies.push(e);
        }

        if (currentLevel >= 2) {
            let p = createItem('power-up', '⏳');
            powerUps.push({ element: p, type: 'slow' });
        }
        if (lives < 5 && currentLevel >= 3) {
            let p = createItem('power-up', '💖');
            powerUps.push({ element: p, type: 'life' });
        }
    }

    function createItem(className, icon) {
        const el = document.createElement("div");
        el.classList.add(className);
        el.textContent = icon;
        el.style.left = (100 + Math.random() * (game.clientWidth - 150)) + "px";
        el.style.top = (Math.random() * (game.clientHeight - 50)) + "px";
        game.appendChild(el);
        if (className === 'apple') apples.push(el);
        return el;
    }

    function update() {
        if (!gameActive || isPaused) return;

        enemies.forEach(enemy => {
            let speed = enemy.speed * (isSlowed ? 0.2 : 1);
            let nx = parseFloat(enemy.style.left) + (enemy.dirX * speed);
            let ny = parseFloat(enemy.style.top) + (enemy.dirY * speed);

            if (nx <= 0 || nx >= (game.clientWidth - 35)) {
                enemy.dirX *= -1;
                enemy.style.transform = `scaleX(${enemy.dirX})`;
            }
            if (ny <= 0 || ny >= (game.clientHeight - 35)) {
                enemy.dirY *= -1;
            }

            enemy.style.left = nx + "px";
            enemy.style.top = ny + "px";

            if(isSlowed) enemy.classList.add("slowed");
            else enemy.classList.remove("slowed");

            if (!isInvincible && isColliding(player, enemy)) {
                handleHit();
            }
        });

        apples.forEach((a, index) => {
            if (a && isColliding(player, a)) {
                a.remove();
                apples[index] = null;
                score += 100;
                applesCollected++;
                scoreText.textContent = score;
                applesText.textContent = applesCollected;
                audioManager.play('comer');

                if (applesCollected === totalApples) {
                    tree.classList.add("tree-ready");
                }
            }
        });
        apples = apples.filter(a => a !== null);

        powerUps.forEach((p, index) => {
            if (p && isColliding(player, p.element)) {
                p.element.remove();
                powerUps[index] = null;
                audioManager.play('powerup');
                
                if (p.type === 'slow') {
                    activateSlowMotion();
                } else if (p.type === 'life') {
                    if(lives < 5) lives++;
                    livesText.textContent = lives;
                }
            }
        });
        powerUps = powerUps.filter(p => p !== null);

        if (isColliding(player, tree) && applesCollected >= totalApples) {
            levelComplete();
        }
    }

    function activateSlowMotion() {
        clearTimeout(powerUpTimerId);
        isSlowed = true;
        powerUpTimerId = setTimeout(() => {
            isSlowed = false;
        }, POWER_UP_DURATION);
    }

    function handleHit() {
        lives--;
        livesText.textContent = lives;
        score = Math.max(0, score - 50);
        scoreText.textContent = score;
        
        // NO SUENA GAMEOVER AQUI. Solo silencio o 'dano' si lo añades.

        if (lives <= 0) {
            gameOver();
        } else {
            isInvincible = true;
            player.classList.add("blinking");
            posX = 20; posY = 20; updatePlayerPos();
            setTimeout(() => {
                isInvincible = false;
                player.classList.remove("blinking");
            }, 2000);
        }
    }

    function levelComplete() {
        gameActive = false;
        clearInterval(gameLoopId);
        clearInterval(timerId);
        
        audioManager.stopMusic();
        // audioManager.play('win'); // Opcional

        showMessage("¡Nivel Completado!", `Puntos: ${score}`, true);
    }

    function gameOver() {
        gameActive = false;
        clearInterval(gameLoopId);
        clearInterval(timerId);
        
        // CORRECCIÓN CRUCIAL: Usamos playMusic para que el sistema lo registre
        // y pueda pararlo después.
        audioManager.playMusic('gameover');

        showMessage("GAME OVER", `¡Te atraparon! Final: ${score}`, false);
    }

    function showMessage(title, text, isWin) {
        message.style.display = "flex";
        messageTitle.textContent = title;
        messageBody.textContent = text;
        
        const nextBtn = document.getElementById("next-level-btn");
        const restartLvlBtn = document.getElementById("restart-level-btn");

        nextBtn.classList.add("hidden");
        restartLvlBtn.classList.add("hidden");

        if (isWin) {
            messageTitle.className = "";
            if (currentLevel < MAX_LEVELS) {
                nextBtn.classList.remove("hidden");
            } else {
                messageTitle.textContent = "🎉 ¡GANASTE TODO! 🎉";
            }
        } else {
            messageTitle.className = "game-over-title";
            restartLvlBtn.classList.remove("hidden");
        }
    }

    function startTimer() {
        clearInterval(timerId);
        timerId = setInterval(() => {
            if (!isPaused) {
                if (!isSlowed || Math.random() > 0.5) {
                    timeLeft--;
                    timerText.textContent = timeLeft;
                    if (timeLeft <= 10) timerText.style.color = "red";
                    if (timeLeft <= 0) gameOver();
                }
            }
        }, 1000);
    }

    function updatePlayerPos() {
        player.style.left = posX + "px";
        player.style.bottom = posY + "px";
    }

    function isColliding(a, b) {
        const r1 = a.getBoundingClientRect();
        const r2 = b.getBoundingClientRect();
        return !(r1.right < r2.left || r1.left > r2.right || r1.bottom < r2.top || r1.top > r2.bottom);
    }

    // --- CONTROLES ---
    document.addEventListener("keydown", (e) => {
        if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.key)) {
            e.preventDefault();
        }

        if (!gameActive) return;
        if (e.key === "p" || e.key === "P") togglePause();
        
        if (!isPaused) {
            if (e.key === "ArrowUp") posY = Math.min(game.clientHeight - 50, posY + playerSpeed);
            if (e.key === "ArrowDown") posY = Math.max(0, posY - playerSpeed);
            if (e.key === "ArrowLeft") { posX = Math.max(0, posX - playerSpeed); player.style.transform = "scaleX(-1)"; }
            if (e.key === "ArrowRight") { posX = Math.min(game.clientWidth - 50, posX + playerSpeed); player.style.transform = "scaleX(1)"; }
            updatePlayerPos();
        }
    });

    document.getElementById("btn-jugar").onclick = () => startGame(1);
    document.getElementById("btn-restart-game").onclick = () => startGame(currentLevel);
    document.getElementById("btn-salir-juego").onclick = () => location.reload();
    document.getElementById("restart").onclick = () => location.reload();
    document.getElementById("btn-salir").onclick = () => alert("Cierra la pestaña para salir.");

    document.getElementById("next-level-btn").onclick = () => startGame(currentLevel + 1);
    document.getElementById("restart-level-btn").onclick = () => startGame(currentLevel); 

    document.getElementById("btn-ayuda").onclick = () => {
        mainMenu.classList.add("hidden");
        helpMenu.classList.remove("hidden");
    };
    document.getElementById("btn-cerrar-ayuda").onclick = () => {
        helpMenu.classList.add("hidden");
        mainMenu.classList.remove("hidden");
    };

    const togglePause = () => {
        isPaused = !isPaused;
        if (isPaused) {
            pauseOverlay.classList.remove("hidden");
            audioManager.pause();
            document.getElementById("btn-pause").textContent = "Reanudar";
        } else {
            pauseOverlay.classList.add("hidden");
            audioManager.resume();
            document.getElementById("btn-pause").textContent = "Pausar";
        }
    };
    document.getElementById("btn-pause").onclick = togglePause;

    btnMute.onclick = () => {
        const muted = audioManager.toggleMute();
        btnMute.textContent = muted ? "🔇" : "🔊";
        btnMute.blur();
    };

    volSlider.oninput = (e) => audioManager.setVolume(e.target.value);
    volSlider.onchange = (e) => e.target.blur();

    document.body.addEventListener('click', () => {
        if (!audioManager.currentMusic && !gameActive) {
            audioManager.playMusic('menuMusic');
        } else if (audioManager.currentMusic && audioManager.sounds[audioManager.currentMusic].paused && !audioManager.isMuted && !isPaused) {
            audioManager.sounds[audioManager.currentMusic].play().catch(()=>{});
        }
    });

    audioManager.playMusic('menuMusic');
});