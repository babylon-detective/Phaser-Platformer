class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    preload() {
        // No assets to preload for this basic setup
    }

    create() {
        // Get the game dimensions
        const width = this.scale.width;
        const height = this.scale.height;

        // Create ground group
        this.groundGroup = this.physics.add.staticGroup();
        this.groundStripes = [];

        // Create striped ground
        const groundWidth = width * 100;
        const stripeWidth = 100; // Width of each stripe
        const groundThickness = 200; // Ground thickness
        const numStripes = Math.ceil(groundWidth / stripeWidth);

        // Position ground at the bottom of the viewport
        const groundY = height - groundThickness/2; // Position ground at bottom of screen

        for (let i = 0; i < numStripes; i++) {
            const x = i * stripeWidth + stripeWidth / 2;
            const y = groundY;
            // Alternate between gray and green stripes
            const color = i % 2 === 0 ? 0x666666 : 0x00aa00;
            const stripe = this.add.rectangle(x, y, stripeWidth, groundThickness, color);
            this.groundGroup.add(stripe);
            this.groundStripes.push(stripe);
        }

        // Create vertical columns (visual only)
        const columnWidth = 50;
        const columnSpacing = 300; // Space between columns
        const numColumns = Math.ceil(groundWidth / columnSpacing);
        this.columns = [];
        this.branches = [];

        for (let i = 0; i < numColumns; i++) {
            const x = i * columnSpacing + columnWidth / 2;
            const columnHeight = Phaser.Math.Between(height * 0.3, height * 0.7);
            const grayShade = Phaser.Math.Between(0x333333, 0x999999);
            
            // Create visual column (no physics)
            const column = this.add.rectangle(x, groundY - columnHeight/2, columnWidth, columnHeight, grayShade);
            this.columns.push(column);

            // Create random branches on each column
            const numBranches = Phaser.Math.Between(2, 5);
            for (let j = 0; j < numBranches; j++) {
                const branchY = Phaser.Math.Between(height * 0.3, height - columnHeight);
                const branchLength = Phaser.Math.Between(50, 150);
                const branchDirection = Phaser.Math.Between(0, 1) === 0 ? -1 : 1; // -1 for left, 1 for right
                
                const branch = this.add.rectangle(
                    x + (branchDirection * (columnWidth/2 + branchLength/2)),
                    groundY - branchY,
                    branchLength,
                    20,
                    0x888888
                );
                this.physics.add.existing(branch, true);
                this.branches.push(branch);
            }
        }
        
        // Create player as a red rectangle (4 times larger and rectangular)
        this.player = this.add.rectangle(100, groundY - 200, 50, 164, 0xff0000);
        
        // Enable physics on the player
        this.physics.add.existing(this.player);
        
        // Add some physics properties
        this.player.body.setBounce(0.2);
        this.player.body.setCollideWorldBounds(false);
        this.player.body.setDragX(800);
        this.player.body.setMaxVelocityX(300);
        this.player.body.setGravityY(300);
        
        // Add collision between player and ground group
        this.physics.add.collider(this.player, this.groundGroup);
        
        // Add one-way platform collision for branches
        this.branches.forEach(branch => {
            this.physics.add.collider(this.player, branch, null, (player, branch) => {
                // Only collide if player is moving downward and above the platform
                return player.body.velocity.y > 0 && 
                       player.body.bottom <= branch.body.top + 10;
            });
        });

        // Set up keyboard controls
        this.cursors = this.input.keyboard.addKeys({
            up: 'W',
            down: 'S', 
            left: 'A',
            right: 'D'
        });

        // Camera setup
        this.cameras.main.setBounds(
            0,                    // x
            -height * 50,        // y (extend far up for high jumps)
            groundWidth,         // width
            height * 100         // height (extend far down)
        );
        
        // Follow player with slight lerp (smooth follow)
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        
        // Keep player vertically centered in viewport
        this.cameras.main.setFollowOffset(0, 0);
        
        this.cameras.main.setZoom(1);

        // Handle window resize
        this.scale.on('resize', this.handleResize, this);
    }

    handleResize(gameSize) {
        // Remove old ground stripes
        this.groundStripes.forEach(stripe => stripe.destroy());
        this.groundStripes = [];
        this.groundGroup.clear(true, true);

        // Create new ground stripes
        const groundWidth = gameSize.width * 100;
        const stripeWidth = 100;
        const groundThickness = 200;
        const numStripes = Math.ceil(groundWidth / stripeWidth);
        const groundY = gameSize.height - groundThickness/2; // Position ground at bottom of screen

        for (let i = 0; i < numStripes; i++) {
            const x = i * stripeWidth + stripeWidth / 2;
            const y = groundY;
            const color = i % 2 === 0 ? 0x666666 : 0x00aa00;
            const stripe = this.add.rectangle(x, y, stripeWidth, groundThickness, color);
            this.groundGroup.add(stripe);
            this.groundStripes.push(stripe);
        }
        
        // Update camera bounds
        this.cameras.main.setBounds(
            0,
            -gameSize.height * 50,
            groundWidth,
            gameSize.height * 100
        );
    }

    update() {
        // Handle horizontal movement with acceleration
        if (this.cursors.left.isDown) {
            this.player.body.setAccelerationX(-800);
        } else if (this.cursors.right.isDown) {
            this.player.body.setAccelerationX(800);
        } else {
            this.player.body.setAccelerationX(0);
        }

        // Handle jumping with doubled velocity
        if (this.cursors.up.isDown && this.player.body.touching.down) {
            this.player.body.setVelocityY(-1260); // Doubled from -630
        }

        // Camera follows player with fixed zoom
        this.cameras.main.setZoom(1);
    }
}

const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: '#000000',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false
        }
    },
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        parent: 'game-container',
        width: '100%',
        height: '100%'
    },
    scene: GameScene
};

const game = new Phaser.Game(config);
