const path = require('path');
const express = require('express');
const mysql = require('mysql');

const actionsRouter = express.Router();

const con = mysql.createConnection({
    user: "root",
    password: "123456",
    database: "CourseWorkDatabase"
});

con.connect(err => err ? console.error(err) : console.log("ActionsRouter connected to MySQL database!"));

actionsRouter.get('/', (req, res) => {
    res.redirect('/login');
    res.end();
});

actionsRouter.get('/session/info.json', (req, res) => {
    if (typeof req.session.username != 'undefined') {
        res.send(JSON.stringify(req.session.username));
        res.end();
    } else {
        res.redirect('/login');
        res.end();
    }
});

actionsRouter.get('/logout', (req, res) => {
    if (typeof req.session.username != 'undefined') {
        console.log(`Success log out: ${req.session.username.userType}`);
        req.session.destroy();
        res.end();
    } else {
        res.redirect('/login');
        res.end();
    }
});

actionsRouter.get('/login', (req, res) => {
    if (typeof req.session.username == 'undefined') {
        res.sendFile(path.join(__filename, '../../pages/log_in_page.html'));
    } else {
        res.redirect('/actions');
        res.end();
    }
});

actionsRouter.post('/login', (req, res) => {
    if (req.body.username !== "" && req.body.password !== "") {
        if (req.body.username === "admin") {
            if (req.body.password === "admin") {
                req.session.username = {
                    userType: "admin",
                    userId: "0"
                };
                console.log(`Success log in: ${req.session.username.userType}`);
                res.end();
            } else {
                res.status(404).send(JSON.stringify("Неправильный пароль для пользователя: admin"));
            }
        } else {
            con.query(`SELECT * FROM student WHERE login='${req.body.username}' AND password='${req.body.password}'`,
                function (err, result) {
                    if (err)
                        console.error(err);
                    else {
                        if (typeof result[0] != 'undefined') {
                            req.session.username = {
                                userType: "student",
                                userId: result[0].studentId
                            };
                            console.log(`Success log in: ${result[0].login}`);
                            res.end();
                        } else {
                            con.query(`SELECT * FROM professor WHERE login='${req.body.username}' AND password='${req.body.password}'`,
                                function (err2, result2) {
                                    if (err2)
                                        console.error(err2);
                                    else {
                                        if (typeof result2[0] != 'undefined') {
                                            req.session.username = {
                                                userType: "professor",
                                                userId: result2[0].professorId
                                            };
                                            console.log(`Success log in: ${result2[0].login}`);
                                            res.end();
                                        } else {
                                            res.status(404).send(JSON.stringify("Неправильный логин или пароль"));
                                        }
                                    }
                                }
                            );
                        }
                    }
                }
            );
        }
    } else {
        res.status(404).send(JSON.stringify("Не введены логин или пароль"));
    }
});

actionsRouter.get('/actions', (req, res) => {
    if (typeof req.session.username != 'undefined') {
        res.sendFile(path.join(__filename, '../../pages/actions_page.html'));
        res.end();
    } else {
        res.redirect('/login');
        res.end();
    }
});

actionsRouter.get('/add/student', (req, res) => {
    if (typeof req.session.username != 'undefined') {
        res.sendFile(path.join(__filename, '../../pages/add_student_page.html'));
        res.end();
    } else {
        res.redirect('/login');
        res.end();
    }
});

actionsRouter.post('/add/student', (req, res) => {
    if (req.body.firstName !== "" && req.body.secondName !== "" && req.body.studentGroup !== "") {
        let log = `${req.body.firstName} ${req.body.secondName}`.replace(" ", "").toLowerCase();
        log += (req.body.studentGroup).slice(-2);
        let pas = `123456`;
        if (log !== "admin") {
            con.query("INSERT INTO student (`firstName`, `secondName`, `group`, `login`, `password`) " + `VALUES ('${req.body.firstName}', '${req.body.secondName}', '${req.body.studentGroup}', '${log}', '${pas}')`,
                function (err1) {
                    if (err1) {
                        console.error(err1);
                        res.status(500).send(JSON.stringify("Copy of existing student"));
                    } else {
                        con.query(`SELECT studentId FROM student WHERE login='${log}'`,
                            function (err2, result) {
                                if (err2)
                                    console.error(err2);
                                else {
                                    res.status(200).send(`${result[0].studentId}`);
                                    res.end();
                                }
                            }
                        );
                    }
                }
            );
        } else {
            res.status(500).send(JSON.stringify("Копия имеющегося админа"));
        }
    } else {
        res.status(404).send(JSON.stringify("Не введены имя, фамилия или группа"));
    }
});

