// game.js 

document.addEventListener("DOMContentLoaded", () => {
  
  // --- 1. Elementos del DOM ---
  const hud = document.getElementById("hud");
  const game = document.getElementById("game");
  const player = document.getElementById("player");
  const tree = document.getElementById("tree");
  
  const scoreDisplayText = document.getElementById("score-display");
  const applesCollectedText = document.getElementById("apples-collected");
  const requiredApplesText = document.getElementById("required-apples");
  const currentLevelText = document.getElementById("current-level");
  const livesText = document.getElementById("lives");
  const timerDisplayText = document.getElementById("timer-display"); 

  const gameControls = document.getElementById("game-controls");
  const btnPause = document.getElementById("btn-pause");
  const btnRestartGame = document.getElementById("btn-restart-game");
  const btnSalirJuego = document.getElementById("btn-salir-juego");
  
  const btnMute = document.getElementById("btn-mute");
  const volumenSlider = document.getElementById("volumen-slider");

  const message = document.getElementById("message");
  const messageTitle = document.getElementById("message-title");
  const messageText = document.getElementById("message-text");
  const restartBtn = document.getElementById("restart");
  const nextLevelBtn = document.getElementById("next-level-btn");
  const restartLevelBtn = document.getElementById("restart-level-btn");
  const pauseOverlay = document.getElementById("pause-overlay");
  const mainMenu = document.getElementById("main-menu");
  const helpMenu = document.getElementById("help-menu");
  const btnJugar = document.getElementById("btn-jugar");
  const btnAyuda = document.getElementById("btn-ayuda");
  const btnSalir = document.getElementById("btn-salir");
  const btnCerrarAyuda = document.getElementById("btn-cerrar-ayuda");

  // --- 2. Variables del Juego ---
  const MAX_LEVELS = 5;
  const POWER_UP_SLOW_DURATION = 5000; 
  const INITIAL_TIME_PER_LEVEL = 60; 
  
  let currentLevel = 1;
  let totalApples = 5;
  let apples = [];
  let enemies = [];
  let powerUps = []; 
  let lives = 3;
  
  let score = 0;
  let applesCollected = 0;
  let posX = 20; 
  let posY = 20;
  let playerSpeed = 10;
  
  let gameActive = false;
  let isPaused = false;
  let isInvincible = false;
  let isEnemiesSlowed = false; 
  let timerSlowedFactor = 1;

  let gameLoopId;
  let timerIntervalId;
  let timeLeft = INITIAL_TIME_PER_LEVEL;
  
  // --- SISTEMA DE AUDIO (Rutas corregidas con ./) ---
  const audioCtx = {
    menuMusic: new Audio('./sonidos/menuMusic.mp3'),
    gameMusic: new Audio('./sonidos/gameMusic.mp3'),
    comer: new Audio('./sonidos/comer.mp3'),
    //dano: new Audio('./sonidos/dano.mp3'),
    powerup: new Audio('./sonidos/powerup.mp3'),
    //win: new Audio('./sonidos/win.mp3'),
    gameover: new Audio('./sonidos/gameover.mp3')
  };

  try {
      audioCtx.menuMusic.loop = true;
      audioCtx.menuMusic.volume = 0.3;
      audioCtx.gameMusic.loop = true;
      audioCtx.gameMusic.volume = 0.3;
  } catch (e) { console.log("Audio no disponible aún"); }

  let isMuted = false;
  
  // --- 3. Funciones Principales ---
  
  function startGame(level) {
    // --- RESETEO DE SONIDOS SEGURO ---
    try {
        // Verificamos si existe antes de pausar para evitar errores
        if(audioCtx.gameover) {
            audioCtx.gameover.pause();
            audioCtx.gameover.loop = false; 
            audioCtx.gameover.currentTime = 0;
        }
        
        if(audioCtx.win) {
            audioCtx.win.pause();
            audioCtx.win.currentTime = 0;
        }
    } catch(e){}
    // ---------------------------------------

    gameActive = true;
    isPaused = false;
    currentLevel = level;
    
    totalApples = 5 + (currentLevel - 1) * 2;
    playerSpeed = 18 + (currentLevel * 2);
    timeLeft = INITIAL_TIME_PER_LEVEL + (currentLevel - 1) * 10;
    
    resetLevelState(); 
    setAmbience(currentLevel); 
    
    let treeScale = 1 + (level * 0.1);
    tree.style.transform = `scale(${treeScale})`;

    mainMenu.classList.add("hidden");
    helpMenu.classList.add("hidden");
    message.style.display = "none";
    pauseOverlay.classList.add("hidden");
    
    hud.classList.remove("hidden");
    game.classList.remove("hidden");
    gameControls.classList.remove("hidden");
    
    spawnApples();
    spawnEnemies(currentLevel);
    spawnPowerUps(); 
    movePlayer(); 

    clearInterval(gameLoopId);
    gameLoopId = setInterval(gameLoop, 1000 / 60);

    stopAndRestartTimer(1000); 
    
    cambiarMusica("juego"); 
  }

  function showMainMenu() {
    gameActive = false;
    clearInterval(gameLoopId);
    clearInterval(timerIntervalId); 
    
    // Apagar sonidos de forma segura
    try {
        if(audioCtx.gameover) {
            audioCtx.gameover.pause();
            audioCtx.gameover.loop = false; 
            audioCtx.gameover.currentTime = 0;
        }
        if(audioCtx.win) {
            audioCtx.win.pause();
            audioCtx.win.currentTime = 0;
        }
    } catch(e){}

    cambiarMusica("menu");
    
    hud.classList.add("hidden");
    game.classList.add("hidden");
    gameControls.classList.add("hidden");
    helpMenu.classList.add("hidden");
    message.style.display = "none";
    pauseOverlay.classList.add("hidden");
    mainMenu.classList.remove("hidden");
    
    document.body.style.background = "linear-gradient(to bottom, #9be15d, #00e3ae)";
  }

  function resetLevelState() {
    score = 0;
    applesCollected = 0;
    lives = 3; 
    isInvincible = false;
    isEnemiesSlowed = false; 
    timerSlowedFactor = 1; 

    player.classList.remove("blinking");
    tree.classList.remove("tree-ready"); 
    
    scoreDisplayText.textContent = score;
    applesCollectedText.textContent = applesCollected;
    livesText.textContent = lives;
    requiredApplesText.textContent = totalApples;
    currentLevelText.textContent = currentLevel;
    timerDisplayText.textContent = timeLeft; 
    
    posX = 20;
    posY = 20; 
    player.style.transform = "scaleX(1)";
    
    document.querySelectorAll(".apple").forEach(a => a.remove());
    apples = [];
    document.querySelectorAll(".enemy").forEach(e => e.remove());
    enemies = [];
    document.querySelectorAll(".power-up").forEach(pu => pu.remove()); 
    powerUps = [];
  }

  function setAmbience(level) {
    const body = document.body;
    if (level === 1) {
        body.style.background = "linear-gradient(to bottom, #9be15d, #87CEEB)";
    } else if (level === 2) {
        body.style.background = "linear-gradient(to bottom, #f6d365, #fda085)";
    } else {
        body.style.background = "linear-gradient(to bottom, #2c3e50, #4ca1af)";
    }
  }

  function gameLoop() {
    if (!gameActive || isPaused) return;
    moveEnemies();
    checkAppleCollision();
    checkEnemyCollision();
    checkPowerUpCollision(); 
    checkWin();
  }

  function stopAndRestartTimer(interval) {
    clearInterval(timerIntervalId);
    if (!isPaused && gameActive) {
      timerIntervalId = setInterval(updateTimerLogic, interval);
    }
  }
  
  function updateTimerLogic() {
      if (isPaused || !gameActive) return;
      timeLeft--;
      timerDisplayText.textContent = timeLeft;
      if (timeLeft <= 0) {
          clearInterval(timerIntervalId);
          showGameOver("¡Se acabó el tiempo!", `Puntuación Final: ${score}`);
      } else if (timeLeft <= 10) {
          timerDisplayText.style.color = "red";
      } else {
          timerDisplayText.style.color = "white";
      }
  }

  function spawnApples() {
    apples = []; 
    for (let i = 0; i < totalApples; i++) {
      const apple = document.createElement("div");
      apple.classList.add("apple");
      apple.textContent = "🍎"; 
      let appleX = Math.random() * (game.clientWidth - 150); 
      let appleY = Math.random() * (game.clientHeight - 100); 
      apple.style.left = appleX + "px";
      apple.style.top = appleY + "px";
      game.appendChild(apple);
      apples.push(apple);
    }
  }

  function checkAppleCollision() {
    const playerRect = player.getBoundingClientRect();
    apples.forEach((apple, index) => {
      if (!apple) return; 
      const appleRect = apple.getBoundingClientRect();
      if (
        playerRect.left < appleRect.right &&
        playerRect.right > appleRect.left &&
        playerRect.top < appleRect.bottom &&
        playerRect.bottom > appleRect.top
      ) {
        apples[index] = null; 
        applesCollected++;
        score += 100;
        applesCollectedText.textContent = applesCollected;
        scoreDisplayText.textContent = score;
        
        reproducirSonido("comer");

        if (applesCollected === totalApples) {
            tree.classList.add("tree-ready");
        }

        apple.classList.add("collected"); 
        setTimeout(() => { apple.remove(); }, 300);
      }
    });
    apples = apples.filter(a => a !== null);
  }
  
  // --- DETECCIÓN DE VICTORIA MEJORADA ---
  function checkWin() {
    const playerRect = player.getBoundingClientRect();
    const treeRect = tree.getBoundingClientRect();

    const tocaArbol = (
      playerRect.left < treeRect.right &&
      playerRect.right > treeRect.left &&
      playerRect.top < treeRect.bottom &&
      playerRect.bottom > treeRect.top
    );

    if (tocaArbol) {
      // Solo ganamos si tenemos todas las manzanas
      if (applesCollected < totalApples) {
         return; 
      }

      gameActive = false;
      clearInterval(gameLoopId);
      clearInterval(timerIntervalId); 
      
      stopMusica(); 
      
      if(!isMuted) {
        try {
            // Protección: Solo intenta reproducir 'win' si existe en audioCtx
            if (audioCtx.win) {
                audioCtx.win.currentTime = 0;
                audioCtx.win.play().catch(e=>{});
            }
        } catch(e){}
      }

      message.style.display = "flex";
      messageTitle.className = "";
      restartLevelBtn.classList.add("hidden");

      if (currentLevel < MAX_LEVELS) {
        messageTitle.textContent = "¡Nivel Completado!";
        messageText.textContent = `¡Nivel ${currentLevel} superado! Te sobraron ${timeLeft} segundos. Puntuación: ${score}`;
        nextLevelBtn.classList.remove("hidden");
      } else {
        messageTitle.textContent = "🎉 ¡Felicidades! 🎉";
        messageText.textContent = `¡Has completado el juego! Puntuación Final: ${score}`;
        nextLevelBtn.classList.add("hidden");
      }
    }
  }

  function spawnPowerUps() {
    powerUps = [];
    let slowCount = currentLevel >= 3 ? 2 : 1;
    let lifeCount = currentLevel >= 3 ? 2 : 1;
    
    for (let i = 0; i < slowCount; i++) powerUps.push(createPowerUp("slow"));
    
    if (lives < 5) {
        let actualLifeCount = Math.min(lifeCount, 5 - lives); 
        for (let i = 0; i < actualLifeCount; i++) powerUps.push(createPowerUp("life"));
    }
    
    powerUps.forEach(pu => {
      let puX, puY, isOverlap;
      do {
        isOverlap = false;
        const minDistance = 150; 
        puX = minDistance + Math.random() * (game.clientWidth - minDistance - 50); 
        puY = minDistance + Math.random() * (game.clientHeight - minDistance - 50); 
        if (apples.some(a => Math.abs(puX - parseFloat(a.style.left)) < 50 && Math.abs(puY - parseFloat(a.style.top)) < 50)) isOverlap = true;
      } while (isOverlap);
      pu.element.style.left = puX + "px";
      pu.element.style.top = puY + "px";
      game.appendChild(pu.element);
    });
  }

  function createPowerUp(type) {
    const pu = document.createElement("div");
    pu.classList.add("power-up");
    let symbol, effect;
    if (type === "slow") { symbol = "⏳"; effect = "slow"; pu.style.fontSize = "40px"; } 
    else if (type === "life") { symbol = "💖"; effect = "life"; pu.style.fontSize = "35px"; }
    pu.textContent = symbol;
    return { element: pu, type: effect };
  }

  function spawnEnemies(level) {
    let enemyCount = level; 
    for (let i = 0; i < enemyCount; i++) {
      const enemy = document.createElement("div");
      enemy.classList.add("enemy");
      enemy.textContent = "👻";
      enemy.style.left = (Math.random() * (game.clientWidth - 200) + 150) + "px"; 
      enemy.style.top = (Math.random() * (game.clientHeight - 100)) + "px";
      enemy.initialSpeed = 0.8 + (level * 0.4); 
      enemy.speed = enemy.initialSpeed;
      enemy.directionX = Math.random() < 0.5 ? 1 : -1;
      enemy.directionY = level > 1 ? (Math.random() < 0.5 ? 1 : -1) : 0;
      game.appendChild(enemy);
      enemies.push(enemy);
    }
  }
  
  function moveEnemies() {
    const speedFactor = isEnemiesSlowed ? 0.2 : 1; 
    enemies.forEach(enemy => {
      let currentLeft = parseFloat(enemy.style.left);
      let currentTop = parseFloat(enemy.style.top);
      let newLeft = currentLeft + (enemy.initialSpeed * enemy.directionX * speedFactor);
      let newTop = currentTop + (enemy.initialSpeed * enemy.directionY * speedFactor);

      if (isEnemiesSlowed) enemy.classList.add("slowed");
      else enemy.classList.remove("slowed");
      
      if (newLeft <= 0 || newLeft >= (game.clientWidth - 35)) {
        enemy.directionX *= -1;
        enemy.style.transform = `scaleX(${enemy.directionX})`;
      }
      if (newTop <= 0 || newTop >= (game.clientHeight - 35)) enemy.directionY *= -1;
      
      enemy.style.left = newLeft + "px";
      enemy.style.top = newTop + "px";
    });
  }

  function movePlayer() {
    player.style.left = posX + "px";
    player.style.bottom = posY + "px"; 
  }

  function checkPowerUpCollision() {
    const playerRect = player.getBoundingClientRect();
    powerUps.forEach((puObj, index) => {
      if (!puObj) return; 
      const puRect = puObj.element.getBoundingClientRect();
      if (
        playerRect.left < puRect.right && playerRect.right > puRect.left &&
        playerRect.top < puRect.bottom && playerRect.bottom > puRect.top
      ) {
        powerUps[index] = null; 
        puObj.element.classList.add("collected");
        reproducirSonido("powerup");
        applyPowerUpEffect(puObj.type); 
        setTimeout(() => { puObj.element.remove(); }, 300);
      }
    });
    powerUps = powerUps.filter(pu => pu !== null);
  }

  function applyPowerUpEffect(type) {
    if (type === "slow") {
      isEnemiesSlowed = true; 
      timerSlowedFactor = 0.2;
      stopAndRestartTimer(1000 / timerSlowedFactor); 
      setTimeout(() => {
        isEnemiesSlowed = false;
        timerSlowedFactor = 1;
        if (!isPaused && gameActive) stopAndRestartTimer(1000); 
      }, POWER_UP_SLOW_DURATION);
    } else if (type === "life") {
      if (lives < 5) { lives++; livesText.textContent = lives; }
    }
  }

  function checkEnemyCollision() {
    if (isInvincible) return;
    const playerRect = player.getBoundingClientRect();
    enemies.forEach(enemy => {
      const enemyRect = enemy.getBoundingClientRect();
      if (
        playerRect.left < enemyRect.right && playerRect.right > enemyRect.left &&
        playerRect.top < enemyRect.bottom && playerRect.bottom > enemyRect.top
      ) handlePlayerHit();
    });
  }
  
  function handlePlayerHit() {
    if (isInvincible) return;
    lives--;
    livesText.textContent = lives;
    score = Math.max(0, score - 50); 
    scoreDisplayText.textContent = score;
    reproducirSonido("dano");
    isInvincible = true;
    player.classList.add("blinking");
    setTimeout(() => { isInvincible = false; player.classList.remove("blinking"); }, 2000); 
    if (lives <= 0) showGameOver("GAME OVER", `¡Los fantasmas te atraparon! Puntuación Final: ${score}`);
    else { posX = 20; posY = 20; movePlayer(); }
  }
  
  function showGameOver(title, text) {
    gameActive = false;
    clearInterval(gameLoopId);
    clearInterval(timerIntervalId); 
    stopMusica(); 
    
    if(!isMuted) {
        // --- BUCLE DE GAME OVER ---
        try {
            if (audioCtx.gameover) {
                audioCtx.gameover.loop = true; 
                audioCtx.gameover.currentTime = 0;
                audioCtx.gameover.play().catch(e=>{});
            }
        } catch(e){}
    }

    message.style.display = "flex";
    messageTitle.textContent = title;
    messageTitle.className = "game-over-title";
    messageText.textContent = text;
    nextLevelBtn.classList.add("hidden");
    restartLevelBtn.classList.remove("hidden");
  }

  function togglePause() {
    isPaused = !isPaused;
    if (isPaused) {
      pauseOverlay.classList.remove("hidden");
      btnPause.textContent = "Reanudar";
      clearInterval(timerIntervalId); 
      if (audioCtx.gameMusic) audioCtx.gameMusic.pause();
    } else {
      pauseOverlay.classList.add("hidden");
      btnPause.textContent = "Pausar";
      stopAndRestartTimer(1000 / timerSlowedFactor);
      if(!isMuted && audioCtx.gameMusic) audioCtx.gameMusic.play().catch(e=>{});
    }
  }
  
  function restartCurrentLevel() {
    gameActive = true;
    isPaused = false;
    timeLeft = INITIAL_TIME_PER_LEVEL + (currentLevel - 1) * 10;
    startGame(currentLevel);
  }

  // --- Funciones de Audio ---
  function reproducirSonido(efecto) {
    if (isMuted) return;
    try {
        if(audioCtx[efecto]) {
            const sonido = audioCtx[efecto].cloneNode(); 
            sonido.volume = audioCtx[efecto].volume; 
            const playPromise = sonido.play();
            if (playPromise !== undefined) playPromise.catch(error => {});
        }
    } catch (e) { }
  }

  function cambiarMusica(tipo) {
    if (isMuted) return;
    try {
        audioCtx.menuMusic.pause();
        audioCtx.menuMusic.currentTime = 0;
        audioCtx.gameMusic.pause();
        audioCtx.gameMusic.currentTime = 0;

        if (tipo === "menu") {
            audioCtx.menuMusic.play().catch(e=>{});
        } else if (tipo === "juego") {
            audioCtx.gameMusic.play().catch(e=>{});
        }
    } catch(e) { }
  }

  function stopMusica() {
    try {
        audioCtx.menuMusic.pause();
        audioCtx.gameMusic.pause();
    } catch(e){}
  }

  function actualizarVolumen(valor) {
    try { Object.values(audioCtx).forEach(audio => { if(audio) audio.volume = valor; }); } catch(e) {}
  }

  function alternarMute() {
    isMuted = !isMuted;
    if (isMuted) {
      btnMute.textContent = "🔇";
      stopMusica();
      if(audioCtx.gameover) audioCtx.gameover.pause();
      if(audioCtx.win) audioCtx.win.pause();
    } else {
      btnMute.textContent = "🔊";
      if (gameActive && !isPaused) {
        cambiarMusica("juego");
      } else if (!gameActive) {
        cambiarMusica("menu");
      }
    }
  }

  // --- Event Listeners ---
  function showHelpMenu() {
    mainMenu.classList.add("hidden");
    helpMenu.classList.remove("hidden");
  }
  function hideHelpMenu() {
    helpMenu.classList.add("hidden");
    mainMenu.classList.remove("hidden");
  }

  btnJugar.addEventListener("click", () => startGame(1));
  btnAyuda.addEventListener("click", showHelpMenu);
  btnCerrarAyuda.addEventListener("click", hideHelpMenu);
  btnSalir.addEventListener("click", () => console.log("Gracias por jugar"));
  
  btnPause.addEventListener("click", (e) => { togglePause(); e.target.blur(); });
  btnRestartGame.addEventListener("click", (e) => { restartCurrentLevel(); e.target.blur(); });
  btnSalirJuego.addEventListener("click", showMainMenu);
  restartBtn.addEventListener("click", showMainMenu);
  nextLevelBtn.addEventListener("click", () => startGame(currentLevel + 1));
  restartLevelBtn.addEventListener("click", restartCurrentLevel); 

  btnMute.addEventListener("click", (e) => { alternarMute(); e.target.blur(); });
  volumenSlider.addEventListener("input", (e) => { actualizarVolumen(e.target.value); });
  volumenSlider.addEventListener("change", (e) => { e.target.blur(); });

  document.addEventListener("keydown", (e) => {
    if (document.activeElement.tagName === "INPUT") document.activeElement.blur();
    if (!gameActive || isPaused) {
      if (e.key === "p" || e.key === "P") togglePause();
      return;
    }
    switch (e.key) {
      case "ArrowUp": posY = Math.min(game.clientHeight - 50, posY + playerSpeed); break;
      case "ArrowDown": posY = Math.max(0, posY - playerSpeed); break;
      case "ArrowLeft": posX = Math.max(0, posX - playerSpeed); player.style.transform = "scaleX(-1)"; break;
      case "ArrowRight": posX = Math.min(game.clientWidth - 50, posX + playerSpeed); player.style.transform = "scaleX(1)"; break;
      case "p": case "P": togglePause(); break;
    }
    movePlayer();
  });

  document.body.addEventListener('click', () => {
    if (!gameActive && audioCtx.menuMusic.paused && !isMuted) {
       cambiarMusica("menu");
    }
  }, { once: true });

  showMainMenu();
});