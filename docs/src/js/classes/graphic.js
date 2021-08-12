export default class Graphic {
	
	constructor(oArea) {
		
		Graphic._instance = this;
		
		this.oArea = oArea;
		
		this.wh = 64;
		this.wh05 = this.wh / 2;
		this.screenWidth = Math.floor(window.innerWidth);
		this.screenHeight = Math.floor(window.innerHeight);
		this.screenWidth05 = this.screenWidth / 2;
		this.screenHeight05 = this.screenHeight / 2;
		
		this.sizeXpx = oArea.sizeX * this.wh;
		this.sizeYpx = oArea.sizeY * this.wh;
	}
	
	preload(oGame, oArea) {
		
		oGame.load.setBaseURL('src');
		
		let progress = oGame.add.graphics();
		oGame.load.on('progress', function (value) {
			progress.clear();
			progress.fillStyle(0x0000aa, 1);
			progress.fillRect(0, 270, 800 * value, 60);
		});
		oGame.load.on('complete', function () {
			progress.destroy();
		});
		
		oGame.load.image('font_retro', 'img/fonts/16x16-blue-metal.png');
		oGame.load.spritesheet('button_custom', 'img/ui/flixel-button.png', { frameWidth: 80, frameHeight: 20 });

		let aLevelGrounds = ["grass", "sand", "ice", "dirt", "asphalt"];
		oGame.load.image('ground', 'img/sprites/'+aLevelGrounds[ Main.getInstance().getLevelNum() - 1 ] + '.png');

		for (let i = 0; i < this.oArea.aLevelBlocks.length; i++) {
			oGame.load.image(oArea.aLevelBlocks[i], 'img/sprites/' + oArea.aLevelBlocks[i] + '.png');
		}

		oGame.load.image('star', 'img/sprites/star.png');
		oGame.load.image('armor', 'img/sprites/armor25.png');
		oGame.load.image('bomb', 'img/sprites/bomb.png');
		oGame.load.image('particle_red', 'img/particles/yellow.png');
		
		oGame.load.spritesheet('enemy', 
			'img/sprites/enemy.png',
			{ frameWidth: 32, frameHeight: 48 }
		);
		oGame.load.spritesheet('player', 
			'img/sprites/player.png',
			{ frameWidth: 32, frameHeight: 48 }
		);
		oGame.load.spritesheet('detonate',
			'img/sprites/explosion.png',
			{ frameWidth: 64, frameHeight: 64, endFrame: 23 }
		);
	}
	
	init(oGame) { // Идёт перед Area.init
		
		oGame.add.tileSprite(this.sizeXpx / 2, this.sizeYpx / 2, this.sizeXpx, this.sizeYpx, "ground");
		
		oGame.cache.bitmapFont.add(
			'font_retro',
			Phaser.GameObjects.BitmapText.ParseRetroFont(oGame, {
				image: 'font_retro', width: 16, height: 16,
				chars: "!\"#$%&'()*+,-./0123456789 ABCDEFGHIJKLMNOPQRSTUVWXYZ:",//Phaser.GameObjects.BitmapText.ParseRetroFont.TEXT_SET8,
				charsPerRow: 20, spacing: { x: 0, y: 0 }
			})
		);
		
		oGame.anims.create({
			key: 'explode',
			frames: oGame.anims.generateFrameNumbers('detonate', { start: 0, end: 23, first: 23 }),
			frameRate: 20
		});
		
		oGame.anims.create({
			key: 'left',
			frames: oGame.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
			frameRate: 10,
			repeat: -1
		});
		oGame.anims.create({
			key: 'turn',
			frames: [ { key: 'player', frame: 4 } ],
			frameRate: 20
		});
		oGame.anims.create({
			key: 'right',
			frames: oGame.anims.generateFrameNumbers('player', { start: 5, end: 8 }),
			frameRate: 10,
			repeat: -1
		});
		
		oGame.anims.create({
			key: 'enemy_left',
			frames: oGame.anims.generateFrameNumbers('enemy', { start: 0, end: 3 }),
			frameRate: 10,
			repeat: -1
		});
		oGame.anims.create({
			key: 'enemy_turn',
			frames: [ { key: 'enemy', frame: 4 } ],
			frameRate: 20
		});
		oGame.anims.create({
			key: 'enemy_right',
			frames: oGame.anims.generateFrameNumbers('enemy', { start: 5, end: 8 }),
			frameRate: 10,
			repeat: -1
		});
		
		this.oParticles = oGame.add.particles('particle_red');
	}
	
	getPX(x) {
		return this.wh05 + (x-1) * this.wh;
	}
	getPY(y) {
		return this.wh05 + (y-1) * this.wh;
	}
}