'use strict';

/**
 * @author       Kalashnikov Ilya <veddbrus@mail.ru>
 * @copyright    2018 © Kalashnikov Ilya (web-applications.ru)
 */

// TODO: use babel
/*import ButtonRetro from "./button-retro";
import Graphic from "./graphic";
import Area from "./area";*/

const C_MAXLEVELS = 5;

class Main {
	
	constructor(sDOMElementId = null) {
		
		Main._instance = this; // TODO: DEL
		let self = this;
	
		this.oGame = null;

		this.iLevel = parseInt( location.hash.replace(/[\D]/,"") );
		if (! this.iLevel) this.iLevel = 1;
		if (this.iLevel <= 0) this.iLevel = 1;
		if (this.iLevel >= C_MAXLEVELS) this.iLevel = C_MAXLEVELS;
		
		let wh = 64;
		let sizeX = Math.floor(Math.floor(window.innerWidth) / wh) + this.iLevel * 3;
		let sizeY = Math.floor(Math.floor(window.innerHeight) / wh);

		this.oArea = new Area(sizeX, sizeY);
		this.oGraphic = new Graphic(this.oArea);

		this.iScore = 0;
		this.iScoreTarget = this.iLevel * 200;

		this.iHealth = 100;

		this.iBombDamageBase = 10 + this.iLevel * 2;

		this.bPause = false;
		this.bSounds = true;
		this.bMusic = true;
	
		addEventListener("load", function() {
			
			let eDomElement = (sDOMElementId ? document.getElementById(sDOMElementId) : null); 
			
			let oConfig = {
				type: Phaser.AUTO,
				width: eDomElement ? eDomElement.clientWidth : window.innerWidth,
				height: eDomElement ? eDomElement.clientWidth : window.innerHeight,
				physics: {
					default: 'arcade',
					arcade: {
						gravity: { y: 200 },
						debug: false
					}
				},
				scene: {
					preload: function() {
						self.oGame = this; // TODO: Почему местный this отличается от oGame_what_is_this (см. ниже) ?
						self.fPreload(this);
					},
					create: function() {
						self.fCreate(this);
					},
					update: function() {
						self.fUpdate(this);
					}
					//,render: oMyGameTest.fRender
				}
			};
			if (eDomElement) oConfig.parent = sDOMElementId;
			
			this.oGame_what_is_this = new Phaser.Game(oConfig);
			
		}.bind(this));
	}
	
	// TODO: DEL
	static getInstance() {
		return Main._instance;
	}
	
	fPreload(oGame) {
		let oGraphic = this.oGraphic;
		let oArea = this.oArea;
		
		oGraphic.preload(oGame, oArea);
		
		oGame.load.audio('theme', ['audio/level' + this.iLevel + '.mp3']);
		oGame.load.audioSprite('sfx', ['audio/fx_mixdown.mp3'], 'audio/fx_mixdown.json');
	}
	
	fCreate(oGame) {
		
		let self = this;
		let oGraphic = this.oGraphic;
		let oArea = this.oArea;
		
		oGraphic.init(oGame);
		oArea.init(oGame, oGraphic);
		
		oGame.physics.add.overlap(oArea.oEnemies, oArea.oStars, this.collectStarByEnemy, null, this);
		oGame.physics.add.overlap(oArea.oPlayer, oArea.oStars, this.collectStarByPlayer, null, this);
		oGame.physics.add.overlap(oArea.oPlayer, oArea.oArmors, this.collectArmorByPlayer, null, this);
		oGame.physics.add.overlap(oArea.oEnemies, oArea.oArmors, this.collectArmorByEnemy, null, this);
		oGame.physics.add.overlap(oArea.oStars, oArea.oBombs, this.collectStarByBomb, null, this);
		oGame.physics.add.overlap(oArea.oArmors, oArea.oBombs, this.collectArmorByBomb, null, this);
		oGame.physics.add.collider(oArea.oPlayer, oArea.oBombs, this.bombHit, null, this);
		oGame.physics.add.collider(oArea.oElements, oArea.oBombs, this.bombElement, null, this);
		
		let bTap = false;
		this.bTouchLeft = false;
		this.bTouchRight = false;
		this.bTouchUp = false;
		let aY = [], qY = 30, iY = 0, iYprev;
		for (let i = 0; i < qY; i++) aY[i] = 0;
		let sx, sy, cx, cy, bCameraMove = false;
		oGame.input.on('pointerdown', function (oPointer) {
			bTap = true;
			//self.fPrintDebugInfo([				'pointerdown',				'x=' +Math.floor(oPointer.x) + "; y=" + Math.floor(oPointer.y),				'camera: ' + Math.floor(oPointer.camera.scrollX) + ';' + Math.floor(oPointer.camera.scrollY)			]);
			this.bTouchLeft = (oPointer.x < oArea.oPlayer.x);
			this.bTouchRight = (oPointer.x >= oArea.oPlayer.x);
			sx = oPointer.x;
			sy = oPointer.y;
			cx = oGame.cameras.main.x;
			cy = oGame.cameras.main.y;
			bCameraMove = true;
		});
		oGame.input.on('pointermove', function (oPointer) {
			if (bTap) {
				this.bTouchLeft = (oPointer.x < oArea.oPlayer.x);
				this.bTouchRight = (oPointer.x >= oArea.oPlayer.x);
				aY[iY] = oPointer.y;
				iY++; if (iY > qY) iY = 0;
				iYprev = iY + 1; if (iYprev > qY) iYprev = 0;
				if (aY[iY] < aY[iYprev] - 20) this.bTouchUp = true;
			}
			if (bCameraMove) {
				let dx = oPointer.x - sx;
				let dy = oPointer.y - sy;
				//oGame.cameras.main.setPosition(cx + dx, cy + dy); // TODO: почему вместе с камерой не движется отрисовка поля!?
			}
		});
		oGame.input.on('pointerup', function (oPointer) {
			bCameraMove = false;
			bTap = false;
			this.bTouchLeft = false;
			this.bTouchRight = false;
			this.bTouchUp = false;
			for (var i = 0; i < qY; i++) aY[i] = 0;
		});
		
		this.oCursors = oGame.input.keyboard.createCursorKeys();
		
		oGame.cameras.main.setBounds(-100, -100, oGraphic.sizeXpx + 200, oGraphic.sizeYpx + 200);
		oGame.cameras.main.startFollow(oArea.oPlayer);
		
		let bMusicPrevious;
		new ButtonRetro(oGame, {
			name: "pause",
			title: "PAUSE",
			scrollFactor: [0,0], scale: [1.6,2],
			x: oGraphic.screenWidth - 140, y: oGraphic.screenHeight - 50,
			text: { x: 17, y: 12, tint: 0xaaaaaa },
			click: function() { // this => [ButtonRetro object]
				if (self.bPause) {
					this.setText("PAUSE");
					oGame.physics.resume();
					this.oText.setTint(0xaaaaaa);
					if (bMusicPrevious) self.oMusic.resume();
				} else {
					this.setText("RESUME");
					oGame.physics.pause();
					this.oText.setTint(0x00ff00);
					bMusicPrevious = self.oMusic.isPlaying;
					self.oMusic.pause();
				}
				self.bPause = ! self.bPause;
			}
		});
		
		new ButtonRetro(oGame, {
			name: "music",
			title: "MUSIC "+(this.bMusic?"ON":"OFF"),
			scrollFactor: [0,0], scale: [2.3,2],
			x: 16, y: oGraphic.screenHeight - 50,
			text: { x: 17, y: 12, tint: 0x00ff00 },
			click: function() {
				if (self.oMusic.isPlaying) {
					this.setText("MUSIC OFF");
					this.oText.setTint(0xaaaaaa);
					self.oMusic.pause();
				} else {
					this.setText("MUSIC ON");
					this.oText.setTint(0x00ff00);
					self.oMusic.resume();
				}
			}
		});
		
		oGame.input.on('gameobjectover', function (oPointer, oGameObject) {
			if (ButtonRetro.hasCallback(oGameObject.name)) {
				oGameObject.frame = oGameObject.scene.textures.getFrame(oGameObject.oConfig.sSpriteSheetName, 0);
			}
		});
		oGame.input.on('gameobjectout', function (oPointer, oGameObject) {
			if (ButtonRetro.hasCallback(oGameObject.name)) {
				oGameObject.frame = oGameObject.scene.textures.getFrame(oGameObject.oConfig.sSpriteSheetName, 1);
			}
		});
		oGame.input.on('gameobjectdown', function (oPointer, oGameObject) {
			if (ButtonRetro.hasCallback(oGameObject.name)) {
				oGameObject.frame = oGameObject.scene.textures.getFrame(oGameObject.oConfig.sSpriteSheetName, 2);
			}
		});
		oGame.input.on('gameobjectup', function (oPointer, oGameObject) {
			if (ButtonRetro.hasCallback(oGameObject.name)) {
				oGameObject.frame = oGameObject.scene.textures.getFrame(oGameObject.oConfig.sSpriteSheetName, 0);
				ButtonRetro.callback(oGameObject.name);
			}
		}, this);
		
		this.oScoreText = oGame.add.bitmapText(16, 16, 'font_retro', 'SCORE:0/' + self.iScoreTarget)
			.setTint(0xffff00)
			.setScrollFactor(0);
		//Phaser.Display.Align.In.TopLeft(oScoreText, oLand); // TODO: м.б. как-то попроще можно сделать?
		
		this.oHealthText = oGame.add.bitmapText(oGraphic.screenWidth - 210, 16, 'font_retro', ' HEALTH:100%')
			.setTint(0xffffff).setScrollFactor(0);
		
		let oLevelText = oGame.add.text(0,0, 'Level ' + self.iLevel,
			{ fontSize: '48px', fontFamily: 'Arial', fill: 'rgb(255,255,0)' }
		)
			.setScrollFactor(0);
		this.alignHV(oLevelText, "center","center");
		setTimeout( function() { oLevelText.destroy(); }, 3000);
		
		let oAboutText = oGame.add.text(0,0,
			'LuckBombs v1.0 - Level ' + self.iLevel + ', GitHub page: https://github.com/IlyaKB/LuckBombs',
			{ fontSize: '12px', fontFamily: 'Arial', fill: 'rgb(255,255,255)' }
		)
			.setScrollFactor(0);
		this.alignHV(oAboutText,"center","bottom");
		
		this.oMusic = oGame.sound.add('theme');
		this.music(this.bMusic);
		
		//let spritemap = oGame.cache.json.get('sfx').spritemap;
	}
	
