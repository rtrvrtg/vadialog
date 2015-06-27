# VA Dialog

An accessible web modal dialog box based on the original Vision Australia codebase

## Authorship

[Original library](https://www.visionaustralia.org/business-and-professionals/digital-accessibility-services/resources/tools-to-download/accessible-dialog-box) by [Pierre Frederiksen](mailto:pierre.frederiksen@visionaustralia.org), Digital Access Specialist at Vision Australia

Enhancements and rework by [Geoffrey Roberts](mailto:g.roberts@blackicemedia.com)

## License

This code is licensed under the [Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0)](https://creativecommons.org/licenses/by-nc-sa/4.0/) license.

## Requirements

* jQuery

## Features

* Press _Escape_ to close open modal
* Unobtrusive Javascript implementation
* Can open remote HTML
  * as embed into current page
  * as iframe

## Installation & Usage

Add the following to the `<head>` of your page:

```html
<link rel="stylesheet" href="vadialog.css">
<script type="text/javascript" src="vadialog.js"></script>
<script type="text/javascript" src="vadialog-unobtrusive.js"></script>
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

## Changelog

### v0.1.2

Fixed URL loader tab order bug

### v0.1.1

Fixed residual styling and keyboard trap bugs

### v0.1

Initial commit with modifications and unobtrusive JS extension

## @TODO

* Integrate unobtrusive addition with original library
* Turn library into a proper plugin
* Add support for additional parameters
* Improve element selection in data-vadialog-url
* Add template support
* Document CSS to allow for easy modification
* Make CSS look nicer
* Add translation support
