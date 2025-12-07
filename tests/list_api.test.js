const { test, beforeEach, after } = require('node:test')
const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const Blog = require('../models/blog')
const assert = require('node:assert')

const api = supertest(app)

const initialBlogs = [
  {
    _id: '5a422a851b54a676234d17f7',
    title: 'React patterns',
    author: 'Michael Chan',
    url: 'https://reactpatterns.com/',
    likes: 7,
    __v: 0
  },
  {
    _id: '5a422aa71b54a676234d17f8',
    title: 'Go To Statement Considered Harmful',
    author: 'Edsger W. Dijkstra',
    url: 'http://www.u.arizona.edu/~rubinson/copyright_violations/Go_To_Considered_Harmful.html',
    likes: 5,
    __v: 0
  },
  {
    _id: '5a422b3a1b54a676234d17f9',
    title: 'Canonical string reduction',
    author: 'Edsger W. Dijkstra',
    url: 'http://www.cs.utexas.edu/~EWD/transcriptions/EWD08xx/EWD808.html',
    likes: 12,
    __v: 0
  },
]

beforeEach(async () => {
  await Blog.deleteMany({})
  await Blog.insertMany(initialBlogs)
})

test('blog list application returns the correct amount of blog posts in the JSON format', async () => {
  const response = await api
    .get('/api/blogs')
    .expect(200)
    .expect('Content-Type', /application\/json/)

  assert.strictEqual(response.body.length, initialBlogs.length)
})

test('unique identifier property of the blog posts is named id', async () => {
  const response = await api
    .get('/api/blogs')
    .expect(200)

  const blogs = response.body
  assert.strictEqual(blogs.length > 0, true, 'there are no blogs')

  blogs.forEach((blog) => {
    assert.strictEqual(typeof blog.id, 'string', 'blog does not have id property')
    assert.strictEqual(blog._id, undefined, 'blog has _id property')
  })
})

test('test new blog post', async () => {
  const newBlog = {
    title: 'TDD harms architecture',
    author: 'Robert C. Martin',
    url: 'http://blog.cleancoder.com/uncle-bob/2017/03/03/TDD-Harms-Architecture.html',
    likes: 0,
  }

  const getResponse = await api
    .get('/api/blogs')
    .expect(200)

  const initialLength = getResponse.body.length

  await api
    .post('/api/blogs')
    .send(newBlog)
    .expect(201)
    .expect('Content-Type', /application\/json/)

  const getResponseAfter = await api
    .get('/api/blogs')
    .expect(200)

  const finalLength = getResponseAfter.body.length

  assert.strictEqual(finalLength, initialLength + 1, 'blog count should have increased by 1')
})

test('a blog post can be deleted', async () => {
  const getResponse = await api
    .get('/api/blogs')
    .expect(200)

  const blogs = getResponse.body
  const blogToDelete = blogs[0]
  const initialLength = blogs.length

  await api
    .delete(`/api/blogs/${blogToDelete.id}`)
    .expect(204)

  const getResponseAfter = await api
    .get('/api/blogs')
    .expect(200)

  const finalLength = getResponseAfter.body.length
  assert.strictEqual(finalLength, initialLength - 1, 'blog count should have decreased by 1')

  const remainingBlogs = getResponseAfter.body
  assert.strictEqual(remainingBlogs.some((b) => b.id === blogToDelete.id), false, 'deleted blog should not exist')
})

test('a blog post can be updated', async () => {
  const getResponse = await api
    .get('/api/blogs')
    .expect(200)

  const blogs = getResponse.body
  const blogToUpdate = blogs[0]

  const updatedBlog = {
    title: 'title',
    author: 'author',
    url: 'https://fullstackopen.com/en/part4/',
    likes: 67,
  }

  const updateResponse = await api
    .put(`/api/blogs/${blogToUpdate.id}`)
    .send(updatedBlog)
    .expect(200)
    .expect('Content-Type', /application\/json/)

  assert.strictEqual(updateResponse.body.title, updatedBlog.title)
  assert.strictEqual(updateResponse.body.author, updatedBlog.author)
  assert.strictEqual(updateResponse.body.url, updatedBlog.url)
  assert.strictEqual(updateResponse.body.likes, updatedBlog.likes)

  const getResponseAfter = await api
    .get('/api/blogs')
    .expect(200)

  const updatedBlogFromList = getResponseAfter.body.find((b) => b.id === blogToUpdate.id)
  assert.strictEqual(updatedBlogFromList.title, updatedBlog.title, 'title was not updated')
  assert.strictEqual(updatedBlogFromList.author, updatedBlog.author, 'author was not updated')
  assert.strictEqual(updatedBlogFromList.url, updatedBlog.url, 'url was not updated')
  assert.strictEqual(updatedBlogFromList.likes, updatedBlog.likes, 'likes was not updated')

})

after(async () => {
  await mongoose.connection.close()
})