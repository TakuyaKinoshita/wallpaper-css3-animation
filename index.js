'use strict';

export var scriptProperties = createScriptProperties()
	.addSlider({
		name: 'dulation',
		label: 'animation-dulation',
		value: 0.5,
		min: 0,
		max: 100,
		integer: false
	})
	.addCombo({
		name: 'timingFunction',
		label: 'animation-timing-function',
		options: [{
			label: 'ease',
			value: 'ease'
		}, {
			label: 'linear',
			value: 'linear'	
		}, {
			label: 'ease-in',
			value: 'easeIn'
		}, {
			label: 'ease-out',
			value: 'easeOut'
		}, {
			label: 'ease-in-out',
			value: 'easeInOut'
		}, {
			label: 'pop-over',
			value: 'popOver'
		}]
	})
	.addSlider({
		name: 'delay',
		label: 'animation-delay',
		value: 0,
		min: 0,
		max: 100,
		integer: false
	})
	.addText({
		name: 'iterationCount',
		label: 'animation-iteration-count',
		value: 'please write infinite or Number of count. default value is infinite'
	})
	.addCombo({
		name: 'direction',
		label: 'animation-direction',
		options: [{
			label: 'normal',
			value: 'normal'
		}, {
			label: 'reverse',
			value: 'reverse'
		}, {
			label: 'alternate',
			value: 'alternate'
		}, {
			label: 'alternateReverse',
			value: 'alternate-reverse'
		}]
	})
	.addCombo({
		name: 'fillMode',
		label: 'animation-fill-mode',
		options: [{
			label: 'none',
			value: 'none'
		}, {
			label: 'forwards',
			value: 'forwards'
		}, {
			label: 'backwards',
			value: 'backwards'
		}, {
			label: 'both',
			value: 'both'
		}]
	})
	.addCombo({
		name: 'playState',
		label: 'animation-play-state',
		options: [{
			label: 'running',
			value: 'running'
		}, {
			label: 'paused',
			value: 'paused'
		}]
	})
	.addText({
		name: 'name',
		label: 'animation-name',
		value: 'scaleUp'
	})
	.addText({
		name: 'keyframe',
		label: 'animation-keyframe (only x, y, z keys)',
		value: '@keyframes scaleUp { 0%{x: 1; y: 1;} 40%{x: 1.5; y: 1.6;} 100%{x: 2; y: 2;}} @keyframes scaleDown { from{x: 2; y: 2;} to{x: 1, y: 1}}'
	})
	.finish();

// animation propeties
let time = 0;
let dulation;
let initFlg = true;
let cubic;
let diff;
let progress = 0;
let delayCount = 0;

// keyframe parse
// refarence
// https://github.com/YerkoPalma/keyframe-parser/blob/master/index.js

// private css3 propeties
let aDulation,
	aTimingFunction,
	aDelay,
	aIterationCount,
	aDirection,
	aFillMode,
	aPlayState,
	aName,
	aKeyframe;

/**
 * @param {Number} $x1
 * @param {Number} $y1
 * @param {Number} $x2
 * @param {Number} $y2
 * @retun {Function}
 */
let CubicBezier = function($x1, $y1, $x2, $y2) {
	let cx = 3 * $x1,
		bx = 3 * ($x2 - $x1) - cx,
		ax = 1 - cx - bx;
	let cy = 3 * $y1,
		by = 3 * ($y2 - $y1) - cy,
		ay = 1 - cy - by;
	let bezierX = function($t) {
		return $t * (cx + $t * (bx + $t * ax));
	};
	let bezierDX = function($t){
		return cx + $t * (2 * bx + 3 * ax * $t);
	};
	let newtonRaphson = function($x) {
		if($x <= 0) return 0;
		if($x >= 1) return 1;
		let prev, t = $x;
		do {
			prev = t;
			t = t - ((bezierX(t) - $x) / bezierDX(t));
		} while (Math.abs(t - prev) > 1e-4);
		return t;
	};
	return function($t) {
		let t = newtonRaphson($t);
		return t * (cy + t * (by + t * ay));
	};
};

/**
 * @see https://github.com/YerkoPalma/keyframe-parser/blob/master/index.js
 */
let Keyframe = function($keyframes) {
	let regexMainBlock = /\s*@keyframes\s*(\w*)\s*{(.*)}/;
	let regexBlocks = /[\w+,\s|\d+%,\s]*\s*{\s*([\w\-\d.:\s(),;%]*)\s*}/g;
	let regexBlockKey = /([\w\s%,])*{/;
	$keyframes = $keyframes
	let args = $keyframes.split(/(?=@)/);
	let xtend = function() {
		let hasOwnProperty = Object.prototype.hasOwnProperty;
		let target = {}
		for (let i = 0; i < arguments.length; i++) {
			var source = arguments[i]
			for (let key in source) {
				if (hasOwnProperty.call(source, key)) {
					target[key] = source[key]
				}
			}
		}
		return target
	}
	function keyToOffset($key) {
		$key = $key.trim();
		if ($key.indexOf('from') > -1) return 0;
		if ($key.indexOf('to') > -1) return 1;
		return parseInt($key) / 100;
	}
	function getKeyframeStr($name) {
		let keyframsList = Object.create(null);
		for (let arg of args) {
			keyframsList[arg.match(regexMainBlock)[1]] = arg.match(regexMainBlock)[2].trim();
		}
		return keyframsList[$name];
	}
	function blockToContent($block) {
		$block = $block.substring($block.indexOf('{') + 1, $block.indexOf('}')).trim();
		console.log(`block {${$block}}`);
		let data = Object.create(null);
		let rules = $block.split(';');
		console.log(`rules ${rules}`);
		console.log(`rules.length ${rules.length}`);
		for (let rule of rules) {
			console.log(`rule ${rule}`);
			let key = rule.split(':')[0].trim();
			if (key) {
				let value = rule[1].trim();
				data[key] = value
			}
		}
		console.log(`data ${JSON.stringify(data)}`);
		return data
	}
	function mix($keys, $data) {
		let frames = [];
		for (let i = 0; i < $keys.length; i++) {
			frames[i] = xtend($data, { offset: $keys[i] })
		}
		console.log(JSON.stringify(frames))
		return frames
	}
	return function($name) {
		let keyframes = [];
		let mainBlock = getKeyframeStr($name);
		let blocks = mainBlock.match(regexBlocks);
		for (let block of blocks) {
			let keys = block.match(regexBlockKey)[0].trim().split(',');
			keys = keys.map(keyToOffset);
			let content = blockToContent(block);
			keyframes = keyframes.concat(mix(keys, content));
		}
		return keyframes;
	}
}

/**
 * @param {Vec3} value - for property 'scale'
 * @return {Vec3} - update current property value
 */
export function init(value) {
	return value;
}

/**
 * @param {Vec3} value - for property 'scale'
 * @return {Vec3} - update current property value
 */
export function update(value) {
	if (initFlg) {
		animationInit();
		time = 0;
		diff = scriptProperties.scaleMax - scriptProperties.scaleMin;
		dulation = scriptProperties.dulation;
		switch(aTimingFunction) {
			case 'ease':
			cubic = CubicBezier(0.25, 0.1, 0.25, 0.1);
			break;
			case 'linear':
			cubic = CubicBezier(0, 0, 1, 1);
			break;
			case 'easeIn':
			cubic = CubicBezier(0.42, 0, 1, 1);
			break;
			case 'easeOut':
			cubic = CubicBezier(0, 0, 0.58, 1);
			break;
			case 'easeInOut':
			cubic = CubicBezier(0.42, 0, 0.58, 1);
			break;
			case 'popOver':
			cubic = CubicBezier(0.45, 1.17, 0.69, 1.1);
			break;
		}
		initFlg = false;
		return value;
	}

	if (delayCount > 0) {
		delayCount -= engine.frametime;
		return value;
	}

	// progress = time / dulation;
	// console.log(progress);
	// if (progress >= 0) {
	// 	value.x = diff * cubic(progress);
	// 	value.y = diff * cubic(progress);
	// }
	// if (progress >= 1) {
	// 	initFlg = true;
	// }
	// time += engine.frametime;
	return value;
}

function animationInit() {
	aDulation = scriptProperties.dulation;
	aTimingFunction = scriptProperties.timingFunction;
	aDelay = scriptProperties.delay;
	aIterationCount = scriptProperties.iterationCount;
	if (aIterationCount !== 'infinite') {
		if (isNaN(aIterationCount)) {
			aIterationCount = Number(aIterationCount);
		} else {
			aIterationCount = 'infinite';
		}
	}
	aDirection = scriptProperties.direction;
	aFillMode = scriptProperties.fillMode;
	aPlayState = scriptProperties.playState;
	aName = scriptProperties.name;
	aKeyframe = Keyframe(scriptProperties.keyframe);
	console.log(JSON.stringify(aKeyframe(aName)));
}
