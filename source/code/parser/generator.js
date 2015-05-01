Jx('code/parser/generator',

   // requires
	'code/config/state/generator',

function(Generator) {

	var $ = Jx;

	return {

		'@extend': Generator,

		'@singleton': true,

		fragments: null,

		constructor: function() {

			this.$super(arguments);

			this.fragments = {};

		},

		on_create: function(definition, name, rpn) {

			this.$super(arguments);

		},

		on_finalize_states: function(definition, fragment, new_states) {

			this.$super(arguments);

			// register fragmentl

		},

		apply_to: function(definition, rule, state) {

		},

		prepare_definitions: function(definition) {

			this.$super(arguments);

		}

	};

});
