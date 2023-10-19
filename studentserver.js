const express = require('express');
const app = express();
const cors=require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const db = require('./db'); // Adjust the path based on where you've placed the db.js file
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUI = require('swagger-ui-express');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});



app.use(cors());
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
const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDocs));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('./public'));

// Global variable to hold all students
let listOfStudents = {};

//ensure directory existence
function ensureDirectoryExistence(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath);
  }
}


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

      // Check if the student already exists in the database
      const existingStudent = await db('students')
          .where('first_name', student.first_name)
          .where('last_name', student.last_name)
          .first();

      if (existingStudent) {
          return res.status(409).send({ message: 'Conflict - Student already exists' });
      }

      // Insert the new student into the database
      await db('students').insert(student);

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

app.get('/students/:record_id', async (req, res) => {
  const recordId = req.params.record_id; // Retrieve the record_id from the URL parameter

  try {
    // Query the database for the student with the specified record ID
    const student = await db
      .select('*')
      .from('students')
      .where({ record_id: recordId })
      .first(); // Retrieve the first matching record

    if (student) {
      // Student record found, return it as a response
      res.status(200).send(student);
    } else {
      // Student record not found
      res.status(404).send({ message: 'Student not found' });
    }
  } catch (err) {
    console.error("Error fetching student:", err);
    res.status(500).send({ message: 'Internal Server Error' });
  }
});


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



//load the list of students
app.get('/students', async function (req, res) {
    console.log("get students");
    
    try {
        // Query all students from the database
        const students = await db.select('*').from('students');

        // Send the list of students as a response
        res.status(200).send(students);
    } catch (err) {
        console.error("Error fetching students:", err);
        res.status(500).send({ "message": "error - internal server error" });
    }
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


// Assuming you're using some SQL database connection library


app.put('/students/:record_id', async (req, res) => {
  const record_id = req.params.record_id;
  const { first_name, last_name, gpa, enrolled } = req.body;

  try {
      const result = await pool.query(
          "UPDATE public.students SET first_name = $1, last_name = $2, gpa = $3, enrolled = $4 WHERE record_id = $5;",
          [first_name, last_name, gpa, enrolled, record_id]
      );

      if (result.rowCount > 0) {
          res.status(200).json({ message: "Successfully updated!" });
      } else {
          res.status(404).json({ message: "Record not found!" });
      }
  } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal Server Error" });
  }
});

//end put method to update by id, will not replace entire student object for missing attributes

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


app.delete('/students/:record_id', async (req, res) => {
  try {
      const record_id = req.params.record_id;

      // Check if the student exists in the database
      const existingStudent = await db('students')
          .where('record_id', record_id)
          .first();

      if (!existingStudent) {
          return res.status(404).send({ message: 'Error - Student not found' });
      }

      // Delete the student from the database
      await db('students')
          .where('record_id', record_id)
          .delete();
      return res.status(204).send();
  } catch (err) {
      console.error(err);
      return res.status(500).send({ message: 'Internal Server Error' });
  }
});
//end delete method



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
app.get('/students/search/:last_name', async (req, res) => {
  try {
    const lastName = req.params.last_name;

    // Query the database for students with the specified last name
    const matchingStudents = await db('students')
      .where('last_name', 'like', `%${lastName}%`)
      .select('*');

    if (matchingStudents.length > 0) {
      return res.status(200).send(matchingStudents);
    } else {
      return res.status(404).send({ "message": "No students with the given last name were found." });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).send({ message: 'Internal Server Error' });
  }
});

 //end search by last name 

const PORT = process.env.PORT || 5678;

const server = app.listen(PORT, () => {
   console.log(`Server is running on port ${PORT}...`);
   console.log(`Webapp:   http://localhost:${PORT}/`);
   console.log(`API Docs: http://localhost:${PORT}/api-docs`);
});

module.exports = { app, server }; // Export both app and server
