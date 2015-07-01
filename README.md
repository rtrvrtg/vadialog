# VA Dialog

An accessible web modal dialog box based on the original Vision Australia codebase

## Authorship

[Original library](https://www.visionaustralia.org/business-and-professionals/digital-accessibility-services/resources/tools-to-download/accessible-dialog-box) by [Pierre Frederiksen](mailto:pierre.frederiksen@visionaustralia.org), Digital Access Specialist at Vision Australia

Enhancements and rework by [Geoffrey Roberts](mailto:g.roberts@blackicemedia.com)

## License

<a rel="license" href="http://creativecommons.org/licenses/by-nc-sa/4.0/"><img alt="Creative Commons License" style="border-width:0" src="https://i.creativecommons.org/l/by-nc-sa/4.0/88x31.png" /></a><br />This work is licensed under a <a rel="license" href="http://creativecommons.org/licenses/by-nc-sa/4.0/">Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License</a>.

## Requirements

* jQuery
* [Handlebars](http://handlebarsjs.com/)

## Features

* Press _Escape_ to close open modal dialog
* One nice self-contained unobtrusive jQuery plugin
* Can open remote HTML
  * as embed into current page
  * as iframe
* Supports customisable templates for different bits of the modal dialog

## Installation & Usage

Add jQuery and Handlebars. If you don't feel like using your own, use them from the CDN:

```html
<script src="//code.jquery.com/jquery-1.11.3.min.js"></script>
<script src="//cdnjs.cloudflare.com/ajax/libs/handlebars.js/3.0.3/handlebars.min.js"></script>
```

Add the following to the `<head>` of your page after that:

```html
<link rel="stylesheet" href="vadialog.css">
<script type="text/javascript" src="vadialog.jquery.js"></script>
```

If you need to invoke VA Dialog manually, such as after an AJAX load, call the following:

```javascript
$(container).vadialog();
```

### Linking to a hidden element

In the `<body>` of your page, add the following to link to a hidden `<div>` with the attribute `id="foo"`:

```html
<a href="#" data-vadialog-open="foo">link</a>
```

### Closing an open modal

All modals come with a close button, but you can use the following markup within a `<div>` with the attribute `id="foo"` to close it when clicked:

```html
<a href="#" data-vadialog-close="foo">link</a>
```

### Displaying content at a URL

Use the following markup to dynamically load a page and use a CSS selector to select a portion of it when clicked. The following assumes that there is an element with the attribute `id="foo"` immediately under the `<body>` at the destination page:

```html
<a href="http://google.com" data-vadialog-url="#content .foo">link</a>
```

### Displaying an iframe

**Note:** iframes are not particularly accessible, so we suggest using this method with caution.

Use the following markup to dynamically load a page and use a CSS selector to select a portion of it when clicked. The following assumes that there is an element with the attribute `id="foo"` immediately under the `<body>` at the destination page:

```html
<a href="http://google.com" data-vadialog-iframe>link</a>
```

### Setting custom templates

You can define custom [Handlebars](http://handlebarsjs.com/) templates for various bits of the dialog like so. In this example, we're redefining the main dialog template:

```html
<script id="custom-dialog-tpl" type="text/x-handlebars-template">
	<div data-vadialog-elem-dialog class="vadialog" data-current-vadialog="{{dialogID}}" style="background: #006; color: #fff; box-shadow: 0 0 10px black;">
		{{{startSentinel}}}
		{{{startDialog}}}
		<div data-vadialog-elem-content></div>
		{{{endDialog}}}
		{{{endSentinel}}}
		{{{closeProxy}}}
	</div>
</script>
```

You can then reference it in the opener link like so:

```html
<a href="#" data-vadialog-open="example-1" data-vadialog-tpl-dialog="custom-dialog-tpl">
	open a dialog
</a>
```

## Changelog

### v0.2

* Uses Handlebars templates to generate modal dialog HTML
* Allows you to specify your own templates with data attributes on the trigger link

### v0.1.3

Ported unobtrusive addition to jQuery plugin in preparation for merge

### v0.1.2

Fixed URL loader tab order bug

### v0.1.1

Fixed residual styling and keyboard trap bugs

### v0.1

Initial commit with modifications and unobtrusive JS extension

## @TODO

* Add support for additional parameters
* Improve element selection in data-vadialog-url
* Document CSS to allow for easy modification
* Make CSS look nicer
* Add translation support
