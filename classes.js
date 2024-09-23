class Dodo {
    constructor(x, y, rightWalkSprite, leftWalkSprite, jumpSprite) {
        this.x = x;
        this.y = y;
        this.width = 200; // This is the display size of the Dodo on canvas
        this.height = 200; // Adjusted display size
        this.rightWalkSprite = rightWalkSprite;
        this.leftWalkSprite = leftWalkSprite;
        this.jumpSprite = jumpSprite;
        this.isJumping = false;
        this.isMovingLeft = false; // Flag to track movement direction
        this.jumpHeight = 20;
        this.velocityY = 0;
        this.gravity = 1;
        this.velocityX = 0;

        // Animation properties
        this.frameX = 0;
        this.frameY = 0;
        this.maxFrame = 5; // 6 frames total (0-5)
        this.frameCount = 0;
        this.frameInterval = 7;
        this.spriteColumns = 2; // 2 columns in the sprite sheet
        this.spriteRows = 3; // 3 rows in the sprite sheet
    }

    draw(ctx) {
        let sprite;
        if (this.isJumping) {
            sprite = this.jumpSprite;
        } else if (this.isMovingLeft) {
            sprite = this.leftWalkSprite; // Use left walking sprite
        } else {
            sprite = this.rightWalkSprite; // Use right walking sprite by default
        }

        const frameWidth = sprite.width / this.spriteColumns;
        const frameHeight = sprite.height / this.spriteRows;

        ctx.drawImage(
            sprite,
            this.frameX * frameWidth, // Current frame's X position
            this.frameY * frameHeight, // Current frame's Y position
            frameWidth,                // Frame width from the sprite
            frameHeight,               // Frame height from the sprite
            this.x,                    // X position on canvas
            this.y,                    // Y position on canvas
            this.width,                // Scaled width on canvas
            this.height                // Scaled height on canvas
        );

        if (!this.isJumping && this.velocityX !== 0) {
            this.animate();
        }
    }

    animate() {
        this.frameCount++;
        if (this.frameCount >= this.frameInterval) {
            this.frameCount = 0;
            this.frameX++;
            if (this.frameX >= this.spriteColumns) {
                this.frameX = 0;
                this.frameY++;
                if (this.frameY >= this.spriteRows) {
                    this.frameY = 0; // Reset to the first row
                }
            }
        }
    }
    checkCollision(dutchman) {
        return (
            this.x + this.width > dutchman.x &&  // Dodo's right edge > Dutchman's left edge
            this.x < dutchman.x + dutchman.width &&  // Dodo's left edge < Dutchman's right edge
            this.y + this.height > dutchman.y &&  // Dodo's bottom edge > Dutchman's top edge
            this.y < dutchman.y + dutchman.height  // Dodo's top edge < Dutchman's bottom edge
        );
    }
    


    update(canvasWidth, groundLevel, platforms) {
        // Apply horizontal and vertical movement
        this.x += this.velocityX;
        this.y += this.velocityY;
        this.velocityY += this.gravity;
    
        // Prevent Dodo from going out of bounds horizontally
        if (this.x < 0) {
            this.x = 0;
        } else if (this.x + this.width > canvasWidth) {
            this.x = canvasWidth - this.width;
        }
    
        // Check if Dodo lands on any platform
        let onPlatform = false;
        platforms.forEach(platform => {
            if (platform.checkLanding(this)) {
                this.y = platform.y - this.height + platform.topMargin; // Adjust for top margin on platforms
                this.isJumping = false;
                this.velocityY = 0; // Stop the fall when on the platform
                onPlatform = true;
            }
        });
    
        // If the Dodo is not on any platform and it reaches the ground
        if (!onPlatform && this.y + this.height >= groundLevel) {
            this.y = groundLevel - this.height; // Land on the ground
            this.isJumping = false;
            this.velocityY = 0;
        }
    
        // If the Dodo is not on any platform and hasn't reached the ground, keep falling
        if (!onPlatform && this.y + this.height < groundLevel) {
            this.isJumping = true; // Still falling
        }
    }

    moveLeft() {
        this.velocityX = -5;
    }

    moveRight() {
        this.velocityX = 5;
    }

    stopMovement() {
        this.velocityX = 0;
    }

    jump() {
        if (!this.isJumping) {
            this.isJumping = true;
            this.velocityY = -this.jumpHeight;
        }
    }
}



class Platform {
    constructor(x, y, width, height, imageSrc, leftMargin = 60, rightMargin = 60, topMargin = 90) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.image = new Image();
        this.image.src = imageSrc;
        this.leftMargin = leftMargin;
        this.rightMargin = rightMargin;
        this.topMargin = topMargin;
        
        // Add a fruit to each platform
        this.fruit = new Fruit(this.x + this.width / 2 - 25, this.y - 50, 50, 50, 'berry.png');  // Fruit centered on the platform
        this.addFruit = new Fruit(825, 150-50, 50, 50 , "banana.png" )
    }

    draw(ctx) {
        ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        this.fruit.draw(ctx);  // Draw the fruit on the platform
        this.addFruit.draw(ctx);
    }

    checkLanding(dodo) {
        const dodoBottom = dodo.y + dodo.height;
        const dodoRight = dodo.x + dodo.width;
        const dodoLeft = dodo.x;
        const effectiveX = this.x + this.leftMargin;
        const effectiveWidth = this.width - this.leftMargin - this.rightMargin;
        const effectiveY = this.y + this.topMargin;
    
        // Dodo lands if its bottom is just above the platform's top within a small margin (e.g., 5 pixels)
        return (
            dodoBottom >= effectiveY - 5 &&  // Dodo's bottom is near the top of the platform
            dodoBottom <= effectiveY + 5 &&  // Dodo's bottom is not too far below the top of the platform
            dodo.velocityY > 0 &&            // Dodo is falling
            dodoRight >= effectiveX &&       // Dodo's right side is within the platform's left edge
            dodoLeft <= effectiveX + effectiveWidth  // Dodo's left side is within the platform's right edge
        );
    }
}

class Dutchman {
    constructor(x, y, width, height, spriteSrc) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.sprite = new Image();
        this.sprite.src = spriteSrc;

        this.frameWidth = 0;  // Will be calculated once the sprite is loaded
        this.frameHeight = 0;  // Will be calculated once the sprite is loaded

        this.currentFrame = 0;
        this.frameCount = 8;  // Total frames (4 columns * 2 rows = 8 frames)
        this.frameTimer = 0;
        this.frameInterval = 17;  // Adjust this value for faster or slower animation

        this.direction = 1; // 1 for right, -1 for left (marching back and forth)
        this.distance = 0;  // To track the distance marched
        this.maxDistance = 200;  // March back and forth 25px

        // Load sprite to calculate frame dimensions
        this.sprite.onload = () => {
            this.frameWidth = 160;  // 4 columns
            this.frameHeight = 180; // 2 rows
        };
    }

    update() {
        // Move the Dutchman
        this.x += this.direction;
        this.distance += Math.abs(this.direction);

        // Reverse direction if distance exceeds max distance
        if (this.distance >= this.maxDistance) {
            this.direction *= -1;
            this.distance = 0;
        }

        // Update sprite animation
        this.frameTimer++;
        if (this.frameTimer >= this.frameInterval) {
            this.currentFrame = (this.currentFrame + 1) % this.frameCount; // Cycle through frames
            this.frameTimer = 0;
        }
    }

    draw(ctx) {
        // Calculate which frame to draw
        const frameX = (this.currentFrame % 2) * this.frameWidth; // Columns: 0-3
        const frameY = Math.floor(this.currentFrame / 6) * this.frameHeight; // Rows: 0-1

        ctx.drawImage(
            this.sprite,
            frameX, frameY,  // Source X, Y (which frame to draw)
            this.frameWidth, this.frameHeight,  // Width and height of one frame
            this.x, this.y,  // Destination X, Y (where to draw on canvas)
            this.width, this.height  // Draw the frame at specified size
        );
    }
}


class Fruit {
    constructor(x, y, width, height, imageSrc) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.image = new Image();
        this.image.src = imageSrc;
        this.collected = false;  // To track if the fruit has been collected
    }

    draw(ctx) {
        if (!this.collected) {
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        }
    }

    checkCollision(dodo) {
        return (
            dodo.x + dodo.width > this.x &&  // Dodo's right edge > Fruit's left edge
            dodo.x < this.x + this.width &&  // Dodo's left edge < Fruit's right edge
            dodo.y + dodo.height > this.y &&  // Dodo's bottom edge > Fruit's top edge
            dodo.y < this.y + this.height  // Dodo's top edge < Fruit's bottom edge
        );
    }
}


class Game {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.level = 1;
        this.highScore = 0;  // High score starts at 0
        this.background = new Image();
        this.background.src = 'background_lvl1.png';
        this.rightWalkSprite = new Image();
        this.rightWalkSprite.src = 'rightwalkdodo.png';
        this.leftWalkSprite = new Image();
        this.leftWalkSprite.src = 'rightwalkdodo.png';
        this.jumpSprite = new Image();
        this.jumpSprite.src = 'rightwalkdodo.png';
        this.dutchman = new Dutchman(380, 350, 200, 220, 'dutch.png');
        this.dodo = new Dodo(50, 500, this.rightWalkSprite, this.leftWalkSprite, this.jumpSprite);
        this.platforms = this.createPlatformsForLevel(this.level);
        this.keys = {};
        this.setupKeyboardListeners();
        this.start();
    }

    createPlatformsForLevel(level) {
        if (level === 1) {
            return [
                new Platform(500, 150, 150, 120, 'block1.png', 80, 80, 90),
                new Platform(300, 350, 150, 120, 'block1.png', 80, 80, 90),
                new Platform(800, 350, 150, 120, 'block1.png', 80, 80, 90),
            ];
        } else if (level === 2) {
            return [
                new Platform(50, 300, 100, 120, 'block1.png'),
                new Platform(200, 200, 200, 120, 'block1.png'),
                new Platform(450, 100, 150, 120, 'block1.png'),
            ];
        }
    }

    setupKeyboardListeners() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }

    start() {
        const gameLoop = () => {
            this.update();
            this.draw();
            requestAnimationFrame(gameLoop);
        };
        gameLoop();
    }

    update() {
        const groundLevel = this.canvas.height - 50 + 90;
        this.dodo.update(this.canvas.width, groundLevel, this.platforms);

        // Move Dodo based on input
        if (this.keys['ArrowLeft']) {
            this.dodo.moveLeft();
        } else if (this.keys['ArrowRight']) {
            this.dodo.moveRight();
        } else {
            this.dodo.stopMovement();
        }

        if (this.keys['ArrowUp']) {
            this.dodo.jump();
        }

        // Update Dutchman's position
        this.dutchman.update();

        // Check for collision between Dodo and Dutchman
        if (this.dodo.checkCollision(this.dutchman)) {
            this.dodo.isAlive = false;
            this.showGameOverModal();
        }

        // Check for collision between Dodo and fruits
        this.platforms.forEach(platform => {
            if (platform.fruit.checkCollision(this.dodo) && !platform.fruit.collected) {
                platform.fruit.collected = true;  // Mark the fruit as collected
                this.highScore += 50;  // Increase high score by 50
                console.log("High Score:", this.highScore);  // For debugging
            }
            if (platform.addFruit.checkCollision(this.dodo) && !platform.addFruit.collected) {
                platform.addFruit.collected = true;  // Mark the fruit as collected
                this.highScore += 100;  // Increase high score by 100
                console.log("High Score:", this.highScore);  // For debugging
            }
        });

        // Level transition
        if (this.dodo.x + this.dodo.width > this.canvas.width && this.level === 1) {
            this.level = 2;
            this.dodo.x = 0;
            this.platforms = this.createPlatformsForLevel(this.level);
        }
    }

    draw() {
        this.ctx.drawImage(this.background, 0, 0, this.canvas.width, this.canvas.height);
        this.platforms.forEach(platform => platform.draw(this.ctx));
        this.dodo.draw(this.ctx);
        this.dutchman.draw(this.ctx);

        // Display high score
        this.ctx.fillStyle = 'black';
        this.ctx.font = '20px Arial';
        this.ctx.fillText('High Score: ' + this.highScore, 10, 30);
    }

    showGameOverModal() {
        const modal = document.createElement('div');
        modal.style.position = 'fixed';
        modal.style.top = '50%';
        modal.style.left = '50%';
        modal.style.transform = 'translate(-50%, -50%)';
        modal.style.padding = '20px';
        modal.style.backgroundColor = 'white';
        modal.style.border = '2px solid black';
        modal.innerHTML = '<h1>GAME OVER</h1>';
        document.body.appendChild(modal);
    }
}

// Initialize the game
window.onload = () => {
    const game = new Game('gameCanvas');
};


