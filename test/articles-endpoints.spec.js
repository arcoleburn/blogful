'use strict';

const { expect } = require('chai');
const knex = require('knex');
const supertest = require('supertest');
const { disabled } = require('../src/app');
const app = require('../src/app');
const { makeArticlesArray } = require('./articles.fixtures');

describe.only('Articles Endpoints', function () {
  let db;
  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL,
    });
    app.set('db', db);
  });
  after('disconnet from db', () => db.destroy());
  before('clean table', () => db('blogful_articles').truncate());
  afterEach('cleanup', () => db('blogful_articles').truncate());

  describe('GET /articles', () => {
    context('given no articles', () => {
      it('response with 200 and an empty list', () => {
        return supertest(app).get('/articles').expect(200, []);
      });
    }); //end of no articles context

    context('Given there are articles in the database', () => {
      const testArticles = makeArticlesArray();

      beforeEach('insert articles', () => {
        return db.into('blogful_articles').insert(testArticles);
      });
      it('GET/articles responds with 200 and all of the artilces', () => {
        return supertest(app)
          .get('/articles')
          .expect(200, testArticles);
      });
    }); //end of articles in db context
  }); //end of get articles endpt block

  describe('GET /articles/:article_id', () => {
    context(`Given no articles`, () => {
      it(`responds with 404`, () => {
        const articleId = 123456;
        return supertest(app)
          .get(`/articles/${articleId}`)
          .expect(404, {
            error: { message: `Article doesn't exist` },
          });
      });
    }); //end of no articles context
    
    context('given articles in db', () => {
      const testArticles = makeArticlesArray();
      beforeEach('insert articles', () => {
        return db.into('blogful_articles').insert(testArticles);
      });

      it('GET /articles/:article_id responds with 200 and the specified article', () => {
        const articleId = 2;
        const expectedArticle = testArticles[articleId - 1];
        return supertest(app)
          .get(`/articles/${articleId}`)
          .expect(200, expectedArticle);
      });
    }); //end of articles in db context
  }); //end of get article by id endpt block
}); //end of articles block