actionsRouter.get('/students', (req, res) => {
    if (typeof req.session.username != 'undefined') {
        res.sendFile(path.join(__filename, '../../pages/students_page.html'));
        res.end();
    } else {
        res.redirect('/login');
        res.end();
    }
});

actionsRouter.get('/students/all.json', (req, res) => {
    if (typeof req.session.username != 'undefined') {
        con.query(`SELECT * FROM student`,
            function (err, result) {
                if (err)
                    console.error(err);
                else {
                    if (typeof result[0] != 'undefined') {
                        res.status(200).send(JSON.stringify(result));
                        res.end();
                    } else {
                        res.status(404).send(JSON.stringify(`Не найдены студенты`));
                    }
                }
            }
        );
    } else {
        res.redirect('/login');
        res.end();
    }
});

actionsRouter.post('/students', (req, res) => {
    if (req.body.firstName !== "") {
        if (req.body.secondName !== "") {
            if (req.body.studentGroup !== "") {
                con.query(`SELECT * FROM student WHERE firstName='${req.body.firstName}' AND secondName='${req.body.secondName}' AND group='${req.body.studentGroup}'`,
                    function (err, result) {
                        if (err) {
                            console.error(err);
                        } else {
                            if (typeof result[0] != 'undefined') {
                                res.status(200).send(JSON.stringify(result));
                                res.end();
                            } else {
                                res.status(404).send(JSON.stringify(`Не найдены студенты`));
                            }
                        }
                    }
                );
            } else {
                con.query(`SELECT * FROM student WHERE firstName='${req.body.firstName}' AND secondName='${req.body.secondName}'`,
                    function (err, result) {
                        if (err) {
                            console.error(err);
                        } else {
                            if (typeof result[0] != 'undefined') {
                                res.status(200).send(JSON.stringify(result));
                                res.end();
                            } else {
                                res.status(404).send(JSON.stringify(`Не найдены студенты`));
                            }
                        }
                    }
                );
            }
        } else {
            if (req.body.studentGroup !== "") {
                con.query(`SELECT * FROM student WHERE firstName='${req.body.firstName}' AND group='${req.body.studentGroup}'`,
                    function (err, result) {
                        if (err) {
                            console.error(err);
                        } else {
                            if (typeof result[0] != 'undefined') {
                                res.status(200).send(JSON.stringify(result));
                                res.end();
                            } else {
                                res.status(404).send(JSON.stringify(`Не найдены студенты`));
                            }
                        }
                    }
                );
            } else {
                con.query(`SELECT * FROM student WHERE firstName='${req.body.firstName}'`,
                    function (err, result) {
                        if (err) {
                            console.error(err);
                        } else {
                            if (typeof result[0] != 'undefined') {
                                res.status(200).send(JSON.stringify(result));
                                res.end();
                            } else {
                                res.status(404).send(JSON.stringify(`Не найдены студенты`));
                            }
                        }
                    }
                );
            }
        }
    } else {
        if (req.body.secondName !== "") {
            if (req.body.studentGroup !== "") {
                con.query(`SELECT * FROM student WHERE secondName='${req.body.secondName}' AND group='${req.body.studentGroup}'`,
                    function (err, result) {
                        if (err) {
                            console.error(err);
                        } else {
                            if (typeof result[0] != 'undefined') {
                                res.status(200).send(JSON.stringify(result));
                                res.end();
                            } else {
                                res.status(404).send(JSON.stringify(`Не найдены студенты`));
                            }
                        }
                    }
                );
            } else {
                con.query(`SELECT * FROM student WHERE secondName='${req.body.secondName}'`,
                    function (err, result) {
                        if (err) {
                            console.error(err);
                        } else {
                            if (typeof result[0] != 'undefined') {
                                res.status(200).send(JSON.stringify(result));
                                res.end();
                            } else {
                                res.status(404).send(JSON.stringify(`Не найдены студенты`));
                            }
                        }
                    }
                );
            }
        } else {
            if (req.body.studentGroup !== "") {
                con.query(`SELECT * FROM student WHERE group='${req.body.studentGroup}'`,
                    function (err, result) {
                        if (err) {
                            console.error(err);
                        } else {
                            if (typeof result[0] != 'undefined') {
                                res.status(200).send(JSON.stringify(result));
                                res.end();
                            } else {
                                res.status(404).send(JSON.stringify(`Не найдены студенты`));
                            }
                        }
                    }
                );
            } else {
                res.status(404).send(JSON.stringify("Не введены имя, фамилия или группа"));
            }
        }
    }
});

