Jx("code/config/fragment",

	// requires
	"class/base",

function(Class) {

	var seed_id = 0;

   return {

      '@type': 'class',

      incoming: null,

		outgoing: null,

		split_list: null,

		point_back: null,

		capture: null,

		is_captured: false,

      constructor: function(incoming, outgoing) {

         var l, p;

			this.id = 'f' + (++seed_id);

         this.incoming = incoming;

         if (!outgoing) {

            outgoing = [];

            l = 0;

            for (p = incoming.pointer; p; p = p.next) {

               outgoing[l++] = p;

            }

         }

         this.outgoing = outgoing;

      },

		clone: function() {

			var clone = Class.clone(this);

			var source, target;

			var split = this.split_list;

			var back = this.point_back;

			if (split) {

				clone.split_list = split.slice(0);

			}

			if (back) {

				clone.point_back = back.slice(0);

			}

			clone.outgoing = this.outgoing.slice(0);

			// reset captured
			clone.is_captured = false;

			clone.clone_base = this;

			clone.id = 'f' + (++seed_id);

			return clone;

		},

		combine: function(fragment) {

			var clone = this.clone();

			var p, source, target;

			// combine incoming
			for (p = clone.incoming.pointer; p.next; p = p.next);

			p.next = fragment.incoming.pointer;

			// combine split
			source = fragment.split_list;

			if (source) {

				target = clone.split_list;

				if (target) {

					target.push.apply(target, source);

				} else {

					clone.split_list = source.slice(0);

				}

			}

			// combine point back
			source = fragment.point_back;

			if (source) {

				target = clone.point_back;

				if (target) {

					target.push.apply(target, source);

				} else {

					clone.point_back = source.slice(0);

				}

			}

			// combine outgoing
			target = clone.outgoing;

			target.push.apply(target, fragment.outgoing);

			clone.add_capture(fragment);

			return clone;

		},

		add_split: function(recreate) {

			var clone = recreate ? this.clone() : this;

			var list = clone.incoming;

			var slist = clone.split_list;

			if (slist) {

				slist[slist.length] = list;

			} else {

				clone.split_list = [ list ];

			}

			return clone;

		},

		add_recurrence: function(recreate) {

			var clone = recreate ? this.clone() : this;

			var list = clone.incoming;

			var slist = clone.point_back;

			if (slist) {

				slist[slist.length] = list;

			} else {

				clone.point_back = [ list ];

			}

			return clone;

		},

		point: function(state) {

			var outgoing = this.outgoing;

			var incoming = this.incoming;

			var point_back_list = this.point_back;

			var target_list = state.pointers;

			var l = outgoing.length;

			var p, c, point_back_incoming, pointer, tp;

			for (c = -1; l--;) {

				p = outgoing[++c];

				if (!p.point_to_list) {

					p.point_to_list = target_list;

				}

			}

			if (point_back_list) {

				// goto end of list
				for (tp = target_list.pointer;
					  tp && tp.next;
					  tp = tp.next);

				// point back list
				for (c = -1, l = point_back_list.length; l--;) {

					point_back_incoming = point_back_list[++c];

					p = point_back_incoming.pointer;

					// append target pointers
					for (; p; p = p.next) {

						pointer = p.clone();

						pointer.from_list = target_list;

						pointer.point_to_list = p.point_to_list;

						if (tp) {

							tp.next = pointer;

						} else {

							target_list.pointer = pointer;

						}

						tp = pointer;

						pointer.is_point_back = true;

						//console.log('point back! ', pointer, 'before: ', state.fragment_before, " current ", this);

						console.log('is point back ', pointer, ' list: ', target_list, ' id: ', this.id);

					}

				}

			}

		},

		apply_split: function(fragment) {

			var incoming = fragment.incoming;

			var outgoing = fragment.outgoing;

			var first = incoming.pointer;

			var list = this.split_list;

			var is_captured = this.is_captured;

			var p, c, l, plist, pointer, ol, plist_pointer;

			if (list) {

				l = list.length;

				ol = outgoing.length;

				for (c = -1; l--;) {

					plist = list[++c];

					plist_pointer = plist.pointer;

					// find last pointer
					for (; plist_pointer.next; plist_pointer = plist_pointer.next);

					// iterate incoming list and clone them as "split list" outgoing
					for (p = first; p; p = p.next) {

						pointer = p.clone();

						pointer.from_list = plist;

						plist_pointer.next = pointer;

						plist_pointer = pointer;

						// append to outgoing
						outgoing[ol++] = plist_pointer;

						console.log('applied split pointer: ', plist_pointer);

					}

				}

			}

		},

		set_capture: function() {

			var fragment = this.clone();

			fragment.capture = {

				fragment: fragment,

				next: null

			}

			// sync outgoing
			//fragment.outgoing = this.outgoing;

			fragment.is_captured = true;

			fragment.add_capture(this);

			// clone
			return fragment;

		},

		add_capture: function() {

			var current = this.capture;

			var fragment, p, c, l, to_add;

			for (c = -1, l = arguments.length; l--;) {

				fragment = arguments[++c];

				to_add = fragment.capture;

				if (current) {

					for(; current.next; current = current.next);

					current.next = to_add;

				} else {

					this.capture = current = to_add;

				}

			}

			return this;

		}

   };

});
