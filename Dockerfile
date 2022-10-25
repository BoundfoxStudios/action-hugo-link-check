FROM golang:1.19-bullseye

RUN curl -fsSL https://deb.nodesource.com/setup_16.x | bash - &&\
    apt-get install -y nodejs

ADD package.json /action/package.json
ADD package-lock.json /action/package-lock.json

RUN (cd /action && npm ci)

ADD . /action

ADD entrypoint.sh /action/entrypoint.sh

ENTRYPOINT ["/action/entrypoint.sh"]
