import React, { useRef, useEffect, useState, useCallback } from 'react';
import './TrashBandidegenGame.css';

const TrashBandidegenGame = ({ onGameEnd, onScoreUpdate }) => {
  const canvasRef = useRef(null);
  const gameLoopRef = useRef(null);
  const keysRef = useRef({});
  
  // Game state
  const [gameState, setGameState] = useState('menu'); // menu, playing, paused, gameOver
  const [score, setScore] = useState(0);
  const [distance, setDistance] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameSpeed, setGameSpeed] = useState(4);
  const [powerUps, setPowerUps] = useState({});
  
  // Game objects
  const gameObjects = useRef({
    player: {
      x: 200,
      y: 300,
      z: 0,
      lane: 1, // 0, 1, or 2 (left, center, right)
      targetX: 200,
      width: 40,
      height: 60,
      velocityY: 0,
      isJumping: false,
      isSliding: false,
      isSpinning: false,
      spinAngle: 0,
      invulnerable: false,
      invulnerableTime: 0
    },
    obstacles: [],
    collectibles: [],
    particles: [],
    powerUps: []
  });
  
  // Game constants
  const LANES = [120, 200, 280]; // X positions for 3 lanes
  const GRAVITY = 0.8;
  const JUMP_FORCE = -15;
  const GROUND_Y = 300;
  const SLIDE_Y = 320;
  
  // Collectible types with different values and rarities
  const COLLECTIBLE_TYPES = {
    BASIC: { value: 10, color: '#8B4513', glow: '#D2691E', rarity: 0.5 },
    SILVER: { value: 25, color: '#C0C0C0', glow: '#E6E6FA', rarity: 0.25 },
    GOLD: { value: 50, color: '#FFD700', glow: '#FFFF00', rarity: 0.15 },
    DIAMOND: { value: 100, color: '#B9F2FF', glow: '#00FFFF', rarity: 0.08 },
    LEGENDARY: { value: 250, color: '#FF69B4', glow: '#FF1493', rarity: 0.02 }
  };
  
  // Power-up types
  const POWERUP_TYPES = {
    SPEED_BOOST: { duration: 5000, color: '#FF4500', effect: 'speedBoost' },
    COIN_MAGNET: { duration: 8000, color: '#32CD32', effect: 'coinMagnet' },
    SCORE_MULTIPLIER: { duration: 10000, color: '#9370DB', effect: 'scoreMultiplier' },
    INVINCIBILITY: { duration: 6000, color: '#FFD700', effect: 'invincibility' },
    DOUBLE_JUMP: { duration: 15000, color: '#00CED1', effect: 'doubleJump' }
  };

  // Initialize game
  const initGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    canvas.width = 400;
    canvas.height = 600;
    
    // Reset game state
    setScore(0);
    setDistance(0);
    setLives(3);
    setGameSpeed(4);
    setPowerUps({});
    
    // Reset game objects
    gameObjects.current = {
      player: {
        x: 200,
        y: GROUND_Y,
        z: 0,
        lane: 1,
        targetX: LANES[1],
        width: 40,
        height: 60,
        velocityY: 0,
        isJumping: false,
        isSliding: false,
        isSpinning: false,
        spinAngle: 0,
        invulnerable: false,
        invulnerableTime: 0
      },
      obstacles: [],
      collectibles: [],
      particles: [],
      powerUps: []
    };
  }, []);

  // Handle keyboard input
  const handleKeyDown = useCallback((e) => {
    keysRef.current[e.key.toLowerCase()] = true;
    
    if (gameState === 'playing') {
      const player = gameObjects.current.player;
      
      switch (e.key.toLowerCase()) {
        case 'arrowleft':
        case 'a':
          if (player.lane > 0) {
            player.lane--;
            player.targetX = LANES[player.lane];
          }
          break;
        case 'arrowright':
        case 'd':
          if (player.lane < 2) {
            player.lane++;
            player.targetX = LANES[player.lane];
          }
          break;
        case 'arrowup':
        case 'w':
        case ' ':
          if (!player.isJumping && !player.isSliding) {
            player.isJumping = true;
            player.velocityY = JUMP_FORCE;
          } else if (powerUps.doubleJump && player.isJumping && player.velocityY > -5) {
            player.velocityY = JUMP_FORCE * 0.8; // Weaker second jump
          }
          e.preventDefault();
          break;
        case 'arrowdown':
        case 's':
          if (!player.isJumping) {
            player.isSliding = true;
            player.y = SLIDE_Y;
            setTimeout(() => {
              if (!player.isJumping) {
                player.isSliding = false;
                player.y = GROUND_Y;
              }
            }, 600);
          }
          break;
        case 'x':
        case 'shift':
          player.isSpinning = true;
          setTimeout(() => { player.isSpinning = false; }, 500);
          break;
      }
    }
  }, [gameState, powerUps]);

  const handleKeyUp = useCallback((e) => {
    keysRef.current[e.key.toLowerCase()] = false;
  }, []);

  // Game physics and logic
  const updateGame = useCallback(() => {
    if (gameState !== 'playing') return;
    
    const objects = gameObjects.current;
    const player = objects.player;
    
    // Update distance and score
    const newDistance = distance + gameSpeed;
    setDistance(newDistance);
    
    // Progressive difficulty
    const newSpeed = 4 + Math.floor(newDistance / 1000) * 0.5;
    setGameSpeed(Math.min(newSpeed, 12));
    
    // Update player position
    player.x += (player.targetX - player.x) * 0.15; // Smooth lane transition
    
    // Handle jumping physics
    if (player.isJumping) {
      player.velocityY += GRAVITY;
      player.y += player.velocityY;
      
      if (player.y >= (player.isSliding ? SLIDE_Y : GROUND_Y)) {
        player.y = player.isSliding ? SLIDE_Y : GROUND_Y;
        player.isJumping = false;
        player.velocityY = 0;
      }
    }
    
    // Handle spin animation
    if (player.isSpinning) {
      player.spinAngle += 20;
      if (player.spinAngle >= 360) {
        player.spinAngle = 0;
      }
    }
    
    // Update invulnerability
    if (player.invulnerable) {
      player.invulnerableTime -= 16; // ~60fps
      if (player.invulnerableTime <= 0) {
        player.invulnerable = false;
      }
    }
    
    // Spawn obstacles
    if (Math.random() < 0.02 + (gameSpeed / 200)) {
      spawnObstacle();
    }
    
    // Spawn collectibles
    if (Math.random() < 0.05) {
      spawnCollectible();
    }
    
    // Spawn power-ups
    if (Math.random() < 0.008) {
      spawnPowerUp();
    }
    
    // Update obstacles
    objects.obstacles = objects.obstacles.filter(obstacle => {
      obstacle.y += gameSpeed * (powerUps.speedBoost ? 1.5 : 1);
      
      // Collision detection
      if (!player.invulnerable && 
          player.x < obstacle.x + obstacle.width &&
          player.x + player.width > obstacle.x &&
          player.y < obstacle.y + obstacle.height &&
          player.y + player.height > obstacle.y) {
        
        if (player.isSpinning && obstacle.destructible) {
          // Destroy obstacle with spin attack
          addParticleExplosion(obstacle.x, obstacle.y, obstacle.color);
          setScore(prev => prev + 25);
          return false;
        } else if (powerUps.invincibility) {
          // Bounce off with invincibility
          addParticleExplosion(obstacle.x, obstacle.y, '#FFD700');
          return false;
        } else {
          // Take damage
          handlePlayerHit();
          return false;
        }
      }
      
      return obstacle.y < 650; // Remove off-screen obstacles
    });
    
    // Update collectibles
    objects.collectibles = objects.collectibles.filter(collectible => {
      collectible.y += gameSpeed;
      collectible.rotation += 5;
      
      // Coin magnet effect
      if (powerUps.coinMagnet) {
        const dx = player.x - collectible.x;
        const dy = player.y - collectible.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 100) {
          collectible.x += dx * 0.1;
          collectible.y += dy * 0.1;
        }
      }
      
      // Collision detection
      if (player.x < collectible.x + collectible.size &&
          player.x + player.width > collectible.x &&
          player.y < collectible.y + collectible.size &&
          player.y + player.height > collectible.y) {
        
        // Collect coin
        const baseValue = collectible.value;
        const multiplier = powerUps.scoreMultiplier ? 2 : 1;
        const points = baseValue * multiplier;
        
        setScore(prev => prev + points);
        addParticleExplosion(collectible.x, collectible.y, collectible.glow, true);
        
        return false;
      }
      
      return collectible.y < 650;
    });
    
    // Update power-ups
    objects.powerUps = objects.powerUps.filter(powerUp => {
      powerUp.y += gameSpeed;
      powerUp.rotation += 3;
      
      // Collision detection
      if (player.x < powerUp.x + powerUp.size &&
          player.x + player.width > powerUp.x &&
          player.y < powerUp.y + powerUp.size &&
          player.y + player.height > powerUp.y) {
        
        // Activate power-up
        activatePowerUp(powerUp.type);
        addParticleExplosion(powerUp.x, powerUp.y, powerUp.color, true);
        
        return false;
      }
      
      return powerUp.y < 650;
    });
    
    // Update particles
    objects.particles = objects.particles.filter(particle => {
      particle.x += particle.velocityX;
      particle.y += particle.velocityY;
      particle.velocityY += 0.2; // Gravity
      particle.life -= 1;
      particle.alpha = particle.life / particle.maxLife;
      
      return particle.life > 0;
    });
    
    // Update power-up timers
    const newPowerUps = { ...powerUps };
    Object.keys(newPowerUps).forEach(key => {
      newPowerUps[key] -= 16;
      if (newPowerUps[key] <= 0) {
        delete newPowerUps[key];
      }
    });
    setPowerUps(newPowerUps);
    
    // Update score callback
    if (onScoreUpdate) {
      onScoreUpdate(score);
    }
    
  }, [gameState, distance, gameSpeed, score, powerUps, onScoreUpdate]);

  // Spawn game objects
  const spawnObstacle = () => {
    const lane = Math.floor(Math.random() * 3);
    const types = [
      { width: 40, height: 40, color: '#8B0000', destructible: false },
      { width: 60, height: 30, color: '#4B0082', destructible: true },
      { width: 35, height: 80, color: '#006400', destructible: false },
      { width: 50, height: 25, color: '#FF4500', destructible: true, moving: true }
    ];
    
    const type = types[Math.floor(Math.random() * types.length)];
    
    gameObjects.current.obstacles.push({
      x: LANES[lane] - type.width / 2,
      y: -type.height,
      width: type.width,
      height: type.height,
      color: type.color,
      destructible: type.destructible || false,
      moving: type.moving || false,
      moveDirection: Math.random() > 0.5 ? 1 : -1,
      lane: lane
    });
  };

  const spawnCollectible = () => {
    const lane = Math.floor(Math.random() * 3);
    
    // Determine collectible type based on rarity
    let type = 'BASIC';
    const rand = Math.random();
    let cumulativeRarity = 0;
    
    for (const [typeName, data] of Object.entries(COLLECTIBLE_TYPES)) {
      cumulativeRarity += data.rarity;
      if (rand <= cumulativeRarity) {
        type = typeName;
        break;
      }
    }
    
    const collectibleData = COLLECTIBLE_TYPES[type];
    
    gameObjects.current.collectibles.push({
      x: LANES[lane] - 15,
      y: -30,
      size: 30,
      type: type,
      value: collectibleData.value,
      color: collectibleData.color,
      glow: collectibleData.glow,
      rotation: 0
    });
  };

  const spawnPowerUp = () => {
    const lane = Math.floor(Math.random() * 3);
    const types = Object.keys(POWERUP_TYPES);
    const type = types[Math.floor(Math.random() * types.length)];
    const powerUpData = POWERUP_TYPES[type];
    
    gameObjects.current.powerUps.push({
      x: LANES[lane] - 20,
      y: -40,
      size: 40,
      type: type,
      color: powerUpData.color,
      rotation: 0
    });
  };

  const activatePowerUp = (type) => {
    const powerUpData = POWERUP_TYPES[type];
    setPowerUps(prev => ({
      ...prev,
      [powerUpData.effect]: powerUpData.duration
    }));
  };

  const addParticleExplosion = (x, y, color, isPositive = false) => {
    for (let i = 0; i < (isPositive ? 8 : 12); i++) {
      gameObjects.current.particles.push({
        x: x,
        y: y,
        velocityX: (Math.random() - 0.5) * 10,
        velocityY: Math.random() * -8 - 2,
        color: color,
        life: 60,
        maxLife: 60,
        alpha: 1,
        size: Math.random() * 4 + 2
      });
    }
  };

  const handlePlayerHit = () => {
    if (gameObjects.current.player.invulnerable) return;
    
    const newLives = lives - 1;
    setLives(newLives);
    
    // Make player temporarily invulnerable
    gameObjects.current.player.invulnerable = true;
    gameObjects.current.player.invulnerableTime = 2000;
    
    // Add hit particles
    addParticleExplosion(
      gameObjects.current.player.x + 20,
      gameObjects.current.player.y + 30,
      '#FF0000'
    );
    
    if (newLives <= 0) {
      endGame();
    }
  };

  const endGame = () => {
    setGameState('gameOver');
    if (onGameEnd) {
      onGameEnd({
        score: score,
        distance: Math.floor(distance),
        maxSpeed: gameSpeed
      });
    }
  };

  // Render game
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Clear canvas with gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(0.5, '#16213e');
    gradient.addColorStop(1, '#0f3460');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    // Draw lane lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 10]);
    for (let i = 0; i < 4; i++) {
      const x = 80 + i * 80;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, ctx.canvas.height);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    
    if (gameState === 'playing') {
      // Draw particles (background layer)
      gameObjects.current.particles.forEach(particle => {
        ctx.globalAlpha = particle.alpha;
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      
      // Draw collectibles
      gameObjects.current.collectibles.forEach(collectible => {
        ctx.save();
        ctx.translate(collectible.x + collectible.size/2, collectible.y + collectible.size/2);
        ctx.rotate(collectible.rotation * Math.PI / 180);
        
        // Glow effect
        ctx.shadowBlur = 15;
        ctx.shadowColor = collectible.glow;
        
        // Draw coin
        ctx.fillStyle = collectible.color;
        ctx.beginPath();
        ctx.arc(0, 0, collectible.size/2, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner highlight
        ctx.shadowBlur = 0;
        ctx.fillStyle = collectible.glow;
        ctx.beginPath();
        ctx.arc(-5, -5, collectible.size/4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
      });
      
      // Draw power-ups
      gameObjects.current.powerUps.forEach(powerUp => {
        ctx.save();
        ctx.translate(powerUp.x + powerUp.size/2, powerUp.y + powerUp.size/2);
        ctx.rotate(powerUp.rotation * Math.PI / 180);
        
        // Glow effect
        ctx.shadowBlur = 20;
        ctx.shadowColor = powerUp.color;
        
        // Draw power-up
        ctx.fillStyle = powerUp.color;
        ctx.fillRect(-powerUp.size/2, -powerUp.size/2, powerUp.size, powerUp.size);
        
        // Inner symbol
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⚡', 0, 0);
        
        ctx.restore();
      });
      
      // Draw obstacles
      gameObjects.current.obstacles.forEach(obstacle => {
        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(obstacle.x + 2, obstacle.y + 2, obstacle.width, obstacle.height);
        
        // Main obstacle
        ctx.fillStyle = obstacle.color;
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        
        // Highlight if destructible
        if (obstacle.destructible) {
          ctx.strokeStyle = '#FFFF00';
          ctx.lineWidth = 2;
          ctx.strokeRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        }
      });
      
      // Draw player
      const player = gameObjects.current.player;
      ctx.save();
      ctx.translate(player.x + player.width/2, player.y + player.height/2);
      
      // Spinning animation
      if (player.isSpinning) {
        ctx.rotate(player.spinAngle * Math.PI / 180);
      }
      
      // Invulnerability flashing
      if (player.invulnerable && Math.floor(Date.now() / 100) % 2) {
        ctx.globalAlpha = 0.5;
      }
      
      // Player shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(-player.width/2 + 2, -player.height/2 + 2, player.width, player.height);
      
      // Player body
      ctx.fillStyle = '#FF6B6B';
      ctx.fillRect(-player.width/2, -player.height/2, player.width, player.height);
      
      // Player details
      ctx.fillStyle = '#4ECDC4';
      ctx.fillRect(-player.width/2 + 5, -player.height/2 + 5, player.width - 10, 15);
      
      // Eyes
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(-10, -15, 8, 8);
      ctx.fillRect(2, -15, 8, 8);
      ctx.fillStyle = '#000000';
      ctx.fillRect(-8, -13, 4, 4);
      ctx.fillRect(4, -13, 4, 4);
      
      ctx.restore();
    }
    
    // Draw UI
    drawUI(ctx);
    
  }, [gameState, score, distance, lives, gameSpeed, powerUps]);

  const drawUI = (ctx) => {
    // Score
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score.toLocaleString()}`, 10, 30);
    
    // Distance
    ctx.font = '16px Arial';
    ctx.fillText(`Distance: ${Math.floor(distance)}m`, 10, 55);
    
    // Lives
    ctx.fillText(`Lives: `, 10, 80);
    for (let i = 0; i < lives; i++) {
      ctx.fillStyle = '#FF6B6B';
      ctx.fillRect(60 + i * 25, 65, 20, 15);
    }
    
    // Power-ups display
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '12px Arial';
    let powerUpY = 105;
    Object.entries(powerUps).forEach(([type, timeLeft]) => {
      const seconds = Math.ceil(timeLeft / 1000);
      ctx.fillText(`${type}: ${seconds}s`, 10, powerUpY);
      powerUpY += 20;
    });
    
    // Speed indicator
    ctx.fillStyle = '#FFD700';
    ctx.font = '14px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(`Speed: ${gameSpeed.toFixed(1)}x`, ctx.canvas.width - 10, 30);
    
    // Game state overlays
    if (gameState === 'menu') {
      drawMenu(ctx);
    } else if (gameState === 'gameOver') {
      drawGameOver(ctx);
    } else if (gameState === 'paused') {
      drawPaused(ctx);
    }
  };

  const drawMenu = (ctx) => {
    // Semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    // Title
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('TRASH', ctx.canvas.width / 2, 150);
    ctx.fillStyle = '#4ECDC4';
    ctx.fillText('BANDIDEGEN', ctx.canvas.width / 2, 190);
    
    // Subtitle
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '16px Arial';
    ctx.fillText('Endless Runner', ctx.canvas.width / 2, 220);
    
    // Instructions
    ctx.font = '14px Arial';
    ctx.fillText('Controls:', ctx.canvas.width / 2, 280);
    ctx.fillText('← → or A D: Change lanes', ctx.canvas.width / 2, 300);
    ctx.fillText('↑ or W or SPACE: Jump', ctx.canvas.width / 2, 320);
    ctx.fillText('↓ or S: Slide', ctx.canvas.width / 2, 340);
    ctx.fillText('X or SHIFT: Spin attack', ctx.canvas.width / 2, 360);
    
    // Start button
    ctx.fillStyle = '#FF6B6B';
    ctx.fillRect(ctx.canvas.width / 2 - 75, 400, 150, 50);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 20px Arial';
    ctx.fillText('START GAME', ctx.canvas.width / 2, 430);
  };

  const drawGameOver = (ctx) => {
    // Semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    // Game Over text
    ctx.fillStyle = '#FF6B6B';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', ctx.canvas.width / 2, 150);
    
    // Final score
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 24px Arial';
    ctx.fillText(`Final Score: ${score.toLocaleString()}`, ctx.canvas.width / 2, 200);
    
    // Distance
    ctx.fillStyle = '#4ECDC4';
    ctx.font = '18px Arial';
    ctx.fillText(`Distance: ${Math.floor(distance)}m`, ctx.canvas.width / 2, 230);
    
    // Play again button
    ctx.fillStyle = '#4ECDC4';
    ctx.fillRect(ctx.canvas.width / 2 - 75, 300, 150, 50);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 18px Arial';
    ctx.fillText('PLAY AGAIN', ctx.canvas.width / 2, 330);
    
    // Menu button
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(ctx.canvas.width / 2 - 60, 370, 120, 40);
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 16px Arial';
    ctx.fillText('MAIN MENU', ctx.canvas.width / 2, 395);
  };

  const drawPaused = (ctx) => {
    // Semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    // Paused text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', ctx.canvas.width / 2, ctx.canvas.height / 2);
    
    ctx.font = '16px Arial';
    ctx.fillText('Press ESC to resume', ctx.canvas.width / 2, ctx.canvas.height / 2 + 40);
  };

  // Handle canvas clicks
  const handleCanvasClick = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (gameState === 'menu') {
      // Check start button
      if (x >= canvas.width / 2 - 75 && x <= canvas.width / 2 + 75 &&
          y >= 400 && y <= 450) {
        setGameState('playing');
        initGame();
      }
    } else if (gameState === 'gameOver') {
      // Check play again button
      if (x >= canvas.width / 2 - 75 && x <= canvas.width / 2 + 75 &&
          y >= 300 && y <= 350) {
        setGameState('playing');
        initGame();
      }
      // Check menu button
      if (x >= canvas.width / 2 - 60 && x <= canvas.width / 2 + 60 &&
          y >= 370 && y <= 410) {
        setGameState('menu');
      }
    }
  }, [gameState, initGame]);

  // Game loop
  useEffect(() => {
    const gameLoop = () => {
      updateGame();
      render();
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };
    
    if (canvasRef.current) {
      gameLoop();
    }
    
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [updateGame, render]);

  // Event listeners
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  // Pause game on ESC
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && gameState === 'playing') {
        setGameState('paused');
      } else if (e.key === 'Escape' && gameState === 'paused') {
        setGameState('playing');
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [gameState]);

  return (
    <div className="trash-bandidegen-game">
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        className="game-canvas"
        tabIndex={0}
      />
    </div>
  );
};

export default TrashBandidegenGame; 