actionsRouter.get('/add/professor', (req, res) => {
    if (typeof req.session.username != 'undefined') {
        res.sendFile(path.join(__filename, '../../pages/add_professor_page.html'));
        res.end();
    } else {
        res.redirect('/login');
        res.end();
    }
});

actionsRouter.post('/add/professor', (req, res) => {
    if (req.body.firstName !== "" && req.body.secondName !== "") {
        let log = `${req.body.firstName} ${req.body.secondName}`.replace(" ", "").toLowerCase();
        let pas = `123456`;
        if (log !== "admin") {
            con.query("INSERT INTO professor (`firstName`, `secondName`, `login`, `password`) " + `VALUES ('${req.body.firstName}', '${req.body.secondName}', '${log}', '${pas}')`,
                function (err1) {
                    if (err1) {
                        console.error(err1);
                        res.status(500).send(JSON.stringify("Копия имеющегося преподавателя"));
                    } else {
                        con.query(`SELECT professorId FROM professor WHERE login='${log}'`,
                            function (err2, result) {
                                if (err2)
                                    console.error(err2);
                                else {
                                    res.status(200).send(`${result[0].professorId}`);
                                    res.end();
                                }
                            }
                        );
                    }
                }
            );
        } else {
            res.status(500).send(JSON.stringify("Копия имеющегося админа"));
        }
    } else {
        res.status(404).send(JSON.stringify("Не введены имя или фамилия"));
    }
});

actionsRouter.get('/professors', (req, res) => {
    if (typeof req.session.username != 'undefined') {
        res.sendFile(path.join(__filename, '../../pages/professors_page.html'));
        res.end();
    } else {
        res.redirect('/login');
        res.end();
    }
});

actionsRouter.get('/professors/all.json', (req, res) => {
    if (typeof req.session.username != 'undefined') {
        con.query(`SELECT * FROM professor`,
            function (err, result) {
                if (err)
                    console.error(err);
                else {
                    if (typeof result[0] != 'undefined') {
                        res.status(200).send(JSON.stringify(result));
                        res.end();
                    } else {
                        res.status(404).send(JSON.stringify(`Не найдены преподаватели`));
                    }
                }
            }
        );
    } else {
        res.redirect('/login');
        res.end();
    }
});

actionsRouter.post('/professors', (req, res) => {
    if (req.body.firstName !== "") {
        if (req.body.secondName !== "") {
            con.query(`SELECT * FROM professor WHERE firstName='${req.body.firstName}' AND secondName='${req.body.secondName}'`,
                function (err, result) {
                    if (err) {
                        console.error(err);
                    } else {
                        if (typeof result[0] != 'undefined') {
                            res.status(200).send(JSON.stringify(result));
                            res.end();
                        } else {
                            res.status(404).send(JSON.stringify(`Не найдены преподаватели`));
                        }
                    }
                }
            );
        } else {
            con.query(`SELECT * FROM professor WHERE firstName='${req.body.firstName}'`,
                function (err, result) {
                    if (err) {
                        console.error(err);
                    } else {
                        if (typeof result[0] != 'undefined') {
                            res.status(200).send(JSON.stringify(result));
                            res.end();
                        } else {
                            res.status(404).send(JSON.stringify(`Не найдены преподаватели`));
                        }
                    }
                }
            );
        }
    } else {
        if (req.body.secondName !== "") {
            con.query(`SELECT * FROM professor WHERE secondName='${req.body.secondName}'`,
                function (err, result) {
                    if (err) {
                        console.error(err);
                    } else {
                        if (typeof result[0] != 'undefined') {
                            res.status(200).send(JSON.stringify(result));
                            res.end();
                        } else {
                            res.status(404).send(JSON.stringify(`Не найдены преподаватели`));
                        }
                    }
                }
            );
        } else {
            res.status(404).send(JSON.stringify("Не введены имя или фамилия"));
        }
    }
});

module.exports = actionsRouter;