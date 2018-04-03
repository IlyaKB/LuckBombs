export default class ButtonRetro {
	
	constructor(config) {
		
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
		
		let oButton = ButtonRetro.oGame.add.image(oConfig.x, oConfig.y, oConfig.sSpriteSheetName, oConfig.frame)
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
		let oText = ButtonRetro.oGame.add.bitmapText(px, py, oConfig.oText.sFont, oConfig.sTitle)
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
	
	static nextCounter() {
		return ++ButtonRetro.iButton;
	}
}

ButtonRetro.oaCallbacks = {};
ButtonRetro.iButton = 0;