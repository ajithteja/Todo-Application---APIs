const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
let path = require("path");

let dbPath = path.join(__dirname, "todoApplication.db");

let app = express();
app.use(express.json());

let db = null;
let funcConnectingWithDb = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("SERVER RUNNING At http://localhost:3000/");
    });
  } catch (e) {
    console.log(`ERROR: ${e.message}`);
  }
};

funcConnectingWithDb();

// sample

app.get("/", (request, response) => {
  response.send("Hi");
});

// API 1   Path: /todos/ => /todos/?

app.get("/todos/", async (request, response) => {
  let { status, priority, search_q = "" } = request.query;

  let funcStatusAndPriority = (requestQuery) => {
    return (
      requestQuery.status !== undefined && requestQuery.priority !== undefined
    );
  };

  let funcStatus = (requestQuery) => {
    return requestQuery.status !== undefined;
  };

  let funcPriority = (requestQuery) => {
    return requestQuery.priority !== undefined;
  };

  let searchQuery;
  switch (true) {
    case funcStatusAndPriority(request.query):
      searchQuery = `SELECT * FROM todo 
            WHERE todo LIKE '%${search_q}%'
            AND status = '${status}'
            AND priority = '${priority}';`;
      console.log(searchQuery);
      break;

    case funcStatus(request.query):
      searchQuery = `SELECT * FROM todo
            WHERE todo LIKE '%${search_q}%'
            AND status = '${status}';`;
      console.log(searchQuery);
      break;

    case funcPriority(request.query):
      searchQuery = `SELECT * FROM todo
            WHERE todo LIKE '%${search_q}%'
            AND priority = '${priority}';`;
      console.log(searchQuery);
      break;

    default:
      searchQuery = `SELECT * FROM todo
            WHERE todo LIKE '%${search_q}%';`;
      break;
  }

  let getDetailsArr = await db.all(searchQuery);
  response.send(getDetailsArr);
});

// API 2  GET  Path: /todos/:todoId/    |    Returns a specific todo based on the todo ID

app.get("/todos/:todoId/", async (request, response) => {
  let { todoId } = request.params;
  let searchQueryId = `SELECT * FROM todo
    WHERE id = ${todoId};`;
  let idObj = await db.get(searchQueryId);
  response.send(idObj);
});

// API 3 POST Path: /todos/    |    Create a todo in the todo table

app.post("/todos/", async (request, response) => {
  let postBody = request.body;
  let { id, todo, priority, status } = postBody;
  let sqlQueryToPost = `INSERT INTO todo (id, todo, priority ,status)
    VALUES( ${id}, '${todo}', '${priority}' ,'${status}');`;
  let res = await db.run(sqlQueryToPost);
  response.send("Todo Successfully Added");
});

// API 4 PUT  Path: /todos/:todoId/
// Updates the details of a specific todo based on the todo ID

app.put("/todos/:todoId/", async (request, response) => {
  let { todoId } = request.params;
  let requestBody = request.body;

  let updatedColumn = "";
  switch (true) {
    case requestBody.status !== undefined:
      updatedColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updatedColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updatedColumn = "Todo";
      break;
  }

  let existingDataQuery = `SELECT * FROM todo
        WHERE id = ${todoId};`;
  let existingData = await db.get(existingDataQuery);

  let {
    todo = existingData.todo,
    status = existingData.status,
    priority = existingData.priority,
  } = requestBody;

  let updateQuery = `UPDATE todo
    SET status = '${status}',
    priority = '${priority}',
    todo = '${todo}'
    WHERE id = ${todoId};`;
  let updateData = await db.run(updateQuery);
  response.send(`${updatedColumn} Updated`);
});

// API 5 DELETE path: /todos/:todoId/

app.delete("/todos/:todoId/", async (request, response) => {
  let { todoId } = request.params;
  let deleteIdQuery = `DELETE FROM todo
    WHERE id = ${todoId};`;
  await db.run(deleteIdQuery);
  response.send("Todo Deleted");
});

module.exports = app;
