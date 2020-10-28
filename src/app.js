'use strict';

require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const { NODE_ENV } = require('./config');
const ArticlesService = require('./articles-service');

const app = express();

const morganOption = NODE_ENV === 'production' ? 'tiny' : 'common';

app.use(morgan(morganOption));
app.use(helmet());
app.use(cors());

app.get('/articles', (req, res, next) => {
  const db = req.app.get('db');
  ArticlesService.getAllArticles(db)
    .then((articles) => {
      res.json(articles);
    })
    .catch(next);
});

app.get('/articles/:article_id', (req, res, next) => {
  const db = req.app.get('db');
  ArticlesService.getById(db, req.params.article_id)
    .then((article) => {
      if (!article) {
        return res.status(404).json({
          error: { message: `Article doesn't exist` },
        });
      }
      res.json(article);
    })
    .catch(next);
});

app.get('/', (req, res) => {
  res.send('Hello, world!');
});

app.use(function errorHandler(error, req, res, next) {
  let response;
  if (process.env.NODE_ENV === 'production') {
    response = { error: { message: 'server error' } };
  } else {
    console.log(error);
    response = { message: error.messager, error };
  }
  res.status(500).json(response);
});
module.exports = app;
