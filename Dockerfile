FROM johnmeyerhoff/node_quickstart:latest

RUN apt-get update \
    && apt-get install -y wget gnupg \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*
RUN npm i puppeteer \
    # Add user so we don't need --no-sandbox.
    # same layer as npm install to keep re-chowned files from using up several hundred MBs more space
    && groupadd -r pptruser && useradd -r -g pptruser -G audio,video pptruser \
    && mkdir -p /home/pptruser/Downloads \
    && chown -R pptruser:pptruser /home/pptruser \
    && chown -R pptruser:pptruser /node_modules
USER pptruser
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
