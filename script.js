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

        // Create striped ground
        const groundWidth = width * 100;
        const stripeWidth = 100; // Width of each stripe
        const numStripes = Math.ceil(groundWidth / stripeWidth);
        this.groundStripes = [];

        // Create ground group
        this.groundGroup = this.physics.add.staticGroup();

        for (let i = 0; i < numStripes; i++) {
            const x = i * stripeWidth + stripeWidth / 2;
            const y = height - 20; // Position in world space
            // Alternate between gray and green stripes
            const color = i % 2 === 0 ? 0x666666 : 0x00aa00;
            const stripe = this.add.rectangle(x, y, stripeWidth, 100, color);
            this.groundGroup.add(stripe);
            this.groundStripes.push(stripe);
        }
        
        // Create player as a red rectangle (4 times larger and rectangular)
        this.player = this.add.rectangle(100, height / 2, 50, 164, 0xff0000);
        
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

        // Set up keyboard controls
        this.cursors = this.input.keyboard.addKeys({
            up: 'W',
            down: 'S', 
            left: 'A',
            right: 'D'
        });

        // Camera setup with much larger bounds
        this.cameras.main.setBounds(0, 0, groundWidth, height * 100);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.setZoom(1);
        this.targetZoom = 1;

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
        const numStripes = Math.ceil(groundWidth / stripeWidth);

        for (let i = 0; i < numStripes; i++) {
            const x = i * stripeWidth + stripeWidth / 2;
            const y = gameSize.height - 20; // Position in world space
            const color = i % 2 === 0 ? 0x666666 : 0x00aa00;
            const stripe = this.add.rectangle(x, y, stripeWidth, 100, color);
            this.groundGroup.add(stripe);
            this.groundStripes.push(stripe);
        }
        
        // Update camera bounds
        this.cameras.main.setBounds(0, 0, groundWidth, gameSize.height * 100);
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

        // Dynamic camera zoom based on player's vertical position
        const viewportHeight = this.scale.height;
        const playerHeight = this.player.y;
        const maxZoomOut = 0.3;        // Maximum zoom out level (30% of original size)
        const zoomStartHeight = viewportHeight * 0.4;  // Start zooming when player is above 40% of screen height
        const zoomEndHeight = viewportHeight * 0.2;    // Maximum zoom at 20% of screen height

        // Calculate zoom based on player height
        if (playerHeight < zoomStartHeight) {
            const zoomRange = zoomStartHeight - zoomEndHeight;
            const zoomProgress = Math.min(1, (zoomStartHeight - playerHeight) / zoomRange);
            this.targetZoom = 1 - (zoomProgress * (1 - maxZoomOut));
        } else {
            this.targetZoom = 1;
        }

        // Smoothly transition to target zoom
        const currentZoom = this.cameras.main.zoom;
        const zoomSpeed = 0.1;
        this.cameras.main.setZoom(currentZoom + (this.targetZoom - currentZoom) * zoomSpeed);
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
