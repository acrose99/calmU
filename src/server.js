import express from 'express'



express()
    .listen(3000, err => {
        if (err) console.log('error', err);
    });