	alignHV(oGameObject, h = "center", v = "center") {
		let oBounds = oGameObject.getBounds();
		let x, y;
		switch (h) {
			case "left": x = 5; break;
			case "right": x = this.oGraphic.screenWidth - oBounds.width - 5; break;
			default: x = this.oGraphic.screenWidth05 - oBounds.width / 2;
		}
		switch (v) {
			case "top": y = 5; break;
			case "bottom": y = this.oGraphic.screenHeight - oBounds.height - 5; break;
			default: y = this.oGraphic.screenHeight05 - oBounds.height / 2;
		}
		oGameObject.setX(x);
		oGameObject.setY(y);
	}

	fUpdate(oGame) {
		
		//let oGraphic = this.oGraphic;
		let oArea = this.oArea;
		
		if (this.oCursors.left.isDown || this.bTouchLeft) {
			oArea.oPlayer.setVelocityX(Math.max(oArea.oPlayer.body.velocity.x - 10, -200));
			oArea.oPlayer.anims.play('left', true);
		} else if (this.oCursors.right.isDown || this.bTouchRight) {
			oArea.oPlayer.setVelocityX(Math.min(oArea.oPlayer.body.velocity.x + 10, 200));
			oArea.oPlayer.anims.play('right', true);
		} else {
			oArea.oPlayer.setVelocityX(0);
			oArea.oPlayer.anims.play('turn');
		}
		if ((oArea.oPlayer.body.onFloor() || oArea.oPlayer.body.touching.down) && (this.oCursors.up.isDown || this.bTouchUp)) {
			oArea.oPlayer.setVelocityY(-350);
			this.bTouchUp = false;
			this.sound("alien death");
		}

		oArea.oEnemies.children.iterate(function (oEnemy) {
			if (oEnemy.body.velocity.x < -10) {
				oEnemy.anims.play('enemy_left', true);
			} else if (oEnemy.body.velocity.x > 10) {
				oEnemy.anims.play('enemy_right', true);
			} else {
				oEnemy.anims.play('enemy_turn', true);
				if (Math.random() < 0.1) {
					oEnemy.body.velocity.x = 200*Math.random() - 100;
					if (oEnemy.body.onFloor() || oEnemy.body.touching.down) {
						oEnemy.body.velocity.y = 100*(Math.random() < .5?1:-1);
					}
				}
			}
		});
	}
	
	getLevelNum() {
		return this.iLevel;
	}
	
	collectStarByPlayer(oPlayer, oStar) {
		oStar.disableBody(true, true);
		
		this.scoreChange(10);
	
		this.sound("boss hit");
		
		if (this.iScore >= this.iScoreTarget) {
			if (this.iLevel == C_MAXLEVELS) {
				let px = this.oGraphic.screenWidth05 - 150;
				let py = this.oGraphic.screenHeight05;
				this.oGame.add.text(px, py, 'VICTORY!!!', { fontSize: '64px', fontFamily: 'Arial', fill: '#0a0' }).setScrollFactor(0);
				this.sound("numkey");
				this.oMusic.stop();
				this.oGame.physics.pause();
			} else {
				let px = this.oGraphic.screenWidth05 - 200;
				let py = this.oGraphic.screenHeight05;
				this.oGame.add.text(px, py, 'The level is won!', { fontSize: '64px', fontFamily: 'Arial', fill: '#ff0' }).setScrollFactor(0);
				this.sound("numkey");
				this.oMusic.stop();
				this.oGame.physics.pause();
				setTimeout( function() {
					location.hash = this.iLevel + 1;
					location.reload();
				}.bind(this), 1000);
			}
		} else {
			this.checkStarsCount();
		}
	}
	
	collectStarByEnemy(oEnemy, oStar) {
		oStar.disableBody(true, true);
		
		let oBomb = this.oArea.oBombs.create(oEnemy.body.position.x, oEnemy.body.position.y, 'bomb');
		oBomb.setBounce(1);
		oBomb.setMass(0.5);
		oBomb.setCollideWorldBounds(true);
		oBomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
		oBomb.allowGravity = false;
		let oEmitter = this.oGraphic.oParticles.createEmitter({
			speed: this.iLevel * 10,
			scale: { start: 0.5+this.iLevel/10, end: 0.1+this.iLevel/10 },
			blendMode: 'ADD'
		});
		oEmitter.startFollow(oBomb);
		oBomb._oEmitter = oEmitter;
		
		if (this.hasCameraObject(oStar)) {
			this.sound("squit");
		}

		this.checkStarsCount();
	}
	
	checkStarsCount() {
		if (this.oArea.oStars.countActive(true) === 0) {
			this.sound("escape");
			setTimeout(this.restoreStarsAndArmors.call(this), 1000);
		}
	}
	
	restoreStarsAndArmors() {
		this.oArea.oStars.children.iterate(function (oStar) {
			oStar.enableBody(true, oStar.x, 0, true, true);
		});
		this.oArea.oArmors.children.iterate(function (oArmor) {
			oArmor.enableBody(true, oArmor.x, 0, true, true);
		});
	}
	
	collectStarByBomb(oStar, oBomb) {
		oStar.disableBody(true, true);
		//oBomb.body.velocity.x = -oBomb.body.velocity.x;
		//oBomb.body.velocity.y = -oBomb.body.velocity.y;
		this.bombDetonate(oBomb);
		this.checkStarsCount();
	}
	
