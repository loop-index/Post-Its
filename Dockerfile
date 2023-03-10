FROM nginx:latest

# WORKDIR /usr/share/nginx/html

COPY ./index.html ./usr/share/nginx/html/index.html
COPY ./script.js ./usr/share/nginx/html/script.js
COPY ./style.css ./usr/share/nginx/html/style.css
COPY ./utils.js ./usr/share/nginx/html/utils.js
COPY ./note.js ./usr/share/nginx/html/note.js
COPY ./firebase.js ./usr/share/nginx/html/firebase.js
COPY ./navbar.js ./usr/share/nginx/html/navbar.js
COPY ./navStyle.css ./usr/share/nginx/html/navStyle.css