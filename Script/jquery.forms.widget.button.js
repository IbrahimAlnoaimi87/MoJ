(function ($) {

    if (typeof SourceCode === "undefined" || SourceCode === null) SourceCode = {};
    if (typeof SourceCode.Forms === "undefined" || SourceCode.Forms === null) SourceCode.Forms = {};
    if (typeof SourceCode.Forms.Widget === "undefined" || SourceCode.Forms.Widget === null) SourceCode.Forms.Widget = {};

    SourceCode.Forms.Widget.Button =
	{
		//Enum: types define the icons, but also the styling of the button and its states.
		types: [
			"help",
			"forward",
			"backward",
			"lookup",
			"finish",
			"cancel",
			"save",
			"clearsearch",
			"filter",
			"leftpaneltoggle", 
			"rightpaneltoggle"
		],

		//Enum: these are theme-agnostic button styles
		buttonStyles: [
			"primary", //main call-to action button
			"secondary", //less prominent button for verbs
			"normal", //default - no specific prominence.
			"icon" //icon-only button - typically doesn't have a border/background in normal state.
		],

		//Enum: behaviors are whether the button is considered a toggle button or not.
		behaviors: [
			"normal",
			"toggle"
		],

		_behavior: null,

		_buttonStyle: null, 

		//maintains the state of the button's toggle behaviour
		_toggled: false,

		//constant for the class added when the toggle-button is toggled on.
		_TOGGLE_STATE_CLASS:  "st-toggle-on",

	    _create: function () {
	        var o = this.options;
	        //test if element exists
	        if ((this.element) && ($(this.element).hasClass("button") || $(this.element).hasClass("toolbar-button")))
	            this._adoptValues();
	        else {
	            var id = this.element.attr("id");
	            this.element = this.element.replaceWith(this.html(o));
	            this.element.attr("id", id);
	        }

	        if (o.id) this.id = o.id;
	        if (o.disabled) this.disabled = o.disabled;
	        if (o.type) this.type = o.type;
	        if (o.parent) this.parent = o.parent;

	        if (o.container) {
	            $(o.container).append(this.element);
	        }

	        if (o.click) {
	            this.addClickEvent(o.click);
	        }

	        if (!!o.behavior && o.behavior === "toggle") {
	        	this.element.on('click', this._click.bind(this));
	        }

	        if (o.toggled === true) {
	        	this._toggled = true;
	        }

	        this.element.on("click", function () {
	            this.blur();
	        });

	        if (SourceCode.Forms.Browser.msie) this.element.attr("onclick", "return false;");

			//Basic Interaction User Story.
			//Buttons should not get a visual focus state when clicked on with the *mouse*
			//They should only get a visual focus state when the keyboard navigates to them.
			//this is how <button> elements work with outlines.
			this.element.on("mousedown", this._mousedown.bind(this));
			this.element.on("focus", this._focus.bind(this));
			this.element.on("blur", this._blur.bind(this));
	    },

	    _click: function(e)
	    {
	    	if (!!this.options.behavior && this.options.behavior === "toggle")
	    	{
	    		this._change();
	    	}
	    },

		//Happens when the toggle state is changed (from toggled to not toggled)
		//could happen via a click or a keyboard interaction (future)
		_change: function(ev)
		{
			this._toggled = !this._toggled;

			if (this._toggled === true)
			{
				this.element.addClass(this._TOGGLE_STATE_CLASS);
			}
			else
			{
				this.element.removeClass(this._TOGGLE_STATE_CLASS);
			}
			this._trigger("change", ev);
		},

		//See - Basic Interaction User Story.
		_mousedown: function (e){
			this.element.attr("data-mouseevent", "true");
		},

		//See - Basic Interaction User Story.
		_focus: function (e){
			if(!this.element.attr("data-mouseevent")){
				this.element.addClass("focus");
			}
		},

		//See - Basic Interaction User Story.
		_blur: function (e){
			this.element.attr("data-mouseevent", "");
			this.element.removeClass("focus");
		},

	    disable: function () {
			this.disabled = true;

	        if (!this.element.hasClass('disabled')) {
	            this.element.addClass('disabled');
	            this.element.prop("disabled", true);
	        }
	        if (!!this.element.attr("href")) {
	        	this.element.attr("data-oldhref", this.element.attr("href"));
	            this.element.removeAttr("href");
	        }
	        this.element.attr("tabIndex", "-1"); //should probably cache the current tabindex


	    	//LG: Not sure the purpose of these lines in this widget (this element has to be jq object already?!)
			//if (this.element.jquery !== undefined && $) {
	        //    this.element = $(_element[0]);
	        //}

	        //if (this.element.disable && $)
	        //    this.element.disable();
	    },

	    enable: function () {
			this.disabled = false;
	        if (this.element.hasClass('disabled')) {
	            this.element.removeClass('disabled');
	            this.element.prop("disabled", false);
	        }
	        if (!!this.element.attr("data-oldhref")) {
	        	this.element.attr("href", this.element.attr("data-oldhref"));
	        }
	        this.element.removeAttr("tabIndex"); //should probably re-instate any previous tabindex

			//LG: Not sure the purpose of these lines in this widget (this element has to be jq object already?!)
			//if (this.element.jquery !== undefined && $)
	        //    this.element = $(_element[0]);

	        //if (this.element.enable && $)
	        //    this.element.enable();
	    },

	    loading: function () {
	        //TODO: preserve the width of the element.

	        this.element.removeClass("disabled");
	        this.element.addClass("loading");
	    },

	    complete: function (callback) {
	        var $this = this;
	        this.element.addClassTransition("complete", function () {
	            $this.element.removeClass("loading complete disabled error");
				if (typeof callback === "function") callback();
	        }, ".button");
	    },

		error: function (callback) {
	        var $this = this;
	        this.element.addClassTransition("error", function () {
	            $this.element.removeClass("loading complete disabled error");
				if (typeof callback === "function") callback();
	        }, ".button");
	    },

	    html: function (o) {
	        if (!o) {
	            o = this.options;
	        }
	        var wrapperE = $("<div></div>");
	        wrapperE.html("<a class='button' href='javascript:;'><span class=\"button-wrapper\"><span class=\"button-text\">" + (o.text ? o.text : '') + "</span></span></a>");
	        var actualE = wrapperE.find("a");
	        if (o.title)
	            actualE.attr("title", o.title);
	        if (o.id)
	            actualE.attr("id", o.id);

	        if (this.types.contains(o.type)) {
	            this.type = o.type;
	            actualE.addClass(this.type);
	        }

			//button styles - add classes to the view (html) 
	        if (this.buttonStyles.contains(o.buttonstyle))
	        {
	        	this._buttonStyle = o.buttonstyle;
	        	switch (this._buttonStyle.toLowerCase()) {
	        		case "normal": break;
	        		case "primary": actualE.addClass("buttonstyle-primary"); break;
	        		case "secondary": actualE.addClass("buttonstyle-secondary"); break;
	        		case "icon": actualE.addClass("buttonstyle-icon"); break;
	        	}
	        }

			//behaviors - add classes to the view (html) 
	        if (this.behaviors.contains(o.behavior)) {
	        	this._behavior = o.behavior;
	        	switch (this._behavior.toLowerCase())
				{
	        		case "normal" : break;
	        		case "toggle": 
	        			actualE.addClass("toggle-button");
	        			if (o.toggled === true) actualE.addClass(this._TOGGLE_STATE_CLASS);
 	        			break;
	        		
	        	}
	        }

	        if (!o.enabled && o.enabled === false) {
	            o.disabled = true;
	            actualE.addClass("disabled");
	        }
	        return wrapperE.html();
	    },

	    _adoptValues: function () {
	        if ($(this.element).attr("id") !== "")
	            this.options.id = $(this.element).attr("id");
	        if ($(this.element).text().trim() !== "")
	            this.options.text = $(this.element).text().trim();

	        var _classes = jQuery(this.element)[0].className.split(" ");
	        for (var i = 0; i < _classes.length; i++) {
	            if (this.types.contains(_classes[i])) {
	                this.options.type = _classes[i];
	                break;
	            }
	        }
	    },

		//for switch/toggle buttons
	    isToggledOn: function ()
	    {
	    	return this._toggled === true;
	    },

		//for switch/toggle buttons
	    isToggledOff: function ()
	    {
	    	return this._toggled === false;
	    },
	   
		//LG: Old toggle function - incorrectly named, this is for Enabling/Disabling the button.
	    toggle: function () {
	        if (this.disabled) {
	            this.enable();
	        } else {
	            this.disable();
	        }
	    },

	    remove: function () {
	        this.element.remove();
	        this.element = null;
	    },

	    addClickEvent: function (fn) {
	        this.element.on('click', fn);
	    }

	};

    $.widget("ui.k2button", SourceCode.Forms.Widget.Button);
    $.extend($.ui.k2button.prototype,
	{
	    options:
		{
		    click: null, //handler for the click event
		    preserveWidthDuringProgress: false, //makes sure the button doesn't shrink when going into progress state (label migh be removed)
		    enabled: true,
		    element: null,
		    id: "",
		    disabled: false,
		    type: "",
		    container: null,
		    title: null
		}
	});


    SourceCode.Forms.Widget.ButtonGroup =
	{
	    alignments: ["left", "right"],
	    _create: function () {
	        var o = this.options;
	        this.id = null;
	        this.buttons = [];
	        this.parent = null;

	        if ((this.element) && $(this.element))
	            this._adoptValues();
	        else
	            this.element.replaceWith(this.html(o));

	        if ((o.id)) this.id = o.id;
	        if ((o.alignment)) this.alignment = o.alignment;
	        if ((o.parent)) this.parent = o.parent;

	        if ((this.element)) {
	            this.element = $(this.element);
	            if (o.adoptChildren) this._adoptChildren();
	        }
	        if ((o.buttons) && o.buttons.length && o.buttons.length > 0) {
	            for (var i = 0; i < o.buttons.length; i++) {
	                this.addButton(o.buttons[i]);
	            }
	        }
	    },

	    html: function (o) {
	        var wrapperE = $("<div></div>");
	        if (!o)
	            o = (this.options) ? this.options : {};
	        wrapperE.html("<div class='button-group'></div>");
	        var actualE = wrapperE.find(".button-group");

	        if ((o.id))
	            actualE.attr("id", o.id);

	        if (this.alignments.contains(o.alignment))
	        	actualE.addClass(o.alignment);

	        return wrapperE.html();
	    },

	    _adoptValues: function () {
	        if ($(this.element).attr("id") !== "")
	            this.options.id = $(this.element).attr("id");
	        var _classes = $(this.element)[0].className.split(" ");
	        for (var i = 0; i < _classes.length; i++) {
	            if (this.alignments.contains(_classes[i])) {
	                this.options.alignment = _classes[i];
	                break;
	            }
	        }
	    },

	    _adoptChildren: function () {
	        if ($(this.element).find('a.button').length) {
	            var buttons = jQuery(this.element).find('a.button');
	            for (var i = 0; i < buttons.length; i++) {
	                this.addButton(buttons[i]);
	            }
	        }
	    },

	    addButton: function (button) {
	        var jqButton = $(button);
	        this.element.append(jqButton);
	        var uiButton = jqButton.k2button();
	        this.buttons.push(uiButton);
	        return uiButton;
	    },

	    addButtonFromOptions: function (options) {
	        button = SourceCode.Forms.Widget.Button.html(options);
	        var jqButton = $(button);
	        this.element.append(jqButton);
	        var uiButton = jqButton.k2button(options);
	        this.buttons.push(uiButton);
	        return uiButton;
	    },

	    clear: function () {
	        for (var i = 0; i < this.buttons.length; i++) {
	            this.buttons[i].remove();
	        }
	        this.buttons = [];
	    },

	    findButton: function (buttonId) {
	        for (var i = 0; i < this.buttons.length; i++) {
	            if (buttonId === this.buttons[i].k2button("option").id ||
				buttonId === this.buttons[i].element.id) {
	                return this.buttons[i];
	            }
	        }
	        return false;
	    },

	    remove: function () {
	        this.clear();
	        this.element.remove();
	    }
	};

    $.widget("ui.buttonGroup", SourceCode.Forms.Widget.ButtonGroup);

    $.extend($.ui.buttonGroup.prototype,
	{
	    options:
		{
		    alignment: 'right',
		    adoptChildren: true
		}
	});


    SourceCode.Forms.Widget.ButtonBar =
	{
	    _create: function () {
	        var o = this.options;
	        this.id = null;
	        this.buttons = [];
	        this.groups = [];
	        if ((this.element) && $(this.element))
	            this._adoptValues();
	        else
	            this.element.replaceWith(this.html(o));
	        if ((o.id))
	            this.id = o.id;
	    },

	    html: function (o) {
	        var wrapperE = $("<div></div>");
	        if (!o)
	            o = (this.options) ? this.options : {};
	        var actualE = jQuery("<div class='button-bar'><div class='button-bar-wrapper'></div></div>");
	        wrapperE.append(actualE);
	        if ((o.id))
	            actualE.attr("id", o.id);
	        return wrapperE.html();
	    },

	    _adoptValues: function () {
	        if (jQuery(this.element).attr("id") !== "") this.options.id = jQuery(this.element).attr("id");
	    },

	    _adoptChildren: function () {
	        if (jQuery(this.element).find('.buttons').length) {
	            var groups = jQuery(this.element).find('.buttons');
	            for (var i = 0; i < groups.length; i++) {
	                this.addButtonGroup(groups[i]);
	            }
	        }
	    },

	    addButtonGroup: function (group) {
	        var jqGroup = $(group);
	        group.parent = this;
	        this.element.find('.button-bar-wrapper').append(jqGroup);
	        jqGroup.buttonGroup();
	        this.groups.push(jqGroup);
	        return jqGroup;
	    },

	    addButtonGroupFromOptions: function(options){
	    	var group = SourceCode.Forms.Widget.ButtonGroup.html(options);
	    	return this.addButtonGroup(group);
	    },

	    findButton: function (buttonId) {
	        for (var i = 0; i < this.groups.length; i++) {
	            if (this.groups[i].buttongroup("findButton", buttonId) !== false)
	                return this.groups[i].buttongroup("findButton", buttonId);
	        }
	        return false;
	    },

	    addButtonFromOptions: function (options) {
	        var button = SourceCode.Forms.Widget.Button.html(options);
	        var jqButton = $(button);
	        this.element.children().eq(0).append(jqButton);
	        var uiButton = jqButton.k2button(options);
	        jqButton.k2button("option").parent = this;
	        this.buttons.push(uiButton);
	        return uiButton;
	    },

	    addButton: function (button) {
	        var jqButton = $(button);
	        this.element.children().eq(0).append(jqButton);
	        var uiButton = jqButton.k2button();
	        jqButton.k2button("option").parent = this;
	        this.buttons.push(uiButton);
	        return uiButton;
	    },

	    getGroups: function () {
	        return this.groups;
	    }
	};

    $.widget("ui.buttonBar", SourceCode.Forms.Widget.ButtonBar);

    $.extend($.ui.buttonBar.prototype,
	{
	    options:
		{
		    adoptChildren: true
		}

	});

})(jQuery);
