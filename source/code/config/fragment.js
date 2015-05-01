Jx("code/config/fragment", function() {

   return {

      '@type': 'class',

      incoming: null,

		outgoing: null,

		split_list: null,

		point_back: null,

      constructor: function(incoming, outgoing) {

         var l, p;

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

		add_split: function(list) {

			var slist = this.split_list;

			if (slist) {

				slist[slist.length] = list;

			} else {

				this.split_list = [ list ];

			}

		},

		add_recurrence: function(list) {

			var slist = this.point_back;

			if (slist) {

				slist[slist.length] = list;

			} else {

				this.point_back = [ list ];

			}



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

				// point back list
				l = point_back_list.length;

				// goto end of list
				for (tp = target_list.pointer;
					  tp && tp.next;
					  tp = tp.next);

				for (c = -1; l--;) {

					point_back_incoming = point_back_list[++c];

					p = point_back_incoming.pointer;

					// append target pointers
					for (; p; p = p.next) {

						pointer = p.clone();

						pointer.point_to_list = p.point_to_list;

						if (tp) {

							tp.next = pointer;

						} else {

							target_list.pointer = pointer;

						}

						tp = pointer;

					}

				}

			}

		},

		combine: function(fragment) {

			var me_incoming = this.incoming;

			var target_incoming = fragment.incoming;

			var me_split = this.split_list;

			var target_split = fragment.split_list;

			var me_point_back = this.point_back;

			var target_point_back = fragment.point_back;

			var me_outgoing = this.outgoing;

			var target_outgoing = fragment.outgoing;

			var p, t, new_split;

			// go to last list
			for (p = me_incoming.pointer; p.next; p = p.next);

			p.next = target_incoming.pointer;

			// combine incoming
			target_incoming.pointer = me_incoming.pointer;

			// combine split
			if (me_split && target_split) {

				me_split.push.apply(me_split, target_split);

			} else if (target_split) {

				me_split = this.split_list = target_split;

			}

			fragment.split_list = me_split;

			// combine point back
			if (me_point_back && target_point_back) {

				me_point_back.push.apply(me_point_back, target_point_back);

			} else if (target_point_back) {

				me_point_back = this.point_back = target_point_back;

			}

			fragment.split_point_back = me_point_back;

			// combine outgoing
			me_outgoing.push.apply(me_outgoing, target_outgoing);

			fragment.outgoing = me_outgoing;


		},

		apply_split: function(fragment) {

			var incoming = fragment.incoming;

			var outgoing = fragment.outgoing;

			var first = incoming.pointer;

			var list = this.split_list;

			var p, c, l, plist, pointer, ol;

			if (list) {

				l = list.length;

				ol = outgoing.length;

				for (c = -1; l--;) {

					plist = list[++c].pointer;

					// find last pointer
					for (plist; plist.next; plist = plist.next);

					// iterate incoming list and clone them as "split list" outgoing
					for (p = first; p; p = p.next) {

						pointer = p.clone();

						plist.next = p;

						plist = p;

						// append to outgoing
						outgoing[ol++] = plist;

					}

				}

			}

		}

   };

});
