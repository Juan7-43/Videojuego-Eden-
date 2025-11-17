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

  // Controles
  const gameControls = document.getElementById("game-controls");
  const btnPause = document.getElementById("btn-pause");
  const btnRestartGame = document.getElementById("btn-restart-game");
  const btnSalirJuego = document.getElementById("btn-salir-juego");

  // Mensajes y Overlays
  const message = document.getElementById("message");
  const messageTitle = document.getElementById("message-title");
  const messageText = document.getElementById("message-text");
  const restartBtn = document.getElementById("restart");
  const nextLevelBtn = document.getElementById("next-level-btn");
  const restartLevelBtn = document.getElementById("restart-level-btn");
  const pauseOverlay = document.getElementById("pause-overlay");

  // Menús
  const mainMenu = document.getElementById("main-menu");
  const helpMenu = document.getElementById("help-menu");
  const btnJugar = document.getElementById("btn-jugar");
  const btnAyuda = document.getElementById("btn-ayuda");
  const btnSalir = document.getElementById("btn-salir");
  const btnCerrarAyuda = document.getElementById("btn-cerrar-ayuda");

  // --- 2. Variables del Juego ---
  const MAX_LEVELS = 5;
  // Constantes para Power-ups y Temporización
  const POWER_UP_SLOW_DURATION = 5000; // 5 segundos de duración del efecto
  const POWER_UP_CHANCE = 0.3; // 30% de probabilidad de generar un power-up
  const INITIAL_TIME_PER_LEVEL = 60; // 60 segundos base
  
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
  let timerSlowedFactor = 1; // Factor de ralentización del tiempo: 1 = normal, 0.2 = 5 veces más lento

  let gameLoopId;
  let timerIntervalId;
  let timeLeft = INITIAL_TIME_PER_LEVEL;
  
  // Función auxiliar para detener y reiniciar el temporizador con un nuevo intervalo
  function stopAndRestartTimer(interval) {
    clearInterval(timerIntervalId);
    if (!isPaused && gameActive) {
      // El intervalo pasado (en milisegundos) determina la velocidad real del contador
      timerIntervalId = setInterval(updateTimerLogic, interval);
    }
  }
  
  // Función principal de lógica del temporizador (resta 1 segundo de tiempo de juego)
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
  
  // --- 3. Funciones Principales (Menú y Estado) ---
  
  function startGame(level) {
    gameActive = true;
    isPaused = false;
    currentLevel = level;
    
    // Configuración por nivel
    totalApples = 5 + (currentLevel - 1) * 2;
    playerSpeed = 18 + (currentLevel * 2);
    timeLeft = INITIAL_TIME_PER_LEVEL + (currentLevel - 1) * 10; // Más tiempo por nivel
    
    resetLevelState(); 
    
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

    // Iniciar Game Loop
    clearInterval(gameLoopId);
    gameLoopId = setInterval(gameLoop, 1000 / 60);

    // Iniciar Temporizador a velocidad normal (1000ms = 1s)
    stopAndRestartTimer(1000); 
  }

  function showMainMenu() {
    gameActive = false;
    clearInterval(gameLoopId);
    clearInterval(timerIntervalId); 
    
    hud.classList.add("hidden");
    game.classList.add("hidden");
    gameControls.classList.add("hidden");
    helpMenu.classList.add("hidden");
    message.style.display = "none";
    pauseOverlay.classList.add("hidden");
    
    mainMenu.classList.remove("hidden");
  }
  
  function togglePause() {
    isPaused = !isPaused;
    
    if (isPaused) {
      pauseOverlay.classList.remove("hidden");
      btnPause.textContent = "Reanudar";
      clearInterval(timerIntervalId); 
    } else {
      pauseOverlay.classList.add("hidden");
      btnPause.textContent = "Pausar";
      // Reanudar el temporizador a la velocidad actual (normal o lenta)
      stopAndRestartTimer(1000 / timerSlowedFactor);
    }
  }

  function restartCurrentLevel() {
    gameActive = true;
    isPaused = false;
    
    // Restablecer el tiempo antes de llamar a startGame para recalcular el tiempo del nivel
    timeLeft = INITIAL_TIME_PER_LEVEL + (currentLevel - 1) * 10;
    
    startGame(currentLevel); // Reutilizamos startGame
  }
  
  function resetLevelState() {
    score = 0;
    applesCollected = 0;
    lives = 3;
    isInvincible = false;
    isEnemiesSlowed = false; 
    timerSlowedFactor = 1; // Asegurar que el tiempo es normal al iniciar

    player.classList.remove("blinking");
    
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


  // --- Game Loop ---
  function gameLoop() {
    if (!gameActive || isPaused) {
      return;
    }
    moveEnemies();
    checkAppleCollision();
    checkEnemyCollision();
    checkPowerUpCollision(); 
    checkWin();
  }

  // --- 4. Funciones del Juego ---

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
  
  function spawnPowerUps() {
    powerUps = [];
    
    // Decidir cuántos power-ups generar (uno o dos)
    if (Math.random() < POWER_UP_CHANCE * 2) { 
        powerUps.push(createPowerUp("slow")); // Reloj
    }
    if (lives < 5 && Math.random() < POWER_UP_CHANCE) {
        powerUps.push(createPowerUp("life")); // Corazón (máx. 5 vidas)
    }

    powerUps.forEach(pu => {
      let puX, puY;
      let isOverlap;
      
      do {
        isOverlap = false;
        puX = Math.random() * (game.clientWidth - 50); 
        puY = Math.random() * (game.clientHeight - 50); 

        if (apples.some(apple => {
            const appleX = parseFloat(apple.style.left);
            const appleY = parseFloat(apple.style.top);
            return Math.abs(puX - appleX) < 50 && Math.abs(puY - appleY) < 50;
        })) {
            isOverlap = true;
        }
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

    if (type === "slow") {
      symbol = "⏳";
      effect = "slow";
      pu.style.fontSize = "40px";
    } else if (type === "life") {
      symbol = "💖";
      effect = "life";
      pu.style.fontSize = "35px";
    }

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
      
      enemy.initialSpeed = 0.8 + (level * 0.4); // Velocidad base
      enemy.speed = enemy.initialSpeed;
      
      enemy.directionX = Math.random() < 0.5 ? 1 : -1;
      
      if (level > 1) {
        enemy.directionY = Math.random() < 0.5 ? 1 : -1;
      } else {
        enemy.directionY = 0;
      }
      
      game.appendChild(enemy);
      enemies.push(enemy);
    }
  }
  
  function moveEnemies() {
    const speedFactor = isEnemiesSlowed ? 0.2 : 1; // 20% de la velocidad normal
    
    enemies.forEach(enemy => {
      let currentLeft = parseFloat(enemy.style.left);
      let currentTop = parseFloat(enemy.style.top);
      
      let newLeft = currentLeft + (enemy.initialSpeed * enemy.directionX * speedFactor);
      let newTop = currentTop + (enemy.initialSpeed * enemy.directionY * speedFactor);

      if (isEnemiesSlowed) {
        enemy.classList.add("slowed");
      } else {
        enemy.classList.remove("slowed");
      }
      
      // Rebotar en bordes horizontales
      if (newLeft <= 0 || newLeft >= (game.clientWidth - 35)) {
        enemy.directionX *= -1;
        enemy.style.transform = `scaleX(${enemy.directionX})`;
      }
      
      // Rebotar en bordes verticales
      if (newTop <= 0 || newTop >= (game.clientHeight - 35)) {
        enemy.directionY *= -1;
      }
      
      enemy.style.left = newLeft + "px";
      enemy.style.top = newTop + "px";
    });
  }

  function movePlayer() {
    player.style.left = posX + "px";
    player.style.bottom = posY + "px"; 
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
        
        apple.classList.add("collected"); 
        
        setTimeout(() => {
          apple.remove(); 
        }, 300);
      }
    });
    
    apples = apples.filter(a => a !== null);
  }
  
  function checkPowerUpCollision() {
    const playerRect = player.getBoundingClientRect();
    powerUps.forEach((puObj, index) => {
      if (!puObj) return; 
      
      const puElement = puObj.element;
      const puRect = puElement.getBoundingClientRect();
      
      if (
        playerRect.left < puRect.right &&
        playerRect.right > puRect.left &&
        playerRect.top < puRect.bottom &&
        playerRect.bottom > puRect.top
      ) {
        powerUps[index] = null; 
        
        puElement.classList.add("collected");
        
        applyPowerUpEffect(puObj.type); 
        
        setTimeout(() => {
          puElement.remove(); 
        }, 300);
      }
    });
    
    powerUps = powerUps.filter(pu => pu !== null);
  }

  function applyPowerUpEffect(type) {
    if (type === "slow") {
      isEnemiesSlowed = true; // 1. Ralentiza enemigos
      
      // 2. Ralentizar el temporizador (Intervalo de 5000ms = 5s)
      timerSlowedFactor = 0.2;
      stopAndRestartTimer(1000 / timerSlowedFactor); 

      // Desactivar el efecto después de 5 segundos
      setTimeout(() => {
        isEnemiesSlowed = false;
        
        // Restaurar el temporizador a la velocidad normal (1000ms = 1s)
        timerSlowedFactor = 1;
        if (!isPaused && gameActive) {
            stopAndRestartTimer(1000); 
        }
        
      }, POWER_UP_SLOW_DURATION);
      
    } else if (type === "life") {
      if (lives < 5) { 
        lives++;
        livesText.textContent = lives;
      }
    }
  }

  function checkEnemyCollision() {
    if (isInvincible) return;

    const playerRect = player.getBoundingClientRect();
    enemies.forEach(enemy => {
      const enemyRect = enemy.getBoundingClientRect();
      if (
        playerRect.left < enemyRect.right &&
        playerRect.right > enemyRect.left &&
        playerRect.top < enemyRect.bottom &&
        playerRect.bottom > enemyRect.top
      ) {
        handlePlayerHit();
      }
    });
  }
  
  function handlePlayerHit() {
    if (isInvincible) return;

    lives--;
    livesText.textContent = lives;
    
    score = Math.max(0, score - 50); 
    scoreDisplayText.textContent = score;
    
    isInvincible = true;
    player.classList.add("blinking");
    
    setTimeout(() => {
      isInvincible = false;
      player.classList.remove("blinking");
    }, 2000); 

    if (lives <= 0) {
      showGameOver("GAME OVER", `¡Los fantasmas te atraparon! Puntuación Final: ${score}`);
    } else {
      posX = 20;
      posY = 20;
      movePlayer();
    }
  }
  
  function showGameOver(title, text) {
    gameActive = false;
    clearInterval(gameLoopId);
    clearInterval(timerIntervalId); 

    message.style.display = "flex";
    messageTitle.textContent = title;
    messageTitle.className = "game-over-title";
    messageText.textContent = text;
    
    nextLevelBtn.classList.add("hidden");
    restartLevelBtn.classList.remove("hidden");
  }

  function checkWin() {
    const playerRect = player.getBoundingClientRect();
    const treeRect = tree.getBoundingClientRect();

    if (
      applesCollected === totalApples &&
      playerRect.left < treeRect.right &&
      playerRect.right > treeRect.left &&
      playerRect.top < treeRect.bottom &&
      playerRect.bottom > treeRect.top
    ) {
      gameActive = false;
      clearInterval(gameLoopId);
      clearInterval(timerIntervalId); 

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

  // --- 5. Event Listeners (Controladores) ---
  
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
  btnSalir.addEventListener("click", () => {
    console.log("¡Gracias por jugar! Cierra la pestaña para salir.");
  });

  btnPause.addEventListener("click", togglePause);
  btnRestartGame.addEventListener("click", restartCurrentLevel);
  btnSalirJuego.addEventListener("click", showMainMenu);
  restartBtn.addEventListener("click", showMainMenu);
  nextLevelBtn.addEventListener("click", () => startGame(currentLevel + 1));
  restartLevelBtn.addEventListener("click", restartCurrentLevel); 

  document.addEventListener("keydown", (e) => {
    if (!gameActive || isPaused) {
      if (e.key === "p" || e.key === "P") {
        togglePause();
      }
      return;
    }
    
    switch (e.key) {
      case "ArrowUp":
        posY = Math.min(game.clientHeight - 50, posY + playerSpeed);
        break;
      case "ArrowDown":
        posY = Math.max(0, posY - playerSpeed);
        break;
      case "ArrowLeft":
        posX = Math.max(0, posX - playerSpeed);
        player.style.transform = "scaleX(-1)";
        break;
      case "ArrowRight":
        posX = Math.min(game.clientWidth - 50, posX + playerSpeed);
        player.style.transform = "scaleX(1)";
        break;
      case "p":
      case "P":
        togglePause();
        break;
    }
    movePlayer();
  });

  showMainMenu();
});