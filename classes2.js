class Dodo {
    constructor(x, y, rightWalkSprite, leftWalkSprite, jumpSprite) {
        this.x = x;
        this.y = y;
        this.width = 200; 
        this.height = 200; 
        this.rightWalkSprite = rightWalkSprite;
        this.leftWalkSprite = leftWalkSprite;
        this.jumpSprite = jumpSprite;
        this.isJumping = false;
        this.isMovingLeft = false; 
        this.jumpHeight = 20;
        this.velocityY = 0;
        this.gravity = 1;
        this.velocityX = 0;

        this.frameX = 0;
        this.frameY = 0;
        this.maxFrame = 5; 
        this.frameCount = 0;
        this.frameInterval = 7;
        this.spriteColumns = 2; 
        this.spriteRows = 3; 
    }

    draw(ctx) {
        let sprite;
        if (this.isJumping) {
            sprite = this.jumpSprite;
        } else if (this.isMovingLeft) {
            sprite = this.leftWalkSprite; 
        } else {
            sprite = this.rightWalkSprite; 
        }

        const frameWidth = sprite.width / this.spriteColumns;
        const frameHeight = sprite.height / this.spriteRows;

        ctx.drawImage(
            sprite,
            this.frameX * frameWidth,
            this.frameY * frameHeight,
            frameWidth,
            frameHeight,
            this.x,
            this.y,
            this.width,
            this.height
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
                    this.frameY = 0; 
                }
            }
        }
    }

    checkCollision(dutchman) {
        return (
            this.x + this.width > dutchman.x &&  
            this.x < dutchman.x + dutchman.width &&  
            this.y + this.height > dutchman.y &&  
            this.y < dutchman.y + dutchman.height  
        );
    }

    update(canvasWidth, groundLevel, platforms) {
        this.x += this.velocityX;
        this.y += this.velocityY;
        this.velocityY += this.gravity;

        if (this.x < 0) {
            this.x = 0;
        } else if (this.x + this.width > canvasWidth) {
            this.x = canvasWidth - this.width;
        }

        let onPlatform = false;
        platforms.forEach(platform => {
            if (platform.checkLanding(this)) {
                this.y = platform.y - this.height + platform.topMargin; 
                this.isJumping = false;
                this.velocityY = 0; 
                onPlatform = true;
            }
        });

        if (!onPlatform && this.y + this.height >= groundLevel) {
            this.y = groundLevel - this.height; 
            this.isJumping = false;
            this.velocityY = 0;
        }

        if (!onPlatform && this.y + this.height < groundLevel) {
            this.isJumping = true; 
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

class Fruit {
    constructor(x, y, width, height, imageSrc) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.image = new Image();
        this.image.src = imageSrc;
        this.collected = false;  
    }

    draw(ctx) {
        if (!this.collected) {
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        }
    }

    checkCollision(dodo) {
        return (
            dodo.x + dodo.width > this.x &&  
            dodo.x < this.x + this.width &&  
            dodo.y + dodo.height > this.y &&  
            dodo.y < this.y + this.height  
        );
    }
}

class Platform {
    constructor(x, y, width, height, imageSrc, leftMargin = 60, rightMargin = 60, topMargin = 60) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.image = new Image();
        this.image.src = imageSrc;
        this.leftMargin = leftMargin;
        this.rightMargin = rightMargin;
        this.topMargin = topMargin;
        
        this.fruits = [];
        if (imageSrc === 'obs1.png') {
            this.fruits = [
                new Fruit(this.x + this.width / 2 - 75, this.y - 50, 50, 50, 'berry.png'),
                new Fruit(this.x + this.width / 2 - 25, this.y - 50, 50, 50, 'berry.png'),
                new Fruit(this.x + this.width / 2 + 25, this.y - 50, 50, 50, 'berry.png'),
            ];
        } else {
            this.fruits = [new Fruit(this.x + this.width / 2 - 25, this.y - 50, 50, 50, 'berry.png')];
        }
        this.addFruit = new Fruit(825, 150 - 50, 50, 50, "banana.png");
    }

    draw(ctx) {
        ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        this.fruits.forEach(fruit => fruit.draw(ctx));
        this.addFruit.draw(ctx);
    }

    checkCollision(dodo) {
        return this.fruits.some(fruit => fruit.checkCollision(dodo));
    }

    checkLanding(dodo) {
        const dodoBottom = dodo.y + dodo.height;
        const dodoRight = dodo.x + dodo.width;
        const dodoLeft = dodo.x;
        const effectiveX = this.x + this.leftMargin;
        const effectiveWidth = this.width - this.leftMargin - this.rightMargin;
        const effectiveY = this.y + this.topMargin;

        return (
            dodoBottom >= effectiveY - 5 &&  
            dodoBottom <= effectiveY + 5 &&  
            dodo.velocityY > 0 &&            
            dodoRight >= effectiveX &&       
            dodoLeft <= effectiveX + effectiveWidth  
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

        this.frameWidth = 0;  
        this.frameHeight = 0;  

        this.currentFrame = 0;
        this.frameCount = 8;  
        this.frameTimer = 0;
        this.frameInterval = 17;  

        this.direction = 1; 
        this.distance = 0;  
        this.maxDistance = 200;  

        this.sprite.onload = () => {
            this.frameWidth = 160;  
            this.frameHeight = 180; 
        };
    }

    update() {
        this.x += this.direction;
        this.distance += Math.abs(this.direction);

        if (this.distance >= this.maxDistance) {
            this.direction *= -1;
            this.distance = 0;
        }

        this.frameTimer++;
        if (this.frameTimer >= this.frameInterval) {
            this.currentFrame = (this.currentFrame + 1) % this.frameCount; 
            this.frameTimer = 0;
        }
    }

    draw(ctx) {
        const frameX = (this.currentFrame % 2) * this.frameWidth; 
        const frameY = Math.floor(this.currentFrame / 6) * this.frameHeight; 

        ctx.drawImage(
            this.sprite,
            frameX, frameY,  
            this.frameWidth, this.frameHeight,  
            this.x, this.y,  
            this.width, this.height  
        );
    }
}

class Game {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.level = 2; // Updated to level 2
        this.highScore = 0;  
        this.background = new Image();
        this.background.src = 'lev2.png';
        this.rightWalkSprite = new Image();
        this.rightWalkSprite.src = 'rightwalkdodo.png';
        this.leftWalkSprite = new Image();
        this.leftWalkSprite.src = 'rightwalkdodo.png';
        this.jumpSprite = new Image();
        this.jumpSprite.src = 'rightwalkdodo.png';
        this.dutchman = new Dutchman(380, 350, 200, 220, 'dutch.png');
        this.dodo = new Dodo(50, 500, this.rightWalkSprite, this.leftWalkSprite, this.jumpSprite);
        this.platforms = [];
        this.isGameOver = false;  
        this.groundLevel = 600; 
        this.loadPlatforms();
        this.addEventListeners();
        this.gameLoop();
        this.score = 0; // Initialize score
    }

    loadPlatforms() {
        this.platforms.push(new Platform(100, 340, 300, 50, 'obs1.png'));
        this.platforms.push(new Platform(650, 360, 300, 90,'obs2.png'));
        this.platforms.push(new Platform(500, 200, 300, 50, 'obs3.png')); 
        this.platforms.push(new Platform(20,50, 300, 280,'obs4.png')); 
    }

    addEventListeners() {
        window.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                this.dodo.moveLeft();
            } else if (e.key === 'ArrowRight') {
                this.dodo.moveRight();
            } else if (e.key === 'ArrowUp') {
                this.dodo.jump();
            }
        });

        window.addEventListener('keyup', (e) => {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                this.dodo.stopMovement();
            }
        });
    }

    gameLoop() {
        if (!this.isGameOver) {
            this.update();
            this.draw();
            requestAnimationFrame(() => this.gameLoop());
        }
    }

    update() {
        this.dodo.update(this.canvas.width, this.groundLevel, this.platforms);
        this.dutchman.update();
        
        // Check for collisions with fruits
        this.platforms.forEach(platform => {
            platform.fruits.forEach(fruit => {
                if (fruit.checkCollision(this.dodo) && !fruit.collected) {
                    fruit.collected = true; 
                    this.score += 10; // Increase score
                }
            });
        });

        // Update high score if necessary
        if (this.score > this.highScore) {
            this.highScore = this.score;
        }
        
        // Check collision with Dutchman
        if (this.dodo.checkCollision(this.dutchman)) {
            this.isGameOver = true;  
            this.showGameOverModal(); 
        }
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
        modal.style.zIndex = '1000'; // Ensure it appears above other elements
        modal.innerHTML = `
            <h1>GAME OVER</h1>
            <button onclick="window.location.href='menu.html'">Menu</button>
        `;
        document.body.appendChild(modal);
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(this.background, 0, 0, this.canvas.width, this.canvas.height);
        this.platforms.forEach(platform => platform.draw(this.ctx));
        this.dodo.draw(this.ctx);
        this.dutchman.draw(this.ctx);
        
        // Display score and high score
        this.ctx.fillStyle = 'white'; 
        this.ctx.font = '20px Arial'; 
        this.ctx.fillText(`Score: ${this.score}`, 10, 20); 
        // this.ctx.fillText(`High Score: ${this.highScore}`, 10, 40); // Uncomment if needed
    }
}

// Initialize the game
window.onload = () => {
    const game = new Game('gameCanvas');
};
