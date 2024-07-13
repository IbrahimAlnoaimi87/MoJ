(function ($, window, top)
{

	var instance;

	$.history = function (method, param)
	{
		if (typeof method === 'function')
		{
			param = method;
			method = 'bind';
		}
		// bind and unbind methods need a callback function
		else if (/bind|unbind/.test(method) && typeof param !== "function") return;

		if (!instance)
		{
			instance = new hist;
			instance.init();
		};

		if (method !== 'init')
			return instance[method](param);
	};

	function hist()
	{
		var ieVersion = null;

		if (SourceCode.Forms.Browser.msie)
		{
			ieVersion = parseInt(SourceCode.Forms.Browser.version);
		}

		var self = this,
			IE67 = SourceCode.Forms.Browser.msie && ieVersion < 8,
			IE8910 = SourceCode.Forms.Browser.msie && ieVersion >= 8 && ieVersion < 11,
			$iframe,
			$wnd = $(window),
			stop = false;

		self.value = window.location.hash.substr(1);

		this._list = [];
		this._index = 0;

		this.init = function ()
		{
			if (IE8910)
			{
				$wnd.on('hashchange', IE8Handler);
			} else if (IE67)
			{
				initIframe();
			} else
				(function ()
				{
					if (stop) return;
					window.location.hash.substr(1) !== self.value && changed(window.location.hash);
					setTimeout(arguments.callee, 50);
				})();
		};

		this.destroy = function ()
		{
			// stop timeout
			stop = true;
			// remove iframe for IE6-7
			$iframe && $iframe.remove();
			// unbind all events
			$wnd.off('hashchanged');
			// remove the reference to the instance
			instance = null;
			this._list = null;
			// unbind event for IE8
			IE8910 && $wnd.off('hashchange', IE8Handler);
		};

		this.bind = function (callback)
		{
			$wnd.on('hashchanged', callback);
		};

		this.unbind = function (callback)
		{
			$wnd.off('hashchanged', callback);
		};
		this.index = function ()
		{
			return this._index;
		};
		this.list = function ()
		{
			return this._list;
		};
		this.add = function (value)
		{
			this._list.push(value);
			this._index = this._list.length - 1;
			window.location.hash = value;
		};

		this.forward = function ()
		{
			if (this._index < this._list.length - 1)
				this._index++;
			this._go();
			//history.go(1);
		};

		this.back = function ()
		{
			if (this._index > 0)
				this._index--;
			this._go();
			//history.go(-1);
		};
		this.goTo = function (index)
		{
			this._index = index;
		};
		this._go = function ()
		{
			window.location.hash = this._list[this._index];
		};
		/**
		* Only for IE6-7
		* Check if iframe hash the same as document
		*/
		function initIframe()
		{
			$iframe = $iframe || $('<iframe style="display: none;" class="x-history-iframe"></iframe>').appendTo(document.body);
			// if document is not ready, access to the contentWindow of the iframe is not immediately available
			try { $iframe[0].contentWindow; } catch (e)
			{
				setTimeout(arguments.callee, 50);
				return;
			};

			var iHash = iDoc().location.hash,
            hash = window.location.hash,
            iHashNew, hashNew;

			(function ()
			{
				if (stop) return;
				iHashNew = iDoc().location.hash;
				hashNew = window.location.hash;

				// changed using navigation buttons
				if (iHashNew !== iHash)
				{
					iHash = iHashNew;
					hash = iHash;
					window.location.hash = changed(iHash);
					// changed using link or add method
				} else if (hashNew !== hash)
				{
					hash = hashNew;
					updateIFrame(hash);
				};
				setTimeout(arguments.callee, 50);
			})();


			// get the document of the iframe
			function iDoc()
			{
				return $iframe[0].contentWindow.document;
			};

			// save value to the iframe
			function updateIFrame(value)
			{
				iDoc().open();
				iDoc().close();
				iDoc().location.hash = value;
			};
		};

		/**
		* hash was changed - do something
		* @param {String} value - '#value'
		*/
		function changed(value)
		{
			self.value = value.substr(1);
			// call all callbacks
			$($wnd).trigger('hashchanged', [self]);
			return self.value;
		};

		function IE8Handler(e)
		{
			changed(window.location.hash);
		};


	};

})(jQuery, window, top);
