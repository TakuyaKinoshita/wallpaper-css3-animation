
/**
 * @see https://github.com/YerkoPalma/keyframe-parser/blob/master/index.js
 */
let Keyframe = function($keyframes) {
  let arglen = arguments[0].length
  let result = ''
  for (let i = 0; i < arglen; i++) {
    let arg = arguments[ i + 1 ] || ''
    result += $keyframes[i] + arg
  }
  result = result.trim().replace(/\s+/g, ' ')
	let regexMainBlock = /\s*@keyframes\s*(\w*)\s*{(.*)}/
	let regexBlocks = /[\w+,\s|\d+%,\s]*\s*{\s*([\w\-\d.:\s(),;%]*)\s*}/g
	let regexBlockKey = /([\w\s%,].*(?={))/
	let args = result.split(/(?=@)/)
	let xtend = function() {
		let hasOwnProperty = Object.prototype.hasOwnProperty
		let target = {}
		for (let i = 0; i < arguments.length; i++) {
			var source = arguments[i]
			for (let key in source) {
				if (hasOwnProperty.call(source, key)) target[key] = source[key]
			}
		}
		return target
	}
	function keyToOffset($key) {
		$key = $key.trim()
		if ($key.indexOf('from') > -1) return 0
		if ($key.indexOf('to') > -1) return 1
		return parseInt($key) / 100
	}
  /**
   * 
   * @param {String} $name 
   * @returns {String}
   */
	function getMainBlock($name) {
    /**
     * @type {Object} res
     */
		let res = {}
		for (let arg of args) {
			res[arg.match(regexMainBlock)[1]] = arg.match(regexMainBlock)[2].trim()
		}
		return res[$name]
	}
  /**
   * 
   * @param {String} $block 
   * @returns {Object}
   */
	function blockToContent($block) {
		$block = $block.substring($block.indexOf('{') + 1, $block.indexOf('}')).trim()
		let data = Object.create(null)
		let rules = $block.split(';').map(e=>e.trim())
		for (let rule of rules) {
      rule = rule.split(':')
			let key = rule[0].trim()
			if (key) data[key] = rule[1].trim()
		}
		return data
	}
	function mix($keys, $data) {
		let frames = []
		for (let i = 0; i < $keys.length; i++) {
			frames[i] = xtend($data, { offset: $keys[i] })
		}
		return frames
	}
	return function($name) {
		let keyframes = []
		let mainBlock = getMainBlock($name)
		let blocks = mainBlock.match(regexBlocks).map(e=>e.trim())
		for (let block of blocks) {
			let keys = block.match(regexBlockKey)[0].trim().split(',')
			keys = keys.map(keyToOffset)
			let content = blockToContent(block)
			keyframes = keyframes.concat(mix(keys, content))
		}
		return keyframes
	}
}

let anim1 = '@keyframes scaleUp { 0%{x: 1; y: 1;} 40%{x: 1.5; y: 1.6;} 100%{x: 2; y: 2;}} @keyframes scaleDown { from{x: 2; y: 2;} to{x: 1, y: 1}}'
let animKeyfram = Keyframe(anim1)
let animframe = animKeyfram('scaleUp')
console.dir(animframe)