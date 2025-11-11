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
  let currentLevel = 1;
  let totalApples = 5;
  let apples = [];
  let enemies = [];
  let lives = 3;
  
  let score = 0;
  let applesCollected = 0;
  
  let posX = 20; 
  let posY = 20;
  
  let playerSpeed = 10;
  let gameActive = false;
  let isPaused = false;
  let isInvincible = false;
  let gameLoopId;

  // --- 3. Funciones Principales (Menú y Estado) ---
  
  function startGame(level) {
    gameActive = true;
    isPaused = false;
    currentLevel = level;
    
    totalApples = 5 + (currentLevel - 1) * 2;
    playerSpeed = 18 + (currentLevel * 2);
    
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
    
    movePlayer(); 

    clearInterval(gameLoopId);
    gameLoopId = setInterval(gameLoop, 1000 / 60);
  }

  function showMainMenu() {
    gameActive = false;
    clearInterval(gameLoopId);
    
    hud.classList.add("hidden");
    game.classList.add("hidden");
    gameControls.classList.add("hidden");
    helpMenu.classList.add("hidden");
    message.style.display = "none";
    pauseOverlay.classList.add("hidden");
    
    mainMenu.classList.remove("hidden");
  }

  function showHelpMenu() {
    mainMenu.classList.add("hidden");
    helpMenu.classList.remove("hidden");
  }
  
  function hideHelpMenu() {
    helpMenu.classList.add("hidden");
    mainMenu.classList.remove("hidden");
  }

  // --- Funciones de Control ---
  function togglePause() {
    isPaused = !isPaused;
    
    if (isPaused) {
      pauseOverlay.classList.remove("hidden");
      btnPause.textContent = "Reanudar";
    } else {
      pauseOverlay.classList.add("hidden");
      btnPause.textContent = "Pausar";
    }
  }

  function restartCurrentLevel() {
    gameActive = true;
    isPaused = false;
    
    message.style.display = "none"; // Corrige el error de "Jugar de Nuevo"
    
    pauseOverlay.classList.add("hidden");
    btnPause.textContent = "Pausar";
    
    resetLevelState();
    spawnApples();
    spawnEnemies(currentLevel);
    movePlayer();
    
    clearInterval(gameLoopId);
    gameLoopId = setInterval(gameLoop, 1000 / 60);
  }
  
  function resetLevelState() {
    score = 0;
    applesCollected = 0;
    lives = 3;
    isInvincible = false;
    player.classList.remove("blinking");
    
    scoreDisplayText.textContent = score;
    applesCollectedText.textContent = applesCollected;
    
    livesText.textContent = lives;
    requiredApplesText.textContent = totalApples;
    currentLevelText.textContent = currentLevel;
    
    posX = 20;
    posY = 20; 
    player.style.transform = "scaleX(1)";
    
    document.querySelectorAll(".apple").forEach(a => a.remove());
    apples = [];
    document.querySelectorAll(".enemy").forEach(e => e.remove());
    enemies = [];
  }

  // --- Game Loop ---
  function gameLoop() {
    if (!gameActive || isPaused) {
      return;
    }
    moveEnemies();
    checkAppleCollision();
    checkEnemyCollision();
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
  
  function spawnEnemies(level) {
    // CAMBIO: Nivel 1 = 1 fantasma, Nivel 2 = 2 fantasmas...
    let enemyCount = level; 
    
    for (let i = 0; i < enemyCount; i++) {
      const enemy = document.createElement("div");
      enemy.classList.add("enemy");
      enemy.textContent = "👻";
      
      enemy.style.left = (Math.random() * (game.clientWidth - 200) + 150) + "px"; 
      enemy.style.top = (Math.random() * (game.clientHeight - 100)) + "px";
      
      enemy.speed = 0.8 + (level * 0.4); // Velocidad lenta
      
      enemy.directionX = Math.random() < 0.5 ? 1 : -1;
      
      if (level > 1) {
        // Nivel 2 y superior: movimiento en todas direcciones
        enemy.directionY = Math.random() < 0.5 ? 1 : -1;
      } else {
        // Nivel 1: solo movimiento horizontal
        enemy.directionY = 0;
      }
      
      game.appendChild(enemy);
      enemies.push(enemy);
    }
  }
  
  function moveEnemies() {
    enemies.forEach(enemy => {
      let currentLeft = parseFloat(enemy.style.left);
      let currentTop = parseFloat(enemy.style.top);
      
      let newLeft = currentLeft + (enemy.speed * enemy.directionX);
      let newTop = currentTop + (enemy.speed * enemy.directionY);

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
      if (!apple) return; // Ya está siendo recogida
      
      const appleRect = apple.getBoundingClientRect();
      if (
        playerRect.left < appleRect.right &&
        playerRect.right > appleRect.left &&
        playerRect.top < appleRect.bottom &&
        playerRect.bottom > appleRect.top
      ) {
        apples[index] = null; // Marcar para que no se vuelva a colisionar
        
        applesCollected++;
        score += 100;
        
        applesCollectedText.textContent = applesCollected;
        scoreDisplayText.textContent = score;
        
        apple.classList.add("collected"); // Activar animación CSS
        
        // Quitar del DOM después de la animación
        setTimeout(() => {
          apple.remove(); 
        }, 300);
      }
    });
    
    apples = apples.filter(a => a !== null);
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
    
    score = Math.max(0, score - 50); // Restar 50 puntos
    scoreDisplayText.textContent = score;
    
    isInvincible = true;
    player.classList.add("blinking");
    
    setTimeout(() => {
      isInvincible = false;
      player.classList.remove("blinking");
    }, 2000); // 2 segundos de invencibilidad

    if (lives <= 0) {
      showGameOver();
    } else {
      posX = 20;
      posY = 20;
      movePlayer();
    }
  }
  
  function showGameOver() {
    gameActive = false;
    message.style.display = "flex";
    messageTitle.textContent = "GAME OVER";
    messageTitle.className = "game-over-title";
    messageText.textContent = `¡Los fantasmas te atraparon! Puntuación Final: ${score}`;
    
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
      message.style.display = "flex";
      messageTitle.className = "";
      restartLevelBtn.classList.add("hidden");

      if (currentLevel < MAX_LEVELS) {
        messageTitle.textContent = "¡Nivel Completado!";
        messageText.textContent = `¡Nivel ${currentLevel} superado! Puntuación: ${score}`;
        nextLevelBtn.classList.remove("hidden");
      } else {
        messageTitle.textContent = "🎉 ¡Felicidades! 🎉";
        messageText.textContent = `¡Has completado el juego! Puntuación Final: ${score}`;
        nextLevelBtn.classList.add("hidden");
      }
    }
  }

  // --- 5. Event Listeners (Controladores) ---
  
  btnJugar.addEventListener("click", () => startGame(1));
  btnAyuda.addEventListener("click", showHelpMenu);
  btnCerrarAyuda.addEventListener("click", hideHelpMenu);
  btnSalir.addEventListener("click", () => {
    alert("¡Gracias por jugar! Cierra la pestaña para salir.");
  });

  btnPause.addEventListener("click", togglePause);
  btnRestartGame.addEventListener("click", restartCurrentLevel);
  btnSalirJuego.addEventListener("click", showMainMenu);
  restartBtn.addEventListener("click", showMainMenu);
  nextLevelBtn.addEventListener("click", () => startGame(currentLevel + 1));
  restartLevelBtn.addEventListener("click", restartCurrentLevel); 

  document.addEventListener("keydown", (e) => {
    if (!gameActive || isPaused) {
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
    }
    movePlayer();
  });

  showMainMenu();
});

