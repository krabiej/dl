 // app/routes.js

// grab the card model we just created
var Team = require('./model/team');
var Report = require('./model/report');
var ConfigParam = require('./model/configparam');
var Card = require('./model/card');
var Sponsor = require('./model/sponsor');
var Board = require('./model/board');
var UserApp  = require('./model/userApp');
var LeanKitClient  = require("leankit-client");
var https = require('https');

module.exports = function(app) {

    // server routes ===========================================================
    // handle things like api calls
    // authentication routes


    function isAuthorized(req, res, next) {
        if (req.session.authorized) next();
        else {
            var params = req.query;
            params.backUrl = req.path;
            res.redirect('/login?' + query.stringify(params));
        }
    };

    // =========================== TEAM ================================

    // get all teams
    app.get('/api/teams', function(req, res) {
        Team.find(function(err, teams) {
            if (err)
                res.send(err);
            res.json(teams);
        });
    });

    // get a single team
    app.get('/api/teams/:id', function(req, res) {
        Team.findOne({_id : req.params.id}, function(err, team) {
            if (err)
                res.send(err);
            res.json(team);
        });
    });

    // update a single team
    app.put('/api/teams/:id', function(req, res) {
        Team.findOneAndUpdate({_id: req.params.id}, {$set: req.body}, function (err, team) {
            res.send(team);
        });
    });

    // =========================== REPORT ================================

    // get a report in excel format
    app.get('/api/reports/:id', function(req, res) {
        Report.find({_id: req.params.id}, function(err, reports) {
            if (err)
                res.send(err);
            var date = reports[0].generation_date.toISOString().replace(/T/, ' ').replace(/\..+/, '')
            res.append('Content-Disposition', 'attachment; filename=report_' + date + '.xlsx');
            res.append('Content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.send(reports[0].xls_data);
          });
    });

    // gel all reports
    app.get('/api/reports', function(req, res) {
        // use mongoose to get all teams in the database
        Report.find({}).sort('-generation_date').exec (function(err, reports) {
            if (err)
                res.send(err);
            res.json(reports);
        });
    });


    // generate new report with python script
    app.get('/api/genreport', function(req, res) {

        var python = require('child_process').spawn('/usr/bin/python3.4', ['/home/httpd/dl/pmotoolsweb/public/python/py_gen.py']);
        //var python = require('child_process').spawn('C://python34//python.exe', ["C://Users//jgrzywna//PycharmProjects//dl//pmotoolsweb//public//python//py_gen.py"]);

        var output = "";
        python.stdout.on('data', function(){ output += data });
        python.on('close', function(code)
        {
            if (code !== 0) {  return res.send(500, code); }
            return res.send(200, output)
        });
    });

    // =========================== CONFIG ================================

    // get a single config param
    app.get('/api/params/:id', function(req, res) {
        ConfigParam.find({param_key: req.params.id}, function(err, configparams) {
            if (err)
                res.send(err);
            res.json (configparams);
          });
    });

    // =========================== CARD ================================

    // get all initiatives
    app.get('/api/cards', function(req, res) {
        Card.find({board_masterlane_title: "Current development plan"},
        'title extended_data team_name taskboard_completed_card_size size taskboard_completion_percent due_date workflow_status_name',
        function(err, cards) {
            if (err)
                res.send(err);
            res.json(cards);
        });
    });

    // get a single card
    app.get('/api/cards/:id', function(req, res) {
        Card.findOne({_id : req.params.id}, function(err, card) {
            if (err)
                res.send(err);
            res.json(card);
        });
    });

    // update a single card
    app.put('/api/cards/:id', function(req, res) {
        Card.findOneAndUpdate({_id: req.params.id}, {$set: req.body}, function (err, card) {
            res.send(card);
        });
    });

    // =========================== CHARTS ================================

    app.get('/api/dashboard/cardbysponsor', function(req, res){
        Card.aggregate([{
                $match: {
                    board_masterlane_title: "Current development plan",
                    workflow_status_name: "In progress" }
                },
                {
                $group: { _id: '$extended_data.sponsor_name',
                    count: {$sum: 1} }
                },
                { $sort: {count: -1} }
            ], function (err, result) {
                if (err)
                    res.send(err);
                res.json(result);
        });
    });

    app.get('/api/dashboard/cardbyworkflowstatus', function(req, res){
        Card.aggregate([
                {
                    $match: { board_masterlane_title: "Current development plan" }
                },
                {
                    $group: {
                        _id: '$workflow_status_name',
                        count: {$sum: 1}
                    }
                },
                {
                    $sort: {count: -1}
                }
            ], function (err, result) {
                if (err)
                    res.send(err);
                res.json(result);
        });
    });


    // =========================== SPONSOR ================================

    // get all sponsors
    app.get('/api/sponsors', function(req, res) {
        Sponsor.find(function(err, sponsors) {
            if (err)
                res.send(err);
            res.json(sponsors);
        });
    });

    // create new sponsor
    app.post('/api/sponsors', function(req, res) {
        Sponsor.create(req.body, function (err, small) {
            if (err)
                res.send(err);
            res.send(200);
        })
    });

    // update a single sponsor
    app.put('/api/sponsors/:id', function(req, res) {
        Sponsor.findOneAndUpdate({_id: req.params.id}, {$set: req.body}, function (err, sponsor) {
            res.send(sponsor);
        });
    });

    // delete a single sponsor
    app.delete('/api/sponsors/:id', function(req, res) {
        Sponsor.remove({_id: req.params.id}, function (err) {
            res.send(200);
        });
    });


    // =========================== USER ================================
    // create new user
    app.put('/api/users', function(req, res) {
        UserApp.create(req.body, function (err, small) {
            if (err)
                res.send(err);
            res.send(200);
        })
    });

    // get a single user
    app.get('/api/users/:id', function(req, res) {
        UserApp.findOne({upn : req.params.id}, function(err, user) {
            if (err)
                res.send(err);
            res.json(user);
        });
    });


    // update a single user
    app.put('/api/users/:id', function(req, res) {
        UserApp.findOneAndUpdate({_id: req.params.id}, {$set: req.body}, function (err, user) {
            res.send(user);
        });
    });

    // =========================== LEANKIT SYNCHRONIZATION ================================

    // get all boardsfrom leankit
    app.get('/api/synchronize/boards', function(req, res) {
        var client = new LeanKitClient  ("dreamlab", "joanna.grzywna@grupaonet.pl", "piotrek2003");
        client.getBoards(function(err, boards) {
            if (err)
                res.send(err);
            res.json(boards);
        });
    });

    // get single board
    app.get('/api/synchronize/boards/:id', function(req, res) {
        var client = new LeanKitClient  ("dreamlab", "joanna.grzywna@grupaonet.pl", "piotrek2003");
        client.getBoard(req.params.id, function(err, board) {
            if (err)
                res.send(err);
            res.json(board);
        });
    });


    // =========================== CHECK AUTHENTICATION ================================
    app.get('/api/me/:id', function(req, res) {

        https.get({
                host: 'cloud.onet.pl',
                path: '/me?access_token=' + req.params.id
        }, function(response) {
            // Continuously update stream with data
            var body = '';
            response.on('data', function(d) {
                body += d;
            });
            response.on('end', function() {
                res.send(body);
                // Data reception is done, do whatever with it!
//                var parsed = JSON.parse(body);
//                callback({
//                    email: parsed.email,
//                    password: parsed.pass
//                });
            });
        });
    });


    // =========================== FRONTEND IN ANGULAR ================================
    // route to handle all angular requests
    app.get('*', function(req, res) {
        res.sendfile('./public/index.html'); // load our public/index.html file
    });

};
