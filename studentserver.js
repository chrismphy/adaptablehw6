const express = require('express');
const app = express();
const cors=require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const db = require('./db'); // Adjust the path based on where you've placed the db.js file
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUI = require('swagger-ui-express');

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
