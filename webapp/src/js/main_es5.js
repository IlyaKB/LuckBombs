var C_MAXLEVELS = 5;
var Main = function(sDOMElementId) {
  sDOMElementId = sDOMElementId === undefined ? null : sDOMElementId;
  Main._instance = this;
  this.oGame = null;
  this.iLevel = parseInt(location.hash.replace(/[\D]/, ""));
  if (!this.iLevel) {
    this.iLevel = 1;
  }
  if (this.iLevel <= 0) {
    this.iLevel = 1;
  }
  if (this.iLevel >= C_MAXLEVELS) {
    this.iLevel = C_MAXLEVELS;
  }
  var wh = 64;
  var sizeX = Math.floor(Math.floor(window.innerWidth) / wh) + this.iLevel * 3;
  var sizeY = Math.floor(Math.floor(window.innerHeight) / wh);
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
    var eDomElement = sDOMElementId ? document.getElementById(sDOMElementId) : null;
    var oConfig = {type:Phaser.AUTO, width:eDomElement ? eDomElement.clientWidth : window.innerWidth, height:eDomElement ? eDomElement.clientWidth : window.innerHeight, physics:{"default":"arcade", arcade:{gravity:{y:200}, debug:false}}, scene:{preload:this.fPreload, create:this.fCreate, update:this.fUpdate}};
    if (eDomElement) {
      oConfig.parent = sDOMElementId;
    }
    this.oGame_what_is_this = new Phaser.Game(oConfig);
  }.bind(this));
};
Main.getInstance = function() {
  return Main._instance;
};
Main.prototype.fPreload = function() {
  var oGame = this;
  var self = Main.getInstance();
  var oGraphic = self.oGraphic;
  var oArea = self.oArea;
  self.oGame = oGame;
  ButtonRetro.oGame = oGame;
  oGraphic.preload(oGame, oArea);
  oGame.load.audio("theme", ["audio/level" + self.iLevel + ".mp3"]);
  oGame.load.audioSprite("sfx", ["audio/fx_mixdown.mp3"], "audio/fx_mixdown.json");
};
Main.prototype.fCreate = function() {
  var oGame = this;
  var self = Main.getInstance();
  var oGraphic = self.oGraphic;
  var oArea = self.oArea;
  oGraphic.init(oGame);
  oArea.init(oGame, oGraphic);
  oGame.physics.add.overlap(oArea.oEnemies, oArea.oStars, self.collectStarByEnemy, null, self);
  oGame.physics.add.overlap(oArea.oPlayer, oArea.oStars, self.collectStarByPlayer, null, self);
  oGame.physics.add.overlap(oArea.oPlayer, oArea.oArmors, self.collectArmorByPlayer, null, self);
  oGame.physics.add.overlap(oArea.oEnemies, oArea.oArmors, self.collectArmorByEnemy, null, self);
  oGame.physics.add.overlap(oArea.oStars, oArea.oBombs, self.collectStarByBomb, null, self);
  oGame.physics.add.overlap(oArea.oArmors, oArea.oBombs, self.collectArmorByBomb, null, self);
  oGame.physics.add.collider(oArea.oPlayer, oArea.oBombs, self.bombHit, null, self);
  var sx, sy, cx, cy, bCameraMove = false;
  oGame.input.on("pointerdown", function(oPointer) {
    sx = oPointer.x;
    sy = oPointer.y;
    cx = oGame.cameras.main.x;
    cy = oGame.cameras.main.y;
    bCameraMove = true;
  });
  oGame.input.on("pointermove", function(oPointer) {
    if (bCameraMove) {
      var dx = oPointer.x - sx;
      var dy = oPointer.y - sy;
    }
  });
  oGame.input.on("pointerup", function(oPointer) {
    bCameraMove = false;
  });
  self.oCursors = oGame.input.keyboard.createCursorKeys();
  oGame.cameras.main.setBounds(-100, -100, oGraphic.sizeXpx + 200, oGraphic.sizeYpx + 200);
  oGame.cameras.main.startFollow(oArea.oPlayer);
  var bMusicPrevious;
  new ButtonRetro({name:"pause", title:"PAUSE", scrollFactor:[0, 0], scale:[1.6, 2], x:oGraphic.screenWidth - 140, y:oGraphic.screenHeight - 50, text:{x:17, y:12, tint:11184810}, click:function() {
    if (self.bPause) {
      this.setText("PAUSE");
      oGame.physics.resume();
      this.oText.setTint(11184810);
      if (bMusicPrevious) {
        self.oMusic.resume();
      }
    } else {
      this.setText("RESUME");
      oGame.physics.pause();
      this.oText.setTint(65280);
      bMusicPrevious = self.oMusic.isPlaying;
      self.oMusic.pause();
    }
    self.bPause = !self.bPause;
  }});
  new ButtonRetro({name:"music", title:"MUSIC ON", scrollFactor:[0, 0], scale:[2.3, 2], x:16, y:oGraphic.screenHeight - 50, text:{x:17, y:12, tint:65280}, click:function() {
    if (self.oMusic.isPlaying) {
      this.setText("MUSIC OFF");
      this.oText.setTint(11184810);
      self.oMusic.pause();
    } else {
      this.setText("MUSIC ON");
      this.oText.setTint(65280);
      self.oMusic.resume();
    }
  }});
  oGame.input.on("gameobjectover", function(oPointer, oGameObject) {
    if (ButtonRetro.oaCallbacks[oGameObject.name]) {
      oGameObject.frame = oGameObject.scene.textures.getFrame(oGameObject.oConfig.sSpriteSheetName, 0);
    }
  });
  oGame.input.on("gameobjectout", function(oPointer, oGameObject) {
    if (ButtonRetro.oaCallbacks[oGameObject.name]) {
      oGameObject.frame = oGameObject.scene.textures.getFrame(oGameObject.oConfig.sSpriteSheetName, 1);
    }
  });
  oGame.input.on("gameobjectdown", function(oPointer, oGameObject) {
    if (ButtonRetro.oaCallbacks[oGameObject.name]) {
      oGameObject.frame = oGameObject.scene.textures.getFrame(oGameObject.oConfig.sSpriteSheetName, 2);
    }
  }, this);
  oGame.input.on("gameobjectup", function(oPointer, oGameObject) {
    if (ButtonRetro.oaCallbacks[oGameObject.name]) {
      oGameObject.frame = oGameObject.scene.textures.getFrame(oGameObject.oConfig.sSpriteSheetName, 0);
      ButtonRetro.oaCallbacks[oGameObject.name].fCallback.call(ButtonRetro.oaCallbacks[oGameObject.name].oInstance);
    }
  });
  self.oScoreText = oGame.add.bitmapText(16, 16, "font_retro", "SCORE:0/" + self.iScoreTarget).setTint(16776960).setScrollFactor(0);
  self.oHealthText = oGame.add.bitmapText(oGraphic.screenWidth - 220, 16, "font_retro", " HEALTH:100%").setTint(16777215).setScrollFactor(0);
  var oLevelText = oGame.add.text(oGraphic.screenWidth05 - 80, 3, "Level " + self.iLevel, {fontSize:"48px", fontFamily:"Arial", fill:"rgb(255,255,0)"}).setScrollFactor(0);
  setTimeout(function() {
    oLevelText.destroy();
  }, 3000);
  self.oMusic = oGame.sound.add("theme");
  self.music(self.bMusic);
};
Main.prototype.fUpdate = function() {
  var oGame = this;
  var self = Main.getInstance();
  var oGraphic = self.oGraphic;
  var oArea = self.oArea;
  if (self.oCursors.left.isDown) {
    oArea.oPlayer.setVelocityX(Math.max(oArea.oPlayer.body.velocity.x - 10, -200));
    oArea.oPlayer.anims.play("left", true);
  } else {
    if (self.oCursors.right.isDown) {
      oArea.oPlayer.setVelocityX(Math.min(oArea.oPlayer.body.velocity.x + 10, 200));
      oArea.oPlayer.anims.play("right", true);
    } else {
      oArea.oPlayer.setVelocityX(0);
      oArea.oPlayer.anims.play("turn");
    }
  }
  if ((oArea.oPlayer.body.onFloor() || oArea.oPlayer.body.touching.down) && self.oCursors.up.isDown) {
    oArea.oPlayer.setVelocityY(-350);
  }
  oArea.oEnemies.children.iterate(function(oEnemy) {
    if (oEnemy.body.velocity.x < -10) {
      oEnemy.anims.play("enemy_left", true);
    } else {
      if (oEnemy.body.velocity.x > 10) {
        oEnemy.anims.play("enemy_right", true);
      } else {
        oEnemy.anims.play("enemy_turn", true);
        if (Math.random() < 0.1) {
          oEnemy.body.velocity.x = 200 * Math.random() - 100;
          if (oEnemy.body.onFloor() || oEnemy.body.touching.down) {
            oEnemy.body.velocity.y = 100 * (Math.random() < .5 ? 1 : -1);
          }
        }
      }
    }
  });
};
Main.prototype.getLevelNum = function() {
  return this.iLevel;
};
Main.prototype.collectStarByPlayer = function(oPlayer, oStar) {
  oStar.disableBody(true, true);
  this.scoreChange(10);
  this.sound("boss hit");
  if (this.iScore >= this.iScoreTarget) {
    if (this.iLevel == C_MAXLEVELS) {
      var px = this.oGraphic.screenWidth05 - 150;
      var py = this.oGraphic.screenHeight05;
      this.oGame.add.text(px, py, "VICTORY!!!", {fontSize:"64px", fontFamily:"Arial", fill:"#0a0"}).setScrollFactor(0);
      this.oMusic.stop();
      this.oGame.physics.pause();
    } else {
      var px$0 = this.oGraphic.screenWidth05 - 200;
      var py$1 = this.oGraphic.screenHeight05;
      this.oGame.add.text(px$0, py$1, "The level is won!", {fontSize:"64px", fontFamily:"Arial", fill:"#ff0"}).setScrollFactor(0);
      this.oMusic.stop();
      this.oGame.physics.pause();
      setTimeout(function() {
        location.hash = this.iLevel + 1;
        location.reload();
      }.bind(this), 1000);
    }
  } else {
    this.checkStarsCount();
  }
};
Main.prototype.collectStarByEnemy = function(oEnemy, oStar) {
  oStar.disableBody(true, true);
  var oBomb = this.oArea.oBombs.create(oEnemy.body.position.x, oEnemy.body.position.y, "bomb");
  oBomb.setBounce(1);
  oBomb.setMass(0.5);
  oBomb.setCollideWorldBounds(true);
  oBomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
  oBomb.allowGravity = false;
  var oEmitter = this.oGraphic.oParticles.createEmitter({speed:40, scale:{start:0.05, end:0.01}, blendMode:"ADD"});
  oEmitter.startFollow(oBomb);
  oBomb._oEmitter = oEmitter;
  this.sound("squit");
  this.checkStarsCount();
};
Main.prototype.checkStarsCount = function() {
  if (this.oArea.oStars.countActive(true) === 0) {
    this.sound("escape");
    setTimeout(this.restoreStarsAndArmors.call(this), 1000);
  }
};
Main.prototype.restoreStarsAndArmors = function() {
  this.oArea.oStars.children.iterate(function(oStar) {
    oStar.enableBody(true, oStar.x, 0, true, true);
  });
  this.oArea.oArmors.children.iterate(function(oArmor) {
    oArmor.enableBody(true, oArmor.x, 0, true, true);
  });
};
Main.prototype.collectStarByBomb = function(oStar, oBomb) {
  oStar.disableBody(true, true);
  this.bombDetonate(oBomb);
  this.checkStarsCount();
};
Main.prototype.collectArmorByPlayer = function(oPlayer, oArmor) {
  oArmor.disableBody(true, true);
  this.sound("squit");
  this.healthChange(20);
};
Main.prototype.collectArmorByEnemy = function(oEnemy, oArmor) {
  oArmor.disableBody(true, true);
  this.sound("squit");
};
Main.prototype.collectArmorByBomb = function(oArmor, oBomb) {
  oArmor.disableBody(true, true);
  this.bombDetonate(oBomb);
};
Main.prototype.bombHit = function(oPlayer, oBomb) {
  this.bombDetonate(oBomb);
  this.scoreChange(-5);
  this.healthChange(-this.iBombDamageBase - Math.floor(Math.random() * this.iBombDamageBase + 1));
  this.oArea.oPlayer.setTint(16711680);
  if (this.iHealth <= 0) {
    this.oArea.oPlayer.anims.play("turn");
    var px = this.oGraphic.screenWidth05 - 150;
    var py = this.oGraphic.screenHeight05;
    this.oGame.add.text(px, py, "GAME OVER", {fontSize:"64px", fontFamily:"Arial", fill:"#c00"}).setScrollFactor(0);
    this.sound("death");
    this.oMusic.stop();
    this.oGame.physics.pause();
    setTimeout(function() {
      location.reload();
    }, 3000);
    return;
  }
  setTimeout(function() {
    this.oArea.oPlayer.clearTint();
  }.bind(this), 1000);
};
Main.prototype.healthChange = function(iDelta) {
  this.iHealth += iDelta;
  if (this.iHealth > 100) {
    this.iHealth = 100;
  }
  if (this.iHealth < 0) {
    this.iHealth = 0;
  }
  this.oHealthText.setText("HEALTH:" + this.iHealth + "%");
  if (this.iHealth <= 99) {
    this.oHealthText.setTint(65280);
    if (this.iHealth <= 60) {
      this.oHealthText.setTint(16776960);
      if (this.iHealth <= 40) {
        this.oHealthText.setTint(16753920);
        if (this.iHealth <= 20) {
          this.oHealthText.setTint(16711680);
        }
      }
    }
  } else {
    this.oHealthText.setTint(16777215);
  }
};
Main.prototype.scoreChange = function(iDelta) {
  this.iScore = Math.min(this.iScoreTarget, this.iScore + iDelta);
  this.oScoreText.setText("SCORE:" + this.iScore + "/" + this.iScoreTarget);
  if (this.iScore == 0) {
    this.oScoreText.setTint(16777215);
  } else {
    if (this.iScore < 0) {
      this.oScoreText.setTint(16711680);
    } else {
      this.oScoreText.clearTint();
    }
  }
};
Main.prototype.bombDetonate = function(oBomb) {
  this.oGraphic.oParticles.emitters.remove(oBomb._oEmitter);
  oBomb.destroy();
  var oDetonate = this.oGame.add.sprite(oBomb.x, oBomb.y, "detonate");
  oDetonate.anims.play("explode");
  this.sound("shot");
};
Main.prototype.music = function(bMusic) {
  if (bMusic) {
    this.oButtonMusicText && this.oButtonMusicText.setText("MUSIC ON").setTint(65280);
    if (this.oMusic.isPaused) {
      this.oMusic.resume();
    } else {
      this.oMusic.play({loop:true});
    }
  } else {
    this.oButtonMusicText && this.oButtonMusicText.setText("MUSIC OFF").setTint(15658734);
    this.oMusic.pause();
  }
};
Main.prototype.sound = function(sName) {
  if (this.bSounds) {
    this.oGame.sound.playAudioSprite("sfx", sName);
  }
};
Main.prototype.printDebugInfo = function(sText) {
  var oDebugText = this.oGame.add.text(this.oGraphic.sizeXpx / 2 - this.oGraphic.wh05 - 150, this.oGraphic.screenHeight05, sText, {fontSize:"24px", fontFamily:"Arial", fill:"rgb(255,255,255)"}).setScrollFactor(0);
  setTimeout(function() {
    oDebugText.destroy();
  }, 500);
};
var Area = function(sizeX, sizeY) {
  this.sizeX = sizeX;
  this.sizeY = sizeY;
  this.squareXY = sizeX * sizeY;
  this.aaLevelBlocks = [["titan_green", "titan_gray"], ["titan_yellow", "titan_gray", "steel900"], ["titan_white", "titan_gray", "titan_ice", "block_ice"], ["titan_brown", "titan_gray"], ["titan_gray", "steel900", "standard400"]];
  this.aLevelBlocks = this.aaLevelBlocks[Main.getInstance().getLevelNum() - 1];
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
};
Area.prototype.init = function(oGame, oGraphic) {
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
  oGame.physics.add.collider(this.oElements, this.oBombs);
  oGame.physics.add.collider(this.oEnemies, this.oPlayer);
  oGame.physics.add.collider(this.oEnemies, this.oBombs);
  oGame.physics.add.collider(this.oArmors, this.oStars);
  oGame.physics.add.collider(this.oEnemies, this.oEnemies);
  oGame.physics.add.collider(this.oBombs, this.oBombs);
  oGame.physics.add.collider(this.oStars, this.oStars);
  oGame.physics.add.collider(this.oArmors, this.oArmors);
};
Area.prototype.isEmpty = function(x, y) {
  return !this.aaArea[x][y].element && !this.aaArea[x][y].object;
};
Area.prototype.createEmptyArea = function() {
  var aaArea = [];
  for (var x = 0; x <= this.sizeX; x++) {
    var aCells = [];
    for (var y = 0; y <= this.sizeY; y++) {
      aCells.push({element:null, object:null});
    }
    aaArea.push(aCells);
  }
  return aaArea;
};
Area.prototype.createElements = function() {
  var oElements = this.oGame.physics.add.staticGroup();
  var qBlocks = Math.floor(this.squareXY / 5);
  console.log("Area->createElements: qBlocks=" + qBlocks);
  var x, y;
  for (var i = 0; i < qBlocks; i++) {
    x = 1 + Math.floor(Math.random() * (this.sizeX - 0));
    y = 1 + Math.floor(Math.random() * (this.sizeY - 1));
    if (y % 2) {
      y++;
    }
    if (y <= 2) {
      continue;
    }
    this.aaArea[x][y].element = this.aLevelBlocks[Math.floor(Math.random() * this.aLevelBlocks.length)];
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
      var oCell = this.aaArea[x][y];
      if (oCell.element) {
        oElements.create(this.oGraphic.getPX(x), this.oGraphic.getPY(y), oCell.element);
      }
    }
  }
  return oElements;
};
Area.prototype.createPlayer = function() {
  var x, y, q;
  while (true) {
    q++;
    if (q > 1000) {
      return alert("Error 1");
    }
    x = 1 + Math.floor(Math.random() * this.sizeX);
    y = 1 + Math.floor(Math.random() * this.sizeY);
    if (this.isEmpty(x, y)) {
      break;
    }
  }
  this.aaArea[x][y].object = "player";
  var oPlayer = this.oGame.physics.add.sprite(this.oGraphic.getPX(x), this.oGraphic.getPX(y), "player").setVelocity(0, 0).setMass(1.2).setBounce(0.2).setCollideWorldBounds(true);
  oPlayer.body.setGravityY(250);
  return oPlayer;
};
Area.prototype.createEnemies = function() {
  var oEnemies = this.oGame.physics.add.group({collideWorldBounds:true, velocityX:100, velocityY:100, bounceX:1, bounceY:1});
  var qEnemies = Math.floor(this.squareXY / 20);
  console.log("qEnemies=" + qEnemies);
  for (var i = 0; i < qEnemies; i++) {
    var x = undefined, y, q = 0;
    while (true) {
      q++;
      if (q > 1000) {
        return alert("Error 2");
      }
      x = 2 + Math.floor(Math.random() * (this.sizeX - 2));
      y = 3 + Math.floor(Math.random() * (this.sizeY - 3));
      if (this.isEmpty(x, y)) {
        break;
      }
    }
    if (q >= 1000) {
      break;
    }
    this.aaArea[x][y].object = "enemy";
    oEnemies.create(this.oGraphic.getPX(x), this.oGraphic.getPY(y), "enemy");
  }
  return oEnemies;
};
Area.prototype.createStars = function() {
  var oStars = this.oGame.physics.add.group({gravityY:50, collideWorldBounds:true});
  var y = 2;
  for (var x = 2; x <= this.sizeX - 1; x++) {
    if (!this.isEmpty(x, y)) {
      console.error("Error 3");
      continue;
    }
    this.aaArea[x][y].object = "star";
    var oStar = oStars.create(this.oGraphic.getPX(x), this.oGraphic.getPX(y), "star");
    oStar.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
  }
  return oStars;
};
Area.prototype.createArmors = function() {
  var oArmors = this.oGame.physics.add.group({gravityY:50, mass:0.4, collideWorldBounds:true});
  var qArmors = Math.floor(this.squareXY / 50);
  console.log("qArmors=" + qArmors);
  for (var i = 0; i < qArmors; i++) {
    var x = undefined, y, q = 0;
    while (true) {
      q++;
      if (q > 1000) {
        return alert("Error 4");
      }
      x = 2 + Math.floor(Math.random() * (this.sizeX - 2));
      y = 3 + Math.floor(Math.random() * (this.sizeY - 3));
      if (this.isEmpty(x, y)) {
        break;
      }
    }
    if (q >= 1000) {
      break;
    }
    this.aaArea[x][y].object = "armor";
    var oArmor = oArmors.create(this.oGraphic.getPX(x), this.oGraphic.getPY(y), "armor");
    oArmor.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
  }
  return oArmors;
};
var Graphic = function(oArea) {
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
};
Graphic.prototype.preload = function(oGame, oArea) {
  oGame.load.setBaseURL("src");
  var progress = oGame.add.graphics();
  oGame.load.on("progress", function(value) {
    progress.clear();
    progress.fillStyle(170, 1);
    progress.fillRect(0, 270, 800 * value, 60);
  });
  oGame.load.on("complete", function() {
    progress.destroy();
  });
  oGame.load.image("font_retro", "img/fonts/16x16-blue-metal.png");
  oGame.load.spritesheet("button_custom", "img/ui/flixel-button.png", {frameWidth:80, frameHeight:20});
  var aLevelGrounds = ["grass", "sand", "ice", "dirt", "asphalt"];
  oGame.load.image("ground", "img/sprites/" + aLevelGrounds[Main.getInstance().getLevelNum() - 1] + ".png");
  for (var i = 0; i < this.oArea.aLevelBlocks.length; i++) {
    oGame.load.image(oArea.aLevelBlocks[i], "img/sprites/" + oArea.aLevelBlocks[i] + ".png");
  }
  oGame.load.image("star", "img/sprites/star.png");
  oGame.load.image("armor", "img/sprites/armor25.png");
  oGame.load.image("bomb", "img/sprites/bomb.png");
  oGame.load.image("particle_red", "img/particles/yellow.png");
  oGame.load.spritesheet("enemy", "img/sprites/enemy.png", {frameWidth:32, frameHeight:48});
  oGame.load.spritesheet("player", "img/sprites/player.png", {frameWidth:32, frameHeight:48});
  oGame.load.spritesheet("detonate", "img/sprites/explosion.png", {frameWidth:64, frameHeight:64, endFrame:23});
};
Graphic.prototype.init = function(oGame) {
  oGame.add.tileSprite(this.sizeXpx / 2, this.sizeYpx / 2, this.sizeXpx, this.sizeYpx, "ground");
  oGame.cache.bitmapFont.add("font_retro", Phaser.GameObjects.BitmapText.ParseRetroFont(oGame, {image:"font_retro", width:16, height:16, chars:"!\"#$%&'()*+,-./0123456789 ABCDEFGHIJKLMNOPQRSTUVWXYZ:", charsPerRow:20, spacing:{x:0, y:0}}));
  oGame.anims.create({key:"explode", frames:oGame.anims.generateFrameNumbers("detonate", {start:0, end:23, first:23}), frameRate:20});
  oGame.anims.create({key:"left", frames:oGame.anims.generateFrameNumbers("player", {start:0, end:3}), frameRate:10, repeat:-1});
  oGame.anims.create({key:"turn", frames:[{key:"player", frame:4}], frameRate:20});
  oGame.anims.create({key:"right", frames:oGame.anims.generateFrameNumbers("player", {start:5, end:8}), frameRate:10, repeat:-1});
  oGame.anims.create({key:"enemy_left", frames:oGame.anims.generateFrameNumbers("enemy", {start:0, end:3}), frameRate:10, repeat:-1});
  oGame.anims.create({key:"enemy_turn", frames:[{key:"enemy", frame:4}], frameRate:20});
  oGame.anims.create({key:"enemy_right", frames:oGame.anims.generateFrameNumbers("enemy", {start:5, end:8}), frameRate:10, repeat:-1});
  this.oParticles = oGame.add.particles("particle_red");
};
Graphic.prototype.getPX = function(x) {
  return this.wh05 + (x - 1) * this.wh;
};
Graphic.prototype.getPY = function(y) {
  return this.wh05 + (y - 1) * this.wh;
};
var ButtonRetro = function(config) {
  config = config || {};
  var oConfig = {};
  var counter = config.name ? "" : ButtonRetro.nextCounter();
  oConfig.sName = config.name || "button" + counter;
  if (ButtonRetro.oaCallbacks[oConfig.sName]) {
    console.error('Error in ButtonRetro! name "' + oConfig.sName + '" already use!');
  }
  oConfig.sTitle = config.title || "BUTTON" + counter;
  oConfig.sSpriteSheetName = config.spriteSheetName || "button_custom";
  oConfig.oScrollFactor = config.scrollFactor || null;
  oConfig.oScale = config.scale || null;
  oConfig.x = config.x || 0;
  oConfig.y = config.y || 0;
  oConfig.frame = config.frame || 0;
  oConfig.oText = {};
  var text = config.text || {};
  oConfig.oText.x = text.x || 5;
  oConfig.oText.y = text.y || 5;
  oConfig.oText.sFont = text.font || "font_retro";
  oConfig.oText.iTint = text.tint || null;
  var oButton = ButtonRetro.oGame.add.image(oConfig.x, oConfig.y, oConfig.sSpriteSheetName, oConfig.frame).setOrigin(0, 0).setInteractive().setName(oConfig.sName);
  if (oConfig.oScrollFactor) {
    oButton.setScrollFactor(oConfig.oScrollFactor[0], oConfig.oScrollFactor[1]);
  }
  if (oConfig.oScale) {
    oButton.setScale(oConfig.oScale[0], oConfig.oScale[1]);
  }
  oConfig.fClick = config.click || function() {
    console.warn("No callback function for button with name=" + this.name + "!");
  }.bind(oButton);
  ButtonRetro.setCallback(this, oConfig.sName, oConfig.fClick);
  var px = oConfig.x + oConfig.oText.x;
  var py = oConfig.y + oConfig.oText.y;
  var oText = ButtonRetro.oGame.add.bitmapText(px, py, oConfig.oText.sFont, oConfig.sTitle).setOrigin(0, 0);
  if (oConfig.oText.iTint !== null) {
    oText.setTint(oConfig.oText.iTint);
  }
  if (oConfig.oScrollFactor) {
    oText.setScrollFactor(oConfig.oScrollFactor[0], oConfig.oScrollFactor[1]);
  }
  oButton.oConfig = oConfig;
  oButton.oText = oText;
  this.oConfig = oConfig;
  this.oButton = oButton;
  this.oText = oText;
};
ButtonRetro.prototype.setText = function(sText) {
  this.oText.setText(sText);
};
ButtonRetro.setCallback = function(oInstance, sName, fClick) {
  ButtonRetro.oaCallbacks[sName] = {oInstance:oInstance, fCallback:fClick};
};
ButtonRetro.nextCounter = function() {
  return ++ButtonRetro.iButton;
};
ButtonRetro.oaCallbacks = {};
ButtonRetro.iButton = 0;