//studentserver.js
const express = require('express')
const app = express()
const bodyParser = require('body-parser');
const fs = require('fs');
const glob = require("glob");
const { type } = require('os');
const path = require('path');
const db = require('./db'); // Adjust the path based on where you've placed the db.js file
const { Pool } = require('pg');

const pool = new Pool({
  user: 'chrismphy',
  host: 'localhost',
  database: 'postgres',
  password: 'Rubedo1989',
  port: 5432,
});

// Now you can use the `db` object to make database queries using knex

const swaggerJsDoc = require('swagger-jsdoc')
const swaggerUI = require('swagger-ui-express')
const swaggerOptions = {
  swaggerDefinition: {
    info: {
      title: 'Student Server API',
      version: '1.0.0'
    }
  },
  apis: ['studentserver.js']

};
ensureDirectoryExistence('students');
const swaggerDocs = swaggerJsDoc(swaggerOptions)
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDocs))
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }))
app.use(express.static('./public'));

// Global variable to hold all students
let listOfStudents = {};
//ensure directory existence
function ensureDirectoryExistence(dirPath) {
  if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath);
  }
}
async function loadAllStudents() {
  const dir = 'students';

  // Ensure students directory exists
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }

  await client.connect();

  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const data = fs.readFileSync(filePath, 'utf8');
    const student = JSON.parse(data);

    await client.query('INSERT INTO students (record_id, first_name, last_name, gpa, enrolled, uploaded_at) VALUES ($1, $2, $3, $4, $5, $6)', [student.record_id, student.first_name, student.last_name, student.gpa, student.enrolled, student.uploaded_at || new Date()]);
  }
  await client.end();
  }

// Load all students into memory
loadAllStudents();
/**
 * @swagger
 * /students:
 *   post:
 *     summary: Creates a new student object with all of its attributes.
 *     description: Use this endpoint to create a new student.
 *     parameters:
 *       - name: first_name
 *         description: Student's first name
 *         in: formData
 *         required: true
 *         schema:
 *           type: string
 *       - name: last_name
 *         description: Student's last name
 *         in: formData
 *         required: true
 *         schema:
 *           type: string
 *       - name: gpa
 *         description: Student's GPA
 *         in: formData
 *         required: true
 *         schema:
 *           type: string
 *       - name: enrolled
 *         description: Student's enrolled status
 *         in: formData
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Success. The student object has been created.
 *       409:
 *         description: Conflict. The student object already exists.
 */

const fsPromises = require('fs').promises;

app.post('/students', async (req, res) => {
    try {
        // Type casting at the start
        let student = {
            first_name: req.body.first_name,
            last_name: req.body.last_name,
            gpa: parseFloat(req.body.gpa),
            enrolled: req.body.enrolled === 'true',
            record_id: new Date().getTime()
        };

        if (checkStudentExists(student.first_name, student.last_name)) {
            return res.status(409).send({ message: 'Conflict - Student already exists' });
        }

        const dir = 'students';
        ensureDirectoryExistence(dir); // Ensure directory exists

        // Save the new student to a file
        await fsPromises.writeFile(`${dir}/${student.record_id}.json`, JSON.stringify(student, null, 2));

        // Add the new student to our in-memory list
        listOfStudents[student.record_id] = student;

        return res.status(201).send({ message: 'Student added successfully!', record_id: student.record_id });

    } catch (err) {
        console.error(err);
        return res.status(500).send({ message: 'Internal Server Error' });
    }
});

function checkStudentExists(firstName, lastName) {
    for (let recordId in listOfStudents) {
        const student = listOfStudents[recordId];
        if (student.first_name === firstName && student.last_name === lastName) {
            return true;
        }
    }
    return false;
}

 
/**
 * @swagger
 * /students/{recordid}:
 *   get:
 *     summary: Get a student by record ID.
 *     description: Use this endpoint to retrieve a student based on their record ID.
 *     parameters:
 *       - name: recordid
 *         description: Student's record ID
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success. The student object has been retrieved.
 *       404:
 *         description: Error. The requested resource was not found.
 */
app.get('/students/:record_id', function (req, res) {
  var record_id = req.params.record_id;

  // First, check if the student exists in the in-memory object
  const studentInMemory = listOfStudents[record_id];

  if (studentInMemory) {
      return res.status(200).send(studentInMemory);
  }

  // If not found in-memory, attempt to read from the file
  fs.readFile("students/" + record_id + ".json", "utf8", function (err, data) {
      if (err) {
          var rsp_obj = {};
          rsp_obj.record_id = record_id;
          rsp_obj.message = 'error - resource not found';
          return res.status(404).send(rsp_obj);
      } else {
          const student = JSON.parse(data);
          student.record_id = parseInt(student.record_id, 10);
          student.gpa = parseFloat(student.gpa);
          student.enrolled = student.enrolled === true || student.enrolled === "true";
          return res.status(200).send(student);
      }
  });
});


function readFiles(files, arr, res) {
  const fname = files.pop();
  if (!fname) return;

  fs.readFile(fname, "utf8", function (err, data) {
    if (err) {
      return res.status(500).send({ "message": "error - internal server error" });
    } else {
      const student = JSON.parse(data);

      // Ensure the attributes are of the right type
      if (student.gpa) student.gpa = parseFloat(student.gpa);
      if (student.record_id) student.record_id = parseInt(student.record_id, 10);
      if (typeof student.enrolled === 'string') student.enrolled = student.enrolled === 'true';

      arr.push(student);

      if (files.length === 0) {
        return res.status(200).send({ students: arr });
      } else {
        readFiles(files, arr, res);
      }
    }
  });
}
/**
 * @swagger
 * /students:
 *   get:
 *     summary: Get an array of all students.
 *     description: Use this endpoint to retrieve an array of all students.
 *     responses:
 *       200:
 *         description: Success. An array of students has been retrieved.
 *       500:
 *         description: Error. Internal server error occurred.
 */
app.get('/students', function (req, res) {
  console.log("get students")
  var obj = {};
  var arr = [];
  filesread = 0;

  glob("students/*.json", null, function (err, files) {
    if (err) {
      return res.status(500).send({ "message": "error - internal server error" });
    }
    readFiles(files, [], res);
  });

});

//update by record id below
/**
* @swagger
* /students/{record_id}:
*   put:
*     summary: Update an existing student by record ID.
*     description: Use this endpoint to update an existing student based on their record ID.
*     parameters:
*       - name: record_id
*         description: Student's record ID
*         in: path
*         required: true
*         schema:
*           type: string
*       - name: first_name
*         description: Student's first name
*         in: formData
*         required: true
*         schema:
*           type: string
*       - name: last_name
*         description: Student's last name
*         in: formData
*         required: true
*         schema:
*           type: string
*       - name: gpa
*         description: Student's GPA
*         in: formData
*         required: true
*         schema:
*           type: string
*       - name: enrolled
*         description: Student's enrolled status
*         in: formData
*         required: true
*         schema:
*           type: string
*     responses:
*       200:
*         description: Success. The student has been updated.
*       422:
*         description: Unprocessable Entity. Unable to update resource due to client-side error.
*       404:
*         description: Not Found. The requested student was not found.
*/


//put method to update by id, will not replace entire student object for missing attributes
app.put('/students/:record_id', async function (req, res) {
  var record_id = req.params.record_id;
  var fname = "students/" + record_id + ".json";
  var rsp_obj = {};

  try {
    const data = await fsPromises.readFile(fname, "utf8");
    var existingObj = JSON.parse(data);

  // Check for missing or invalid attributes(422)
  // Check if the request body is empty
    if (Object.keys(req.body).length === 0) {
      return res.status(422).send({ message: 'Empty update payload' });
      }

  // Validate data types
    if (req.body.gpa && typeof req.body.gpa !== 'number') {
      return res.status(422).send({ message: 'Invalid data type for gpa' });
      }

    if (req.body.enrolled && typeof req.body.enrolled !== 'boolean') {
      return res.status(422).send({ message: 'Invalid data type for enrolled' });
      }
  // Validate data values
    if (req.body.gpa < 0.0 || req.body.gpa > 4.0) {
     return res.status(422).send({ message: 'GPA should be between 0.0 and 4.0' });
      }

    // Update the attributes from the request body, if they exist
    if (req.body.first_name) {
      existingObj.first_name = req.body.first_name;
  }
  if (req.body.last_name) {
      existingObj.last_name = req.body.last_name;
  }
  if (req.body.gpa) {
      existingObj.gpa = req.body.gpa;
  }
  if (typeof req.body.enrolled !== 'undefined') {  // We use typeof because enrolled can be false, which is falsy.
      existingObj.enrolled = req.body.enrolled;
  }
  

    var updatedStr = JSON.stringify(existingObj, null, 2);
  
    // Write the updated student object back to the file
    await fsPromises.writeFile(fname, updatedStr);

    rsp_obj.record_id = record_id;
    rsp_obj.message = 'successfully updated';
    return res.status(200).send(rsp_obj); //200 should be the ideal code if I am updating. 201 implies 'created' new student

  } catch (err) {
    if (err.code === 'ENOENT') {
      rsp_obj.record_id = record_id;
      rsp_obj.message = 'error - resource not found';
      return res.status(404).send(rsp_obj);
    } else {
      // Handle other errors here
      return res.status(500).send({ "message": "error - internal server error" });
    }
  }
}); //end put method to update by id, will not replace entire student object for missing attributes

//swagger to DELETE a student by their record ID
/**
 * @swagger
 * /students/{record_id} :
 *  delete:
 *    description: Deletes a from the student directory by their record ID.
 *    parameters:
 *    - name: record_id
 *      description: Student's Record ID
 *      in: path
 *      required: true
 *      schema:
 *        type: string
 *    responses:
 *      200:
 *        description: record deleted
 *      404:
 *        description: error - resource not found
 */


app.delete('/students/:record_id', function (req, res) {
  var record_id = req.params.record_id;
  var fname = "students/" + record_id + ".json";

  fs.unlink(fname, function (err) {
    var rsp_obj = {};
    if (err) {
      rsp_obj.record_id = record_id;
      rsp_obj.message = 'error - resource not found';
      return res.status(404).send(rsp_obj);
    } else {
      rsp_obj.record_id = record_id;
      // Send a 204 status with no content in the body
      return res.status(204).send();
    }
  });
}); //end delete method



//Swagger to serach by last name
/**
 * @swagger
 * /students/search/{last_name}:
 *   get:
 *     summary: Search for student(s) by last name.
 *     description: Use this endpoint to search for a student based on their last name.
 *     parameters:
 *       - name: last_name
 *         description: Student's last name
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success. The student object has been retrieved
 *       404:
 *         description: Error. No student(s) with the given last name were found
 */

// method for searching by last name
app.get('/students/search/:last_name', function (req, res) {
  const lastName = req.params.last_name;
  let matchingStudents = [];

  // Use glob package
  glob("students/*.json", null, function (err, files) {
    if (err) {
      return res.status(500).send({ "message": "error - internal server error" });
    }

    let readCount = 0;

    for (const file of files) {
      fs.readFile(file, "utf8", function (err, data) {
        if (err) {
          return res.status(500).send({ "message": "error - internal server error" });
        }
        
        const student = JSON.parse(data);

        if (student.last_name === lastName) {
          matchingStudents.push(student);
        }

        readCount++;

        if (readCount === files.length) {
          if (matchingStudents.length > 0) {
            return res.status(200).send(matchingStudents);
          } else {
            return res.status(404).send({ "message": "No students with the given last name were found." });
          }
        }
      });
    }
  });
}); //end search by last name 

const PORT = process.env.PORT || 5678;

const server = app.listen(PORT, () => {
   console.log(`Server is running on port ${PORT}...`);
   console.log(`Webapp:   http://localhost:${PORT}/`);
   console.log(`API Docs: http://localhost:${PORT}/api-docs`);
});

module.exports = { app, server }; // Export both app and server
