'use strict';

var express = require('express');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var express__default = /*#__PURE__*/_interopDefaultLegacy(express);

express__default['default']()
    .listen(3000, err => {
        if (err) console.log('error', err);
    });
