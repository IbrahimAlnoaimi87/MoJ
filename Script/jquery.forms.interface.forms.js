(function ($)
{

	if (typeof SourceCode === "undefined" || SourceCode === null) SourceCode = {};
	if (typeof SourceCode.Forms === "undefined" || SourceCode.Forms === null) SourceCode.Forms = {};
	if (typeof SourceCode.Forms.Interfaces === "undefined" || SourceCode.Forms.Interfaces === null) SourceCode.Forms.Interfaces = {};

	SourceCode.Forms.Interfaces.Forms = {

		config: {
			scripts: {
				"AppStudio": "AppStudio/Script/sourcecode.Forms.interfaces.appstudio.js"
			}
		},

		init: function ()
		{

			this.panes = {
				navigation: null,
				content: null
			}
			this.navpanel = null;
			this.interfaces = {};
			this.renewalWindow = 0;

			$("#NotAuthenticatedPaneContainer, #AuthenticatedPaneContainer").panecontainer();

			if ($("#AuthenticatedPaneContainer").length > 0)
			{
				// Authenticated Session Interface
				this.panes.navigation = $("#MainNavigationPane");
				this.panes.content = $("#MainContentPane");
				this.navpanel = this.panes.navigation.children(".navigation-panel");
				this.navpanel.on("navigationpanelcollapse", this._collapseexpand.bind(this));
				this.navpanel.on("navigationpanelexpand", this._collapseexpand.bind(this));
				this._loadInterfaces();
			}
			else if ($("#NotAuthenticatedPaneContainer").length > 0)
			{
				// Unauthenticated Session Interface

            }

		    SourceCode.Forms.InjectBrowserUserAgentToHtml();

			this.initialized = true;

		},

		_collapseexpand: function ()
		{

			if (this.navpanel.is(".collapsed"))
			{
				this.panes.navigation.data("restore", this.panes.navigation.width());
				this.panes.navigation.width(this.navpanel.width());
				this.panes.navigation.next(".divider").css("left", this.navpanel.width());
				this.panes.content.css("left", (this.navpanel.width() + this.panes.navigation.next(".divider").width()));

			}
			else
			{
				this.panes.navigation.width(this.panes.navigation.data("restore"));
				this.panes.navigation.next(".divider").css("left", this.panes.navigation.data("restore"));
				this.panes.content.css("left", (this.panes.navigation.data("restore") + this.panes.navigation.next(".divider").width()));
			}

		},

		_loadInterfaces: function ()
		{

			$.each(this.config.scripts, function (key, value)
			{
				$.addScript(value);
			});

		},

		register: function ()
		{

			switch (arguments[0])
			{
				case "interface":
				case "module":

					this.interfaces[arguments[1]] = arguments[2];

					//the left navigation used to have buttons for different applications (like Designer, Management)
					//this code, looks at the UI!!?! to work out which is selected, and calls the init() on the module of the same name.
					//var active = null;
					////Get the name of the application currently being shown.
					//if (checkExistsNotEmpty(this.navpanel)) active = this.navpanel.find(".navigation-panel-buttons a.active").metadata().name;
					//if (active !== null && active === arguments[1]) this._initmodule(arguments[1]);

					//LG:just run the module anyway, as there is only one - AppStudio.
					this._initmodule(arguments[1]);

					break;
				case "script":
					$.embed("script", arguments[1]);
					break;
			}

		},

		_initmodule: function (module)
		{
			if (typeof SourceCode.Forms.Interfaces[module] !== "undefined")
				SourceCode.Forms.Interfaces[module].init();
		}
	}

	$(document).ready(function ()
	{
		SourceCode.Forms.Interfaces.Forms.init();
	});

})(jQuery);