	collectArmorByPlayer(oPlayer, oArmor) {
		oArmor.disableBody(true, true);
		this.sound("squit");
		this.healthChange(20);
	}
	
	collectArmorByEnemy(oEnemy, oArmor) {
		if (this.hasCameraObject(oArmor)) {
			this.sound("squit");
		}
		oArmor.disableBody(true, true);
	}
	
	collectArmorByBomb(oArmor, oBomb) {
		oArmor.disableBody(true, true);
		this.bombDetonate(oBomb);
	}

	bombHit(oPlayer, oBomb) {
		
		this.bombDetonate(oBomb);

		this.scoreChange(-5);
		this.healthChange( -this.iBombDamageBase - Math.floor(Math.random() * this.iBombDamageBase + 1) );
		
		this.oArea.oPlayer.setTint(0xff0000);
		
		if (this.iHealth <= 0) {
			this.oArea.oPlayer.anims.play('turn');
			let px = this.oGraphic.screenWidth05 - 150;
			let py = this.oGraphic.screenHeight05;
			this.oGame.add.text(px, py, 'GAME OVER', { fontSize: '64px', fontFamily: 'Arial', fill: '#c00' }).setScrollFactor(0);
			this.sound("death");
			this.oMusic.stop();
			this.oGame.physics.pause();
			setTimeout(function() {
				location.reload();
			},3000);
			return;
		}

		setTimeout( function() {
			//this.physics.resume();
			this.oArea.oPlayer.clearTint();
		}.bind(this), 1000);
	}
	
	bombElement(oElement, oBomb) {
		//
	}
	
	healthChange(iDelta) {
		this.iHealth += iDelta;
		if (this.iHealth > 100) this.iHealth = 100;
		if (this.iHealth < 0) this.iHealth = 0;
		this.oHealthText.setText('HEALTH:' + this.iHealth + "%");
		
		if (this.iHealth <= 99) {
			this.oHealthText.setTint(0x00ff00);
			if (this.iHealth <= 60) {
				this.oHealthText.setTint(0xffff00);
				if (this.iHealth <=40) {
					this.oHealthText.setTint(0xffa500);
					if (this.iHealth <= 20) this.oHealthText.setTint(0xff0000);
				}
			}
		} else {
			this.oHealthText.setTint(0xffffff);
		}
	}
	
	scoreChange(iDelta) {
		this.iScore = Math.min( this.iScoreTarget, this.iScore + iDelta);
		
		this.oScoreText.setText('SCORE:' + this.iScore + '/' + this.iScoreTarget);
		
		if (this.iScore == 0) {
			this.oScoreText.setTint(0xffffff);
		} else if (this.iScore < 0) {
			this.oScoreText.setTint(0xff0000);
		} else {
			this.oScoreText.clearTint();
		}
	}
	
	bombDetonate(oBomb) {
		this.oGraphic.oParticles.emitters.remove(oBomb._oEmitter);
		oBomb.destroy();
		
		let oDetonate = this.oGame.add.sprite(oBomb.x, oBomb.y, 'detonate');
		oDetonate.anims.play('explode');
		
		if (this.hasCameraObject(oBomb)) {
			this.sound("shot");
		}
	}
	
	hasCameraObject(oGameObject) {
		let {x: iGameObjectLeft, y: iGameObjectTop} = oGameObject.getTopLeft();
		let {x: iGameObjectRight, y: iGameObjectBottom} = oGameObject.getBottomRight();
		let iCameraLeft = this.oGame.cameras.main.scrollX;// - this.oGame.cameras.main.width / 2;
		let iCameraTop = this.oGame.cameras.main.scrollY;// - this.oGame.cameras.main.height / 2;
		let iCameraRight = this.oGame.cameras.main.scrollX + this.oGame.cameras.main.width;// / 2;
		let iCameraBottom = this.oGame.cameras.main.scrollY + this.oGame.cameras.main.height;// / 2;
		return (
			(iGameObjectRight > iCameraLeft) &&
			(iGameObjectLeft < iCameraRight) &&
			(iGameObjectBottom > iCameraTop) &&
			(iGameObjectTop < iCameraBottom)
		);
	}
	
