/**
 * VA Dialog
 * v0.1.3
 */

(function( $ ) {

	// Base structure for templating loader
	var RemoteTemplates = {
		loadContainer: function(html){
			return $('<div />', {
				'class': "remote-content remote-content-loading",
				'html': html,
				'aria-live': "polite"
			});
		},
		loadingTpl: function(){
			return '<div class="remote-content-inner">Loading...</div>';
		},
		errorTpl: function(){
			return '<div class="remote-content-inner"><p role="alert">Could not load page.</p></div>';
		}
	};

	// Special definitions for URL triggers
	var UrlTrigger = {
		// Set up an individual URL trigger
		setup: function(elem){
			var dialogID = null;
			if (!elem.id) {
				// Set an ID on the trigger element.
				elem.id = visionaustralia.getNewID("vadialog-url-trigger");
			}
			if ($('[data-vadialog-url-trigger="' + elem.id + '"]').length) {
				// If URL trigger destination element exists,
				// use that as the destination.
				dialogID = $('[data-vadialog-url-trigger="' + elem.id + '"]').attr('id');
			}
			else {
				// If URL trigger destination element does not exist,
				// add the new element and use it.
				dialogID = visionaustralia.getNewID("vadialog-url-container");
				$('body').append(
					$('<div />', {
						id: dialogID,
						hidden: true,
						'aria-hidden': 'true',
						'data-vadialog-url-trigger': elem.id
					})
				);
			}
			return {
				triggerID: elem.id,
				dialogID:  dialogID
			};
		},
		beforeOpen: function(trigger){
			var container = this;
			var loadContainer = RemoteTemplates.loadContainer(
				RemoteTemplates.loadingTpl()
			);
			var selector = trigger.getAttribute('data-vadialog-url');
			container.find('[data-vadialog-url-trigger]').append(loadContainer);
			container.find('.remote-content')
			.load($(trigger).attr('href') + " body", function(response, status, xhr){
				var html = "", classes = [];
				if (status == "error") {
					var html = RemoteTemplates.errorTpl();
					classes.push('remote-content-failedload');
				}
				else {
					var html = $($.parseHTML(response)).not("meta, link, script");
					if (!!selector.length) {
						// First item must be a top level selector within the body tag
						var bits = selector.split(" ");
						var initial = bits.shift(bits);
						html = html.filter(initial);
						// Anything else we can search on
						if (bits.length > 0) {
							html = html.find(bits.join(" "));
						}
					}
				}
				$(this).append($(html))
				.removeClass('remote-content-loading')
				.addClass(classes);
				visionaustralia.resizeDialog(container);
			});
			visionaustralia.resizeDialog(container);
		},
		forCloseButton: function(trigger){
			this.find('.remote-content').remove();
		}
	};

	// Special definitions for iframe triggers
	var IframeTrigger = {
		setup: function(elem){
			var dialogID = null;
			if (!elem.id) {
				elem.id = visionaustralia.getNewID("vadialog-iframe-trigger");
			}
			if ($('[data-vadialog-iframe-trigger="' + elem.id + '"]').length) {
				dialogID = $('[data-vadialog-iframe-trigger="' + elem.id + '"]').attr('id');
			}
			else {
				dialogID = visionaustralia.getNewID("vadialog-iframe-container");
				$('body').append(
					$('<div />', {
						id: dialogID,
						hidden: true,
						'data-vadialog-iframe-trigger': elem.id
					})
				);
			}
			return {
				triggerID: elem.id,
				dialogID:  dialogID
			};
		},
		beforeOpen: function(trigger){
			this.find('iframe').remove();
			var f = $('<iframe />', {
				src: $(trigger).attr('href'),
				tabindex: "0",
				width: "100%",
				height: "100%"
			});
			this.find('[data-vadialog-iframe-trigger]').append(f);
			visionaustralia.resizeDialog(
				this,
				$(window).innerWidth(),
				$(window).innerHeight()
			);
		},
		afterOpen: function(trigger){
			var padLeft  = parseInt($(this).css("padding-left"), 10);
			var padTop   = parseInt($(this).css("padding-top"), 10);
			$(this).find('iframe').width(
				window.innerWidth - (2 * padLeft)
			).height(
				window.innerHeight - (2 * padTop)
			);
			visionaustralia.resizeDialog(this);
			$('.vashadow').addClass('vashadow-iframe');
		},
		forCloseButton: function(trigger){
			this.find('iframe').remove();
		}
	};

	// Trigger actions for particular link types
	var triggerActions = {
		open:   function(){
			if (!this.id) {
				this.id = visionaustralia.getNewID("vadialog-trigger");
			}
			var triggerID = this.id,
			dialogID = this.getAttribute('data-vadialog-open');

			visionaustralia.addDialog(
				triggerID,
				dialogID
			);
		},
		close:  function(){
			this.click(function(e){
				e.preventDefault();
				visionaustralia.closeDialog(
					this.getAttribute('data-vadialog-close')
				);
			});
		},
		url:    function(){
			var idents = UrlTrigger.setup(this);
			visionaustralia.addDialog(
				idents.triggerID,
				idents.dialogID,
				{
					beforeOpen: UrlTrigger.beforeOpen,
					forCloseButton: UrlTrigger.forCloseButton
				}
			);
		},
		iframe: function(){
			var idents = IframeTrigger.setup(this);
			visionaustralia.addDialog(
				idents.triggerID,
				idents.dialogID,
				{
					beforeOpen: IframeTrigger.beforeOpen,
					afterOpen: IframeTrigger.afterOpen,
					forCloseButton: IframeTrigger.forCloseButton
				}
			);
		}
	}

	 // jQuery Plugin interface
	$.fn.vadialog = function() {
		var triggers = {
			open:   $('[data-vadialog-open]', this),
			close:  $('[data-vadialog-close]', this),
			url:    $('[data-vadialog-url]', this),
			iframe: $('[data-vadialog-iframe]', this)
		};

		visionaustralia.escapeToClose();

		for (var i in triggers) {
			triggers[i].each(function(){
				triggerActions[i].call(this);
			});
		}
	};

	$(document).ready(function(){
		$('body').vadialog();
	});
 
}( jQuery ));