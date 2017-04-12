var Student = require('../models/student');
var Faculty = require('../models/faculty');
var Course = require('../models/course');
var jwt = require('jsonwebtoken');
var config = require('../config/config.js');
var shortid = require('shortid');

module.exports = {
    GetRegisteredCourses: function(req, res, emp_id) {
        Faculty.findOne({
            'empid': emp_id
        }, function(err, faculty) {
            if (err) throw err;
            Course.find({
                faculties: {
                    "$in": [faculty.name]
                }
            }, function(err, courselist) {
                if (err) throw err;
                if (courselist[0] == undefined || courselist == null) failureResponse(req, res, 'No alloted course found!');
                else {
                    res.json({
                        status: 1,
                        courses: courselist,
                        newToken: req.token
                    });
                }
            });
        });
    },

    getAccessToken: function(req, res, emp_id) {
        Faculty.findOne({
            'empid': emp_id
        }, function(err, faculty) {
            if (err) throw err;
            Course.findOne({
                'code': req.body.code,
                faculties: {
                    "$in": [
                        faculty.name
                    ]
                }
            }, function(err, course) {
                if (err) throw err;
                if (!course) failureResponse(req, res, 'No course found with this code.');
                else {
                    var token = {
                        course: req.body.code,
                        token: shortid.generate()
                    };
                    faculty.tokens.push(token);
                    faculty.save(function(err) {
                        if (err) throw err;
                        res.json({
                            status: 1,
                            accessToken: token,
                            newToken: req.token
                        });
                    });
                }
            })
        });
    },

    getStudentList: function(req, res, emp_id) {
        Faculty.findOne({
            'empid': emp_id
        }, function(err, faculty) {
            if (err) throw err;
            Student.find({
                'courses': {
                    $elemMatch: {
                        courseFaculty: faculty.name,
                        courseSlot: req.body.slot
                    }
                }
            }, function(err, students) {
                if (err) throw err;
                if (!students || students[0] == undefined) failureResponse(req, res, 'No student registered in this course or slot!');
                else {
                    var response = [];
                    for (i = 0; i < students.length; i++) {
                        var temp = {
                            name: students[i].name,
                            regno: students[i].regno,
                            email: students[i].email,
                            phone: students[i].phone
                        }
                        response.push(temp);
                    }
                    res.json({
                        status: 1,
                        students: response,
                        newToken: req.token
                    });
                }
            });
        });
    }

}

function failureResponse(req, res, message) {
    res.json({
        status: 0,
        message: message,
        newToken: req.token
    });
}