


/*****************************************************
 * TREE traverse
 ****************************************************/

/**
 * pre order iterate
 */
function preOrderIterate(root, callback) {
   var p = root;
   var depth = 0;
	var node;

	for (; p;) {

		// process p
		if (p.nodeType == 1) {
			if (callback(p) == false) {
				break;
			}
		}

		// go into first child
		node = p.firstChild;

		if (node) {

			depth++;

		}
      // go next sibling or parentNode's nextSibling
      else {

         node = p.nextSibling;

         for (; !node && depth-- && p;) {

            p = p.parentNode;
            node = p.nextSibling;

         }

      }

      p = node;

	}

	node = p = null;

}

/**
 * post order iterate
 */
function postOrderIterate(root, callback) {
   var p = root;
   var depth = 0;
	var node;

   main:for (; p;) {

		// go into first child
		node = p.firstChild;

		if (node) {

			depth++;

		}
      // go next sibling or parentNode's nextSibling
      else {

			// process p
			if (p.nodeType == 1) {
				if (callback(p) == false) {
					break;
				}
			}

         node = p.nextSibling;

         for (; !node && depth-- && p;) {

            p = p.parentNode;

				// process p
				if (p.nodeType == 1) {
					if (callback(p) == false) {
						break main;
					}
				}

            node = p.nextSibling;

         }

      }

      p = node;

	}

	node = p = null;

}


/**
 * level order iterate
 */
function levelOrderIterate(root, callback) {
	var queue = {
				node: root,
				next: null
			};
   var last = queue;
	var node, p;

	// iterate level siblings
	for (; queue; queue = queue.next) {

		node = queue.node;
		queue.node = null;

		// iterate siblings
		for (; node; node = node.nextSibling) {

			p = node.firstChild;
			if (callback(p) == false) {
				break;
			}

			// insert
			if (p) {

				last.next = { node: p, next: null };
				last = last.next;

			}

		}

	}

	last = queue = node = p = null;

}


/*****************************************************
 * TEST
 ****************************************************/

function log(p) {
	if (p && p.nodeType == 1) {
		console.log(p);
	}

}

/**
 *	get nodes
 */
function getNodesAt(node) {
	var nodes = [];
	var	len = 0;

	levelOrderIterate(node,
      function (p) {
         nodes[len++] = p;
      });

	return nodes;
}

console.log({
	fn: getNodesAt(document.body)
});
