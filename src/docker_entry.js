#!/usr/bin/env node
'use strict';

const INTERFACE = require('./docker_interface');


if(process.env['CI']) {
	// if $GITHUB_ACTIONS is set, this container is run by GitHub Actions
	if(process.env['GITHUB_ACTIONS']) {
		INTERFACE('INPUT_', '/github/workspace/');
	}else {
		throw 'Environment variable $CI is set, but runner could not be identified!';
	}
}else {
	INTERFACE();
}
