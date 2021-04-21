/**
 * JSON Token Replace
 * =====================
 * Replace the token string {{hello}} in json with value from another json where key is token {"hello":"bye"}
 *
 * @contributors: Patryk Rzucidło [@ptkdev] <support@ptkdev.io> (https://ptk.dev)
 *
 * @license: MIT License
 *
 */
class JsonTokenReplace {
	/**
	 * replace()
	 * =====================
	 * Replace token string {{hello}} in json with value from another json where key is token {"hello":"bye"}
	 *
	 * @param {Object} json_tokens - input json (mandatory, default: undefined)
	 * @param {Object} json_input - json with tokens (optional, deafult: string)
	 * @param {string} start - prefix token string (optional, deafult: {{)
	 * @param {string} end - suffix token string (optional, deafult: }})
	 *
	 * @return {Object} json - returns the json object with the replaced tokens
	 *
	 */
	replace(json_tokens, json_input, start = "{{", end = "}}") {
		let json_string = JSON.stringify(json_input);
		for (let key in json_tokens) {
			let regex = new RegExp(start + key + end, "g");
			json_string = json_string.replace(regex, json_tokens[key]);
		}

		return JSON.parse(json_string);
	}
}

module.exports = JsonTokenReplace;