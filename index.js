const express = require('express')
const cors = require('cors')
const { createClient } = require('@libsql/client')
const { drizzle } = require('drizzle-orm/libsql')
const { sqliteTable, integer, text } = require('drizzle-orm/sqlite-core')

const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name'),
  email: text('email'),
})

const client = createClient({
  url: process.env.VERCEL ? 'file:/tmp/database.sqlite' : 'file:database.sqlite',
})
const db = drizzle(client)

const ready = client
  .execute('create table if not exists users (id integer primary key autoincrement, name text, email text)')
  .then(async () => {
    const list = await db.select().from(users)
    if (list.length === 0) {
      await db.insert(users).values([
        { name: 'Ivan', email: 'ivan@mail.com' },
        { name: 'Anna', email: 'anna@mail.com' },
        { name: 'Oleg', email: 'oleg@mail.com' },
      ])
    }
  })

const app = express()

app.use(cors())
app.use(express.json())

app.use(async (req, res, next) => {
  await ready
  next()
})

app.get('/users', async (req, res) => {
  res.json(await db.select().from(users))
})

app.post('/users', async (req, res) => {
  const { name, email } = req.body
  if (!name || !email) return res.status(400).json({ error: 'name and email required' })
  await db.insert(users).values({ name, email })
  res.status(201).json({ ok: true })
})

app.get('/',(req, res) => res.redirect('/users'))

if (!process.env.VERCEL) {
  app.listen(3000, () => console.log('http://localhost:3000/users'))
}

module.exports = app
