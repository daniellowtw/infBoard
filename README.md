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
* Persistent database
* Create rooms that host their own infBoard
