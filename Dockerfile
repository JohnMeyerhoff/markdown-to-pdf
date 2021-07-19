FROM johnmeyerhoff/node_quickstart:latest


ARG DIR=/markdown-to-pdf/
RUN mkdir $DIR && \
    chmod 777 $DIR
RUN cp -r /node_modules /markdown-to-pdf/
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
