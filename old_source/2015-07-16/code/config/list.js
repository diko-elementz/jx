Jx("code/config/list", function () {

   return {

      '@type': 'class',

      state: null,

      pointer: null,

		next: null,

      constructor: function (pointer) {

         if (pointer) {

            this.pointer = pointer;

         }

      },

		point_to: function (list) {

			var p = this;

			var pointer;

			for (; p; p = p.next) {

				for (pointer = p.pointer; pointer; pointer = pointer.next) {

					if (!pointer.to) {

						pointer.to = list;

					}

				}

			}

		},

		append: function (list) {

			var p = this;

			// append list
			for (; p.next; p = p.next);

			p.next = list;

		},

		apply_state: function (state) {

			var list = this;

			// apply state to lists
			for (; list; list = list.next) {

				list.state = state;

			}

			state.list = this;

		},

		clone_pointers_from: function (generator, list, to) {

			var pointer = null;

			var first = null;

			var p, c;

			// iterate list to clone
			for (; list; list = list.next) {

				for (p = list.pointer; p; p = p.next) {

					if (pointer) {

						pointer.next = generator.create_pointer(p.symbol);

						pointer = pointer.next;

					}
					else {

						first = pointer = generator.create_pointer(p.symbol);

					}

					pointer.to = to || p.to;

				}

			}

			// append
			p = this.pointer;

			if (p) {

				for (; p.next; p = p.next);

				p.next = first;

			}
			else {

				this.pointer = first;

			}

			return first;

		}

   };

});
