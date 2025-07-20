# Twisted Canvas
Twisted Canvas Web Application | CS50 Capstone Project

[YouTube Demo](https://www.youtube.com/watch?v=UQ-MXKcePGk)

![Twisted Canvas Preview](/main_app/static/main_app/preview.jpg)

## Overview
Twisted Canvas is a dynamic web-based drawing application that challenges artists with various "twists" every 15 seconds. These twists include grayscale filters, horizontal or vertical flips, and more which introduce playful chaos into the creative process. By forcing users to adapt their style in real time, Twisted Canvas turns drawing into a fun (or not), unique digital drawing experience that promotes creativity and spontaneity.

Twisted Canvas builds upon the general Django framework, utilizing Django's provided user model and an art model to power the backend, while javascript is extensively used in the frontend. Drawings are automatically saved as image files, and the web application is desktop and mobile responsive.

## Distinctiveness and Complexity
Twisted Canvas is distinct in both its concept and technical execution. Unlike typical drawing tools that prioritize stability and precision, Twisted Canvas introduces unpredictable, time-based challenges via CSS filters and transformations. This “twist” system creates a game-like layer on top of a traditional canvas app, pushing users to think creatively under constraints, a concept rarely seen in digital art tools or projects in the CS50 course.

On the technical side, the frontend required throrough testing to ensure smooth interactions between tools like the drawer/eraser, color picker*, brush size, pan/zoom, and more. These features were implemented using vanilla JavaScript, providing full control over canvas state and interactions.

Additionally, unlike most course projects that rely on Bootstrap for styling, Twisted Canvas was styled entirely from scratch using modern CSS techniques such as Flexbox.

### Technologies
Twisted Canvas builds upons the courses content utilizing core technologies such as:
- **HTML5 Canvas** - supports a dynamic web drawing experience
- **CSS Filters** - applies real-time visual effects to the canvas
- **Javascript (vanilla)** - handles interactivity, version state control, and more
- **Django Framework** - provides backend structure, user authentication, routing, and more

## Design
Twisted Canvas was designed with a minimalistic dark mode user interface to highlight the twisted drawing experience. 
### Twists
- Grayscale
- Horizontal Flip
- Vertical Flip
- Rotate 45°
- Rotate -45°
- Hue Shift
- Invert
- Sepia

## File Structure
Overview of key files included in my Django project structure:

- `main_app` - main application directory
    - `static/main_app` - contains static content
        - `app.js` - main script run in `canvas_view.html` template
        - `favicon.png` - favicon logo
        - `preview.jpg` - desktop screenshot preview used on landing page
        - `styles.css` - css styling
    - `templates/main_app` - contains html templates
        - `canvas_view.html` - drawing template
        - `index.html` - home template
        - `layout.html` - layout template
        - `login.html` - login template
        - `register.html` - register template
    - `admin.py` - art data avaliable for admin view
    - `models.py` - additional art model to save artwork tied to user
    - `urls.py` - all application URLs
    - `views.py` - handles all view requests
- `project_settings` - project directory

## Installation

Run `pip install -r requirements.txt` to install dependencies.

Run `python manage.py makemigrations` to make migrations for the network app.

Run `python manage.py migrate` to apply migrations to your database.

Run `python manage.py runserver` to run the server.

## Packages
Twisted Canvas utilizes some important design related packages to make the app possible

[**simonwep - pickr**](https://github.com/Simonwep/pickr?tab=readme-ov-file)*
- a beautiful responsive color picker tool, replacing the default form color input popup

[**google material icons**](https://fonts.google.com/icons?icon.set=Material+Symbols&icon.size=24&icon.color=%23e3e3e3&icon.platform=web)
- clean UI icons used throughout the app used for consistency and readability

## Challenges & Considerations
Implementing the panning and zooming ability was rough as the initial plan revolved around transforming the actual canvas' scale which didn't align and update well with the coordinate system of the drawing/eraser tools. Ultimately, a fixed HTML canvas is used with CSS transformations to provide panning and zoom functionality. 

As the canvas doesn't include a layer system the history state management is handled via simply saving the entire canvas state. For a more lightweight and production appropiate build, stroke based data could be implemented instead.  

## Reflection

Overall this full stack capstone project provided a rewarding product development experience from designing wireframes in figma to fully implementing the web application's frontend and backend with Python and Javascript. 

A component based file system or javascript framework could have provided a more modular and scalable layout for the frontend. Despite this, Twisted Canvas successfully combines a minimalist UI, responsive design for both desktop and mobile, and a functional backend into a cohesive and very playful creative tool.