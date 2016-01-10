# InfBoard

A collaborative infinite whiteboard.

* Detects clipboard image and adds it as an image object
* Allows objects on the whiteboard to be moved
* Synchronised viewing

## Requirements

* A recent node version. v4.2.2 was used during development

## Installation

```sh
npm install # Gets dependencies
webpack # Builds the front-end
npm start # Start the backend
```

## Contributing

Directory structure:
 - app is the front end (currently using angularJS framework)
 - public is the webpacked version of app. Content in here are served to users.
 - `app.js` is the backend code.

### Developing the front end

 - Create a dev server using `npm run dev` to develop the front end.
 - `webpack` will update the contents in public.

### TODO

* Implement teleporting so we can have multiple topics on the same board
* Improve UI!
* Add panning when viewed from mobile
* Add html link object
* Right click menu and select object based on what's there
* Remove text box for text input
* Implement chat
* Implement firefox pasting of image


### Known bugs
* Checking only a few objects and pressing delete might delete other objects
* Borders are not drawn for some objects when selected
*
