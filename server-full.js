// Minimal Simple REST API Handler (With MongoDB and Socket.io)
// Plus support for simple login and session
// Plus support for file upload
// Based on Yaron Biton's misterBIT.co.il server;

"use strict";
const express = require('express'),
	bodyParser = require('body-parser'),
	cors = require('cors'),
	mongodb = require('mongodb')

const clientSessions = require("client-sessions");
const multer = require('multer')

// Configure where uploaded files are going
const uploadFolder = '/uploads';
var storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, __dirname + uploadFolder);
	},
	filename: function (req, file, cb) {
		cl('file', file);
		const ext = file.originalname.substr(file.originalname.lastIndexOf('.'));
		cb(null, file.fieldname + '-' + Date.now() + ext)
	}
})
var upload = multer({ storage: storage })

const app = express();

app.use('/', express.static(__dirname));

let port = process.env.PORT || 5000;

app.listen(port, function () {
	console.log('server started ' + port);
});

var corsOptions = {
	origin: /http:\/\/localhost:\d+/,
	credentials: true
};




app.use(express.static('uploads'));
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(clientSessions({
	cookieName: 'session',
	secret: 'C0d1ng 1s fun 1f y0u kn0w h0w', // set this to a long random string!
	duration: 30 * 60 * 1000,
	activeDuration: 5 * 60 * 1000,
}));

const http = require('http').Server(app);
const io = require('socket.io')(http);


function dbConnect() {

	return new Promise((resolve, reject) => {
		// Connection URL
		// const dbName = 'FoodTrack'
		var url = `mongodb://guy:123456@ds117209.mlab.com:17209/sprint3`;
		// var url = `mongodb://localhost:27017/${dbName}`;
		// Use connect method to connect to the Server
		mongodb.MongoClient.connect(url, function (err, db) {
			if (err) {
				cl('Cannot connect to DB', err)
				reject(err);
			}
			else {
				//cl("Connected to DB");
				resolve(db);
			}
		});
	});
}

// GETs a list
app.get('/data/:objType', function (req, res) {
	const objType = req.params.objType;
	dbConnect().then((db) => {
		const collection = db.collection(objType);

		collection.find({}).toArray((err, objs) => {
			if (err) {
				cl('Cannot get you a list of ', err)
				res.json(404, { error: 'not found' })
			} else {
				cl("Returning list of " + objs.length + " " + objType + "s");
				res.json(objs);
			}
			db.close();
		});
	});
});

// GETs a single
app.get('/data/:objType/:id', function (req, res) {
	const objType = req.params.objType;
	const objId = req.params.id;
	cl(`Getting you an ${objType} with id: ${objId}`);
	dbConnect()
		.then((db) => {
			const collection = db.collection(objType);
			//let _id;
			//try {
			let _id = new mongodb.ObjectID(objId);
			//}
			//catch (e) {
			//	console.log('ERROR', e);
			//	return Promise.reject(e);
			//}

			collection.find({ _id: _id }).toArray((err, objs) => {
				if (err) {
					cl('Cannot get you that ', err)
					res.json(404, { error: 'not found' })
				} else {
					cl("Returning a single " + objType);
					res.json(objs[0]);
				}
				db.close();
			});
		});
});

// DELETE
app.delete('/data/:objType/:id', function (req, res) {
	const objType = req.params.objType;
	const objId = req.params.id;
	cl(`Requested to DELETE the ${objType} with id: ${objId}`);
	dbConnect().then((db) => {
		const collection = db.collection(objType);
		collection.deleteOne({ _id: new mongodb.ObjectID(objId) }, (err, result) => {
			if (err) {
				cl('Cannot Delete', err)
				res.json(500, { error: 'Delete failed' })
			} else {
				cl("Deleted", result);
				res.json({ "Deleted Status": "Succesful" }); // Should be empty?
			}
			db.close();
		});

	});


});

// POST - adds 
app.post('/data/:objType', upload.single('file'), function (req, res) {
	//console.log('req.file', req.file);
	// console.log('req.body', req.body);

	const objType = req.params.objType;
	cl("POST for " + objType);

	const obj = req.body;
	delete obj._id;
	// If there is a file upload, add the url to the obj
	// if (req.file) {
	// 	obj.imgUrl = serverRoot + req.file.filename;
	// }

	dbConnect().then((db) => {
		const collection = db.collection(objType);
		// if(objType === 'meal' || objType === 'feeling'){
		// 	obj.userId = new mongodb.ObjectID(obj.userId);
		// }
		collection.insert(obj, (err, result) => {
			if (err) {
				cl(`Couldnt insert a new ${objType}`, err)
				res.json(500, { error: 'Failed to add' })
			} else {
				cl(objType + " added");
				res.json(obj);
				db.close();
			}
		});
	});

});

// PUT - updates
app.put('/data/:objType/:id', function (req, res) {
	const objType = req.params.objType;
	const objId = req.params.id;
	const newObj = req.body;
	if (newObj._id && typeof newObj._id === 'string') newObj._id = new mongodb.ObjectID(newObj._id);

	console.log("objType", objType);
	console.log("objId", objId);
	console.log("newObj", newObj);

	cl(`Requested to UPDATE the ${objType} with id: ${objId}`);
	dbConnect().then((db) => {
		const collection = db.collection(objType);
		collection.updateOne({ _id: new mongodb.ObjectID(objId) }, newObj,
			(err, result) => {
				if (err) {
					cl('Cannot Update', err)
					res.json(500, { error: 'Update failed' })
				} else {
					res.json(newObj);
				}
				db.close();
			});
	});
});

app.post('/usermeals', function (req, res) {
	// const id = new mongodb.ObjectID(req.body.userId);
	dbConnect().then((db) => {
		db.collection('meal').find({ userId: req.body.userId }).toArray(function (err, meals) {
			if (meals) {
				meals = meals.filter(meal => {
					if (meal.time >= req.body.from && meal.time <= req.body.to) return meal;
				})
				cl('Found meals for user');
				cl(meals)
				res.json({ meals });
			} else {
				cl('No meals found for user');
				res.json(403, { error: 'Meals were not found' })
			}
			db.close();
		})
	});
})

// app.post('userfeelings' , function (req , res){
// 	const id = new mongodb.ObjectID(req.body.userId);
// 	dbConnect().then( (db) => {
// 		db.collection('feeling').find({userId: id}).toArray(function (err , feelings){
// 			if(feelings){
// 				feelings = feelings.filter( feeling => {
// 					if(feeling )
// 				});
// 			} else {

// 			}
// 		});
// 	})
// });

// Basic Login/Logout/Protected assets
app.post('/login', function (req, res) {
	dbConnect().then((db) => {
		console.log(req.body)
		db.collection('user').findOne({ email: req.body.email, password: req.body.password }, function (err, user) {
			console.log(user)
			if (user) {
				cl('Login Succesful');
				delete user.password;
				req.session.user = user;  //refresh the session value
				res.json({ token: 'Beareloginr: puk115th@b@5t', user });
			} else {
				cl('Login NOT Succesful');
				req.session.user = null;
				res.status(403).json({ error: 'Login failed' });
				// res.json(403, { error: 'Login failed' })
			}
		});
	});
});

app.get('/logout', function (req, res) {
	req.session.reset();
	res.end('Loggedout');
});

function requireLogin(req, res, next) {
	if (!req.session.user) {
		cl('Login Required');
		res.json(403, { error: 'Please Login' })
	} else {
		next();
	}
};
app.get('/protected', requireLogin, function (req, res) {
	res.end('User is loggedin, return some data');
});


// Kickup our server 
// Note: app.listen will not work with cors and the socket
// app.listen(3003, function () {
http.listen(3004, function () {
	// console.log(`REST server is ready at ${baseUrl}`);
	// console.log(`GET (list): \t\t ${baseUrl}/{entity}`);
	// console.log(`GET (single): \t\t ${baseUrl}/{entity}/{id}`);
	// console.log(`DELETE: \t\t ${baseUrl}/{entity}/{id}`);
	// console.log(`PUT (update): \t\t ${baseUrl}/{entity}/{id}`);
	// console.log(`POST (add): \t\t ${baseUrl}/{entity}`);

});


io.on('connection', function (socket) {
	console.log('a user connected');
	socket.on('disconnect', function () {
		console.log('user disconnected');
	});
	socket.on('chat message', function (msg) {
		// console.log('message: ' + msg);
		io.emit('chat message', msg);
	});
});

cl('WebSocket is Ready');

// Some small time utility functions
function cl(...params) {
	console.log.apply(console, params);
}

app.use('/*', express.static(__dirname));