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
                this.y = platform.y - this.height + platform.topMargin; // Adjust for top margin on platforms only
                this.isJumping = false;
                this.velocityY = 0;
                onPlatform = true;
            }
        });

        // If not on any platform and Dodo reaches the ground, land on the ground (without applying topMargin)
        if (!onPlatform && this.y + this.height >= groundLevel) {
            this.y = groundLevel - this.height ; // Land on the ground
            this.isJumping = false;
            this.velocityY = 0;
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

        // Define margins to ignore empty spaces around the block
        this.leftMargin = leftMargin;
        this.rightMargin = rightMargin;
        this.topMargin = topMargin;  // The margin at the top of the platform
    }

    draw(ctx) {
        ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    }

    checkLanding(dodo) {
        const dodoBottom = dodo.y + dodo.height;
        const dodoRight = dodo.x + dodo.width;
        const dodoLeft = dodo.x;

        // Adjust platform boundaries based on margins
        const effectiveX = this.x + this.leftMargin;
        const effectiveWidth = this.width - this.leftMargin - this.rightMargin;
        const effectiveY = this.y + this.topMargin;

        return (
            dodoBottom >= effectiveY &&                  // Dodo's bottom reaches the effective platform's Y
            dodoBottom <= effectiveY + 10 &&             // Adding a small tolerance for the landing check
            dodo.velocityY > 0 &&                        // Dodo is falling
            dodoRight >= effectiveX &&                   // Dodo's right edge is past the effective platform's left edge
            dodoLeft <= effectiveX + effectiveWidth      // Dodo's left edge is before the effective platform's right edge
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




class Game {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.level = 1;

        // Load assets (sprites and background)
        this.background = new Image();
        this.background.src = 'background_lvl1.png';
        this.rightWalkSprite = new Image();
        this.rightWalkSprite.src = 'rightwalkdodo.png';
        this.leftWalkSprite = new Image();
        this.leftWalkSprite.src = 'rightwalkdodo.png';
        this.jumpSprite = new Image();
        this.jumpSprite.src = 'rightwalkdodo.png';

        // Initialize Dutchman and Dodo
        this.dutchman = new Dutchman(380, 350, 200, 220, 'dutch.png');
        this.dodo = new Dodo(50, 500, this.rightWalkSprite, this.leftWalkSprite, this.jumpSprite);

        // Create platforms for the level
        this.platforms = this.createPlatformsForLevel(this.level);

        // Set up keyboard input
        this.keys = {};
        this.setupKeyboardListeners();

        // Start the game loop
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

        // Update Dutchman's position (marching back and forth)
        this.dutchman.update();

        // Check for collision between Dodo and Dutchman
        if (this.dodo.checkCollision(this.dutchman)) {
            this.dodo.isAlive = false; // Dodo dies on collision
            this.showGameOverModal();
        }

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
        this.dutchman.draw(this.ctx); // Draw Dutchman
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
