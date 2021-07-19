FROM johnmeyerhoff/node_quickstart:latest

COPY /node_modules ./markdown-to-pdf/node_modules/
ARG DIR=/markdown-to-pdf/
RUN mkdir $DIR && \
    chmod 777 $DIR
WORKDIR $DIR
COPY src/*.js ./
COPY package.json ./
COPY template/ template/
COPY styles/ styles/
RUN npm install
RUN fc-cache -fv && \
    chmod +x docker_entry.js && \
    ln -s $DIR/docker_entry.js /usr/local/bin/markdown-to-pdf
WORKDIR /
CMD [ "markdown-to-pdf" ]
