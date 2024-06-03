const express = require('express')
const sqlite3 = require('sqlite3')
const path = require('path')
const {open} = require('sqlite')
const {format, isMatch} = require('date-fns')

const dbPath = path.join(__dirname, 'todoApplication.db')
const app = express()
app.use(express.json())
let db = null

const camelCase = object => {
  camelObject = {}
  for (let i in object) {
    if (i === 'due_date') {
      camelObject['dueDate'] = object[i]
    } else {
      camelObject[i] = object[i]
    }
  }
  return camelObject
}

//DB AND SERVER INITIALIZER
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('DB running at http://localhost:3000/')
    })
  } catch (error) {
    console.log(`DB Error: ${error.message}`)
    process.exit(1)
  }
}
initializeDBAndServer()

const verify = (request, response, next) => {
  const {status, priority, category, dueDate} = request.query

  if (status !== undefined) {
    if (status === 'TO DO' || status === 'IN PROGRESS' || status === 'DONE') {
      next()
    } else {
      response.status(400)
      response.send('Invalid Todo Status')
    }
  } else if (priority !== undefined) {
    if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
      next()
    } else {
      response.status(400)
      response.send('Invalid Todo Priority')
    }
  } else if (category !== undefined) {
    if (category === 'WORK' || category === 'HOME' || category === 'LEARNING') {
      next()
    } else {
      response.status(400)
      response.send('Invalid Todo Category')
    }
  } else if (dueDate !== undefined) {
    if (isMatch(dueDate, 'yyyy-MM-dd')) {
      next()
    } else {
      response.status(400)
      response.send('Invalid Due Date')
    }
  } else {
    response.status(400)
    response.send('Invalid Request')
  }
}

const verifyPost = (request, response, next) => {
  const {status, priority, category, dueDate} = request.body

  if (status === 'TO DO' || status === 'IN PROGRESS' || status === 'DONE') {
    if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        if (isMatch(dueDate, 'yyyy-MM-dd')) {
          next()
        } else {
          response.status(400)
          response.send('Invalid Due Date')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
    } else {
      response.status(400)
      response.send('Invalid Todo Priority')
    }
  } else {
    response.status(400)
    response.send('Invalid Todo Status')
  }
}

const verifyPut = (request, response, next) => {
  const {todo, status, priority, category, dueDate} = request.body

  if (status !== undefined) {
    if (status === 'TO DO' || status === 'IN PROGRESS' || status === 'DONE') {
      next()
    } else {
      response.status(400)
      response.send('Invalid Todo Status')
    }
  } else if (priority !== undefined) {
    if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
      next()
    } else {
      response.status(400)
      response.send('Invalid Todo Priority')
    }
  } else if (category !== undefined) {
    if (category === 'WORK' || category === 'HOME' || category === 'LEARNING') {
      next()
    } else {
      response.status(400)
      response.send('Invalid Todo Category')
    }
  } else if (dueDate !== undefined) {
    if (isMatch(dueDate, 'yyyy-MM-dd')) {
      next()
    } else {
      response.status(400)
      response.send('Invalid Due Date')
    }
  } else if (todo !== undefined) {
    next()
  } else {
    response.status(400)
    response.send('Invalid Request')
  }
}

//GET TODO API
const hasStatus = requestQuery => {
  return requestQuery.status !== undefined
}
const hasPriority = requestQuery => {
  return requestQuery.priority !== undefined
}
const hasCategory = requestQuery => {
  requestQuery.category !== undefined
}
const hasPriorityAndStatus = requestQuery => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  )
}
const hasCategoryAndStatus = requestQuery => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  )
}

app.get('/todos/', verify, async (request, response) => {
  let data = null
  let getTodoQuery = ``
  const requestQuery = request.query
  const {category, priority, status, search_q = ''} = requestQuery

  switch (true) {
    case hasPriorityAndStatus(requestQuery):
      getTodoQuery = `
        SELECT 
          * U
        FROM
          todo
        WHERE
        todo like '%${search_q}%'
          priority = '${priority}' && status = '${status}'
      `
      break
    case hasCategoryAndStatus(requestQuery):
      getTodoQuery = `
        SELECT 
          *
        FROM
          todo
        WHERE
        todo like '%${search_q}%'
          category = '${category}' && status = '${status}'
      `
      break
    case hasStatus(requestQuery):
      getTodoQuery = `
        SELECT 
          *
        FROM
          todo
        WHERE
        todo like '%${search_q}%'
          status = '${status}'
      `
      break
    case hasPriority(requestQuery):
      getTodoQuery = `
        SELECT 
          *
        FROM
          todo
        WHERE
          todo like '%${search_q}%'
          priority = '${priority}';
      `
      break
    case hasCategory(requestQuery):
      getTodoQuery = `
        SELECT 
          *
        FROM
          todo
        WHERE
        todo like '%${search_q}%'
          category = '${category}'
      `
      break
    default:
      getTodoQuery = `
        SELECT 
          *
        FROM
          todo
        WHERE
          todo like '%${search_q}%'
      `
  }
  try {
    data = await db.all(getTodoQuery)
    response.send(data.map(eachobject => camelCase(eachobject)))
  } catch (err) {
    response.send(err.message)
  }
})

//GET PERTICULAR TODO
app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  getTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE
      id = ${todoId}
  `
  const todoDetails = await db.get(getTodoQuery)
  response.send(camelCase(todoDetails))
})

//GET PERTICULAR TODO BASED ON DATE
app.get('/agenda/', verify, async (request, response) => {
  const {date} = request.query
  const formatedDate = format(new Date(date), 'yyyy-MM-dd')
  getTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE
      due_date = '${formatedDate}'
  `
  const todoDetails = await db.all(getTodoQuery)
  response.send(todoDetails.map(eachobject => camelCase(eachobject)))
})

//POST TODO API
app.post('/todos/', verifyPost, async (request, response) => {
  const {id, todo, priority, status, category, dueDate} = request.body
  const postTodoQuery = `
    INSERT INTO
      todo (id, todo, priority, status, category, due_date)
    VALUES (
      ${id},
      '${todo}',
      '${priority}',
      '${status}',
      '${category}',
      '${dueDate}'
    )
  `
  await db.run(postTodoQuery)
  response.send('Todo Successfully Added')
})

//PUT TODO API
app.put('/todos/:todoId/', verifyPut, async (request, response) => {
  const {todoId} = request.params
  let updatedColumn = ''
  const requestBody = request.body

  switch (true) {
    case requestBody.todo !== undefined:
      updatedColumn = 'Todo'
      break
    case requestBody.priority !== undefined:
      updatedColumn = 'Priority'
      break
    case requestBody.status !== undefined:
      updatedColumn = 'Status'
      break
    case requestBody.category !== undefined:
      updatedColumn = 'Category'
      break
    case requestBody.dueDate !== undefined:
      updatedColumn = 'Due Date'
      break
  }

  const previousTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE 
      id = ${todoId};`
  const prevTodo = await db.get(previousTodoQuery)

  const {
    todo = prevTodo.todo,
    category = prevTodo.category,
    priority = prevTodo.priority,
    status = prevTodo.status,
    dueDate = prevTodo.due_date,
  } = request.body

  const updateTodoQuery = `
  UPDATE
    todo
  SET
    todo = '${todo}',
    category = '${category}',
    priority = '${priority}',
    status = '${status}',
    due_date = '${dueDate}'
  WHERE
    id = ${todoId};
  `
  await db.run(updateTodoQuery)
  response.send(`${updatedColumn} Updated`)
})

//DELETE TODO API
app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params

  const deleteTodoQuery = `
  DELETE FROM
    todo
  WHERE
    id = ${todoId};`
  await db.run(deleteTodoQuery)
  response.send('Todo Deleted')
})

module.exports = app
