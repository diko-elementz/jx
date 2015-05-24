


function traverse(list, callback) {

	var l = list.length;

	var c = -1;

	var item;

	for (; l--;) {

		if (++c in list) {

			item = list[c];

			if (callback(item) == false) {
				break;
			}

		}

	}

}

function traverseReverse(list, callback) {

	var l = list.length;

	var item;

	for (; l--;) {

		if (l in list) {

			item = list[l];

			if (callback(item) == false) {
				break;
			}

		}

	}

}
