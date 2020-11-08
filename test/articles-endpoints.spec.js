'use strict';

const { expect } = require('chai');
const knex = require('knex');
const supertest = require('supertest');
const { disabled } = require('../src/app');
const app = require('../src/app');
const { makeArticlesArray } = require('./articles.fixtures');

describe('Articles Endpoints', function () {
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
  describe('POST /articles', () => {
    it('creates an article, responding with 201 and the new article', function () {
      this.retries(3);
      const newArticle = {
        title: 'Test New Article',
        style: 'Listicle',
        content: 'Test new article content....',
      };
      return supertest(app)
        .post('/articles')
        .send(newArticle)
        .expect(201)
        .expect((res) => {
          expect(res.body.title).to.eql(newArticle.title);
          expect(res.body.style).to.eql(newArticle.style);
          expect(res.body.content).to.eql(newArticle.content);
          expect(res.body).to.have.property('id');
          expect(res.headers.location).to.eql(
            `/articles/${res.body.id}`
          );
          const expected = new Date().toLocaleString();
          const actual = new Date(
            res.body.date_published
          ).toLocaleString();
          expect(actual).to.eql(expected);
        })
        .then((postRes) =>
          supertest(app)
            .get(`/articles/${postRes.body.id}`) //this checks if article is actually in database.
            .expect(postRes.body)
        );
    });
    const requiredFields = ['title', 'style', 'content'];

    requiredFields.forEach((field) => {
      const newArticle = {
        title: 'test new article',
        style: 'Listicle',
        content: 'Test new article content...',
      };
      it(`responds with 400 and an error message when ${field} missing`, () => {
        delete newArticle[field];

        return supertest(app)
          .post('/articles')
          .send(newArticle)
          .expect(400, {
            error: { message: `Missing ${field} in request body` },
          });
      });
    });
  });
  describe('DELETE /articles/:articleid', () => {
    context('Given there are articles in the database', () => {
      const testArticles = makeArticlesArray();

      beforeEach('insert articles', () => {
        return db.into('blogful_articles').insert(testArticles);
      });
      it('responds with 204 and removes the article', () => {
        const idToRemove = 1;
        const expectedArticles = testArticles.filter(
          (article) => article.id !== idToRemove
        )
        return supertest(app)
          .delete(`articles/`)
          .expect(204)
        // // .then(res =>
        //   supertest(app).get('/articles').expect(expectedArticles)
        // );
      });
    });
  });
}); //end of articles block
