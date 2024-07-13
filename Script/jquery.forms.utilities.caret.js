(function ($) {
	$.fn.caret = function (start, end) {
		if (!arguments.length) {
			var _target = this.get(0);
			var _val = _target.value;

			if (!_val)
				start = end = 0;
			else if (!_target.setSelectionRange) {
				var _rangeStart = document.selection.createRange();
				var _rangeStop = _rangeStart.duplicate();
				var _valLen = _val.length;

				_rangeStart.moveEnd('character', _valLen);
				_rangeStop.moveStart('character', -_valLen);

				start = _val.lastIndexOf(_rangeStart.text);
				end = _rangeStop.text.length;
			}
			else {
				start = _target.selectionStart;
				end = _target.selectionEnd;
			}

			return {
				start: start,
				end: end
			};
		}

		var _arguments = arguments;

		this.each(function () {
			if (_arguments.length === 1) {
				switch (_arguments[0]) {
					case 'start':
						start = end = 0;

						break;

					case 'end':
						start = end = this.value.length;

						break;

					default:
						end = start;

						break;
				}
			}

			if (!this.setSelectionRange) {
				var _range = this.createTextRange();

				_range.collapse(true);

				if (start === end)
					_range.move('character', start);
				else {
					_range.moveStart('character', start);
					_range.moveEnd('character', end);
				}

				_range.select();
			}
			else
				this.setSelectionRange(start, end);
		});

		return this;
	}
})(jQuery);