	music(bMusic) {
		if (bMusic) {
			this.oButtonMusicText && this.oButtonMusicText.setText("MUSIC ON").setTint(0x00ff00);
			if (this.oMusic.isPaused) {
				this.oMusic.resume();
			} else {
				this.oMusic.play({loop: true});
			}
		} else {
			this.oButtonMusicText && this.oButtonMusicText.setText("MUSIC OFF").setTint(0xeeeeee);
			this.oMusic.pause();
		}
	}
	
	sound(sName) {
		if (this.bSounds) this.oGame.sound.playAudioSprite('sfx', sName);
	}
	
	printDebugInfo(sText) {
		let oDebugText = this.oGame.add.text(
			this.oGraphic.sizeXpx/2- this.oGraphic.wh05 - 150, this.oGraphic.screenHeight05,
			sText, { fontSize: '24px', fontFamily: 'Arial', fill: 'rgb(255,255,255)' }
		).setScrollFactor(0);
		setTimeout( function() {
			oDebugText.destroy();
		}, 500);
	}
}

class Area {
	
	constructor(sizeX, sizeY) {
		
		this.sizeX = sizeX;
		this.sizeY = sizeY;
		
		this.squareXY = sizeX * sizeY;
		
		this.aaLevelBlocks = [
			["titan_green","titan_gray"],
			["titan_yellow","titan_gray","steel900"],
			["titan_white","titan_gray","titan_ice","block_ice"],
			["titan_brown","titan_gray"],
			["titan_gray","steel900","standard400"]
		];
		this.aLevelBlocks = this.aaLevelBlocks[ Main.getInstance().getLevelNum() - 1 ];
		
		this.oElements = null;
		this.oEnemies = null;
		this.oPlayer = null;
		this.oStars = null;
		this.oArmors = null;
		this.oBombs = null;
		this.oParticles = null;
		this.oCursors = null;
		this.oScoreText = null;
		this.oHealthText = null;
		
		this.aaArea = this.createEmptyArea();
	}
	
	init(oGame, oGraphic) { // После Graphic.init
		
		this.oGame = oGame;
		this.oGraphic = oGraphic;
		
		this.oElements = this.createElements();
		this.oStars = this.createStars();
		this.oArmors = this.createArmors();
		this.oPlayer = this.createPlayer();
		this.oEnemies = this.createEnemies();
		
		this.oBombs = oGame.physics.add.group();
		
		oGame.physics.world.setBounds(0, 0, oGraphic.sizeXpx, oGraphic.sizeYpx);
		
		oGame.physics.add.collider(this.oElements, this.oPlayer);
		oGame.physics.add.collider(this.oElements, this.oEnemies);
		oGame.physics.add.collider(this.oElements, this.oStars);
		oGame.physics.add.collider(this.oElements, this.oArmors);
		oGame.physics.add.collider(this.oEnemies, this.oPlayer);
		oGame.physics.add.collider(this.oEnemies, this.oBombs);
		oGame.physics.add.collider(this.oArmors, this.oStars);

		oGame.physics.add.collider(this.oEnemies, this.oEnemies);
		oGame.physics.add.collider(this.oBombs, this.oBombs);
		oGame.physics.add.collider(this.oStars, this.oStars);
		oGame.physics.add.collider(this.oArmors, this.oArmors);
	}
	
	isEmpty(x, y) {
		return (! this.aaArea[x][y].element && ! this.aaArea[x][y].object);
	}
	
	createEmptyArea() {
		let aaArea = [];
		for (let x = 0; x <= this.sizeX; x++) {
			let aCells = [];
			for (let y = 0; y <= this.sizeY; y++) {
				aCells.push({element: null, object: null});
			}
			aaArea.push(aCells);
		}
		return aaArea;
	}
	
	createElements() {
		
		let oElements = this.oGame.physics.add.staticGroup();
		
		let qBlocks = Math.floor(this.squareXY / 5);
		
		console.log("Area->createElements: qBlocks="+qBlocks);
		
		let x,y;
		for (let i = 0; i < qBlocks; i++) {
			x = 1 + Math.floor(Math.random() * (this.sizeX-0));
			y = 1 + Math.floor(Math.random() * (this.sizeY-1)); if (y % 2) y++;
			if (y <= 2) continue;
			this.aaArea[x][y].element = this.aLevelBlocks[ Math.floor(Math.random()*this.aLevelBlocks.length) ];
		}
		for (x = 1; x <= this.sizeX; x++) {
			this.aaArea[x][1].element = this.aLevelBlocks[0];
			this.aaArea[x][this.sizeY].element = this.aLevelBlocks[0];
		}
		for (y = 1; y <= this.sizeY; y++) {
			this.aaArea[1][y].element = this.aLevelBlocks[0];
			this.aaArea[this.sizeX][y].element = this.aLevelBlocks[0];
		}
		
		for (x = 1; x <= this.sizeX; x++) {
			for (y = 1; y <= this.sizeY; y++) {
				let oCell = this.aaArea[x][y];
				if (oCell.element) {
					oElements.create( this.oGraphic.getPX(x), this.oGraphic.getPY(y), oCell.element );//.setScale(1).refreshBody();
				}
			}
		}
		
		return oElements;
	}
	
	createPlayer() {
		let x, y, q;
		while (true) {
			q++; if (q > 1000) return alert("Error 1");
			x = 1 + Math.floor(Math.random() * this.sizeX);
			y = 1 + Math.floor(Math.random() * this.sizeY);
			if (this.isEmpty(x,y)) break;
		}
		
		this.aaArea[x][y].object = "player";
		
		let oPlayer = this.oGame.physics.add.sprite( this.oGraphic.getPX(x), this.oGraphic.getPX(y), 'player')
			.setVelocity(0, 0)
			.setMass(1.2)
			.setBounce(0.2)
			.setCollideWorldBounds(true);
			
		oPlayer.body.setGravityY(250);
		
		return oPlayer;
	}
	
	createEnemies() {
		
		let oEnemies = this.oGame.physics.add.group({
			collideWorldBounds: true,
			velocityX: 100,
			velocityY: 100,
			bounceX: 1,
			bounceY: 1
		});
		
		let qEnemies = Math.floor(this.squareXY / 20);
		
		console.log("qEnemies="+qEnemies);
		
		for (let i = 0; i < qEnemies; i++) {
			let x, y, q = 0;
			while (true) {
				q++; if (q > 1000) return alert("Error 2");
				x = 2 + Math.floor(Math.random() * (this.sizeX - 2));
				y = 3 + Math.floor(Math.random() * (this.sizeY - 3)); // кроме самого верхнего свободного ряда - там у нас звезды появляются
				if (this.isEmpty(x,y)) break;
			}
			if (q >= 1000) break;
			this.aaArea[x][y].object = "enemy";
			oEnemies.create( this.oGraphic.getPX(x), this.oGraphic.getPY(y), 'enemy');
		}		

		return oEnemies;
	}

	createStars() {
		
		let oStars = this.oGame.physics.add.group({
			gravityY: 50,
			collideWorldBounds: true
		});
		
		let y = 2;
		for (let x = 2; x <= this.sizeX - 1; x++) {
			if (! this.isEmpty(x,y)) {
				console.error("Error 3");
				continue;
			}
			this.aaArea[x][y].object = "star";
			let oStar = oStars.create( this.oGraphic.getPX(x), this.oGraphic.getPX(y), 'star');
			oStar.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
		}
		
		return oStars;
	}
	
	createArmors() {
		
		let oArmors = this.oGame.physics.add.group({
			gravityY: 50,
			mass: 0.4,
			collideWorldBounds: true
		});
		
		let qArmors = Math.floor(this.squareXY / 50);
		
		console.log("qArmors="+qArmors);
		
		for (let i = 0; i < qArmors; i++) {
			let x, y, q = 0;
			while (true) {
				q++; if (q > 1000) return alert("Error 4");
				x = 2 + Math.floor(Math.random() * (this.sizeX - 2));
				y = 3 + Math.floor(Math.random() * (this.sizeY - 3)); // кроме самого верхнего свободного ряда - там у нас звезды появляются
				if (this.isEmpty(x,y)) break;
			}
			if (q >= 1000) break;
			this.aaArea[x][y].object = "armor";
			let oArmor = oArmors.create( this.oGraphic.getPX(x), this.oGraphic.getPY(y), 'armor');
			oArmor.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
		}
		
		return oArmors;
	}
}


class Graphic {
	
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

class ButtonRetro {
	
	constructor(oGame, config) {
		
		config = config || {};
		
		let oConfig = {};
		let counter = (config.name ? "" : ButtonRetro.nextCounter());
		oConfig.sName = config.name || ("button"+counter);
		if (ButtonRetro.oaCallbacks[oConfig.sName]) console.error("Error in ButtonRetro! name \"" + oConfig.sName + "\" already use!");
		
		oConfig.sTitle = config.title || ("BUTTON"+counter);
		oConfig.sSpriteSheetName = config.spriteSheetName || "button_custom";
		oConfig.oScrollFactor = config.scrollFactor || null;
		oConfig.oScale = config.scale || null;
		oConfig.x = config.x || 0;
		oConfig.y = config.y || 0;
		oConfig.frame = config.frame || 0;
		
		oConfig.oText = {};
		
		let text = config.text || {};
		oConfig.oText.x = text.x || 5;
		oConfig.oText.y = text.y || 5;
		oConfig.oText.sFont = text.font || "font_retro";
		oConfig.oText.iTint = text.tint || null;
		
		let oButton = oGame.add.image(oConfig.x, oConfig.y, oConfig.sSpriteSheetName, oConfig.frame)
			.setOrigin(0,0)
			.setInteractive()
			.setName(oConfig.sName);
 
		if (oConfig.oScrollFactor) oButton.setScrollFactor(oConfig.oScrollFactor[0], oConfig.oScrollFactor[1]);
		if (oConfig.oScale) oButton.setScale(oConfig.oScale[0], oConfig.oScale[1]);
		
		oConfig.fClick = config.click || function(){
			console.warn("No callback function for button with name="+this.name+"!");
		}.bind(oButton);
		
		ButtonRetro.setCallback(this, oConfig.sName, oConfig.fClick);
		
		let px = oConfig.x + oConfig.oText.x;
		let py = oConfig.y + oConfig.oText.y;
		let oText = oGame.add.bitmapText(px, py, oConfig.oText.sFont, oConfig.sTitle)
			.setOrigin(0,0);
		
		if (oConfig.oText.iTint !== null) oText.setTint( oConfig.oText.iTint );
 		if (oConfig.oScrollFactor) oText.setScrollFactor(oConfig.oScrollFactor[0], oConfig.oScrollFactor[1]);
		
		oButton.oConfig = oConfig;
		oButton.oText = oText;
 
		this.oConfig = oConfig;
		this.oButton = oButton;
		this.oText = oText;
	}
	
	setText(sText) {
		this.oText.setText(sText);
	}
	
	static setCallback(oInstance, sName, fClick) {
		ButtonRetro.oaCallbacks[sName] = { oInstance: oInstance, fCallback: fClick };
	}
	
	static hasCallback(sName) {
		return !! ButtonRetro.oaCallbacks[sName];
	}
	
	static callback(sName) {
		if (ButtonRetro.oaCallbacks[sName]) {
			ButtonRetro.oaCallbacks[sName].fCallback.call( ButtonRetro.oaCallbacks[sName].oInstance );
		} else {
			console.log("Error in ButtonRetro.callback for sName=\""+sName+"\": callback functions does't exist!");
		}
	}
	
	static nextCounter() {
		return ++ButtonRetro.iButton;
	}
}

ButtonRetro.oaCallbacks = {};
ButtonRetro.iButton = 0;