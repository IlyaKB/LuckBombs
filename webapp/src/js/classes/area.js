export default class Area {
	
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
		
		// TODO:
		oGame.physics.add.collider(this.oElements, this.oPlayer);
		oGame.physics.add.collider(this.oElements, this.oEnemies);
		oGame.physics.add.collider(this.oElements, this.oStars);
		oGame.physics.add.collider(this.oElements, this.oArmors);
		oGame.physics.add.collider(this.oElements, this.oBombs);
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