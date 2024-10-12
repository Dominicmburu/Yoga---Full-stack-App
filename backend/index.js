const express = require('express')
const app = express()
const cors = require('cors');
require('dotenv').config()

// This is your test secret API key.
const stripe = require("stripe")(process.env.PAYMENT_SECRET);

const jwt = require("jsonwebtoken")

const port = process.env.PORT || 3000


app.use(cors());
app.use(express.json());

// VERIFY TOKENS
const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).send({ message: 'Invalid authorization' })
  }

  const token = authorization?.split(' ')[1];
  jwt.verify(token, process.env.ASSESS_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).send({ message: 'Forbidden access' })
    }
    req.decoded = decoded;
    next();
  })
}


// mongodb connection
const { MongoClient, ServerApiVersion, ObjectId, Transaction } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@yoga.xuie6.mongodb.net/?retryWrites=true&w=majority&appName=yoga`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();


    // create a database and a collections
    const database = client.db('yoga-master');
    const userCollection = database.collection('users');
    const classesCollection = database.collection('classes');
    const cartCollection = database.collection('cart');
    const paymentCollection = database.collection('payments');
    const enrolledCollection = database.collection('enrolled');
    const appliedCollection = database.collection('applied');

    // SET TOKENS
    app.post("/api/set-token", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ASSESS_SECRET, {
        expiresIn: '24h'
      });
      res.send({ token })
    })

    // middleware for admin and instructor
    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      if (user.role === 'admin') {
        next();
      } else {
        return res.status(401).send({ message: 'Unauthorized access' });
      }
    }

    const verifyInstructor = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      if (user.role === 'instructor') {
        next();
      } else {
        return res.status(401).send({ message: 'Unauthorized access' });
      }
    }


    // ROUTE FOR USERS
    app.post('/new-user', async (req, res) => {
      const newUser = req.body;
      const result = await userCollection.insertOne(newUser);
      res.send(result);
    });

    app.get('/users', async (req, res) => {
      const result = await userCollection.find({}).toArray();
      res.send(result);
    });

    app.get('/users/:id', async (req, res) => {
      const id = req.params.id;
      const result = await userCollection.findOne(query);
      res.send(result);
    });

    app.get('/user/:email', verifyJWT, async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await userCollection.findOne(query);
      res.send(result);
    });

    app.delete('/delete-user/:id', verifyJWT, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await userCollection.deleteOne(query);
      res.send(result);
    });

    app.put('/update-user/:id', verifyJWT, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const updatedUser = req.body;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.options,
          address: updatedUser.address,
          about: updatedUser.about,
          photoUrl: updatedUser.photoUrl,
          skills: updatedUser.skills ? updatedUser.skills : null,
        }
      }
    })

    // classes routes

    // post classes data
    app.post('/new-class', verifyJWT, verifyInstructor, async (req, res) => {
      try {
        const newClass = req.body;
        const result = await classesCollection.insertOne(newClass);
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: 'Failed to insert class data' });
      }
    });

    // get classes data
    app.get('/classes', async (req, res) => {
      const query = { status: 'approved' };
      const result = await classesCollection.find().toArray();
      res.send(result);
    });

    // get classes by instructor email address
    app.get('/classes/:email', verifyJWT, verifyInstructor, async (req, res) => {
      const email = req.params.email;
      const query = { instructorEmail: email };
      const result = await classesCollection.find(query).toArray();
      res.send(result);
    });

    // manage classes
    app.get('/classes-manage', async (req, res) => {
      const result = await classesCollection.find().toArray();
      res.send(result);
    });

    // update classes
    app.patch('/change-status/:id', verifyJWT, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const status = req.body.status;
      const reason = req.body.reason;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          status: status,
          reason: reason,
        },
      };
      const result = await classesCollection.updateOne(filter, updateDoc, options);
      res.send(result);
    })

    // get approved classes
    app.get('/approved-classes', async (req, res) => {
      const query = { status: 'approved' };
      const result = await classesCollection.find(query).toArray();
      res.send(result);
    })

    // get single class details
    app.get('/class/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await classesCollection.findOne(query);
      res.send(result);
    })

    // update class details (all data)
    app.put('/update-class/:id', verifyJWT, verifyInstructor, async (req, res) => {
      const id = req.params.id;
      const updateClass = req.body;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          name: updateClass.name,
          description: updateClass.description,
          price: updateClass.price,
          availableSeats: parseInt(updateClass.availableSeats),
          videoLink: updateClass.videoLink,
          status: 'pending',
        }
      };
      const result = await classesCollection.updateOne(filter, updateDoc, options);
      res.send(result);
    })


    // ------ Cart Routes -------------------

    // add to cart
    app.post('/add-to-cart', verifyJWT, async (req, res) => {
      const newCartItem = req.body;
      const result = await cartCollection.insertOne(newCartItem);
      res.send(result);
    })

    // get cart item by id
    app.get('/cart-item/:id', verifyJWT, async (req, res) => {
      const id = req.params.id;
      const email = req.body.email;
      const query = {
        classId: id,
        userMail: email
      };

      const projection = { classId: 1 };

      const result = await cartCollection.findOne(query, { projection: projection });
      res.send(result);
    });


    // cart info by user email
    app.get('/cart/:email', verifyJWT, async (req, res) => {
      const email = req.params.email;
      const query = { userMail: email };
      const projection = { classId: 1 };
      const carts = await cartCollection.find(query, { projection: projection });
      const classIds = carts.map((cart) => new ObjectId(cart.classId));
      const query2 = { _id: { $in: classIds } };
      const result = await classesCollection.find(query2).toArray();
      res.send(result);
    })

    // delete cart item
    app.delete('/delete-cart-item/:id', verifyJWT, async (req, res) => {
      const id = req.params.id;
      const query = { classId: id };
      const result = await cartCollection.deleteOne(query);
      res.send(result);
    })


    // PAYMENT ROUTE
    app.post("/create-payment-intent", async (req, res) => {
      const { price } = req.body;
      const { amount } = parseInt(price) * 100;

      // Create a PaymentIntent with the order amount and currency
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        // In the latest version of the API, specifying the `automatic_payment_methods` parameter is optional because Stripe enables its functionality by default.
        // automatic_payment_methods: {
        //   enabled: true,
        // },

        payment_method_types: ["card"],
      });

      res.send({
        clientSecret: paymentIntent.client_secret,
        // [DEV]: For demo purposes only, you should avoid exposing the PaymentIntent ID in the client-side code.
        // dpmCheckerLink: `https://dashboard.stripe.com/settings/payment_methods/review?transaction_id=${paymentIntent.id}`,
      });
    });

    // post payment info to db
    app.post('/payment-info', verifyJWT, async (req, res) => {
      const paymentInfo = req.body;
      const classesId = paymentInfo.classesId;
      const userEmail = paymentInfo.userEmail;
      const signleClassId = req.query.classId;
      let query;
      if (signleClassId) {
        query = { classId: signleClassId, userMail: userEmail };
      } else {
        query = { classId: { $in: classesId } };
      }

      const classesQuery = { _id: { $in: classesId.map(id => new ObjectId(id)) } };
      const classes = await classesCollection.find(classesQuery).toArray();
      const newEnrolledData = {
        userEail: userEmail,
        classId: signleClassId.map(id => new ObjectId(id)),
        transactionId: paymentInfo.transactionId
      };

      const updatedDoc = {
        $set: {
          totalEnrolled: classes.reduce((total, current) => total + current.totalEnrolled, 0) + 1 || 0,
          availableSeats: classes.reduce((total, current) => total + current.availableSeats, 0) - 1 || 0
        }
      };

      const updatedResult = await classesCollection.updateMany(classesQuery, updatedDoc, { upsert: true });
      const enrolledResult = await enrolledCollection.insertOne(newEnrolledData);
      const deleteResult = await cartCollection.deleteMany(query);
      const paymentResult = await paymentCollection.insertOne(paymentInfo);

      res.send({ paymentResult, deleteResult, enrolledResult, updatedResult })
    });

    // get payment history
    app.get("/payment-history/:email", async (req, res) => {
      const email = req.params.email;
      const query = { userEail: email };
      const result = await paymentCollection.find(query).sort({ date: -1 }).toArray();
      res.send(result);
    });

    // payment history length
    app.get("/payment-history-length/:email", async (req, res) => {
      const email = req.params.email;
      const query = { userEail: email };
      const total = await paymentCollection.countDocuments(query);
      res.send({ total });
    });



    // Enrollment Routes
    app.get("/popular_classes", async (req, res) => {
      const result = await classesCollection.find().sort({ totalEnrolled: -1 }).limit(6).toArray();
      res.send(result);
    })


    app.get("/popular-instructors", async (req, res) => {
      const pipeline = [
        {
          $group: {
            _id: "$instructorEmail",
            totalEnrolled: { $sum: "$totalEnrolled" }
          }
        },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            as: "instructor"
          }
        },
        {
          $project: {
            _id: 0,
            instructor: {
              $arrayElemAt: ["$instructor.name", 0]
            },
            totalEnrolled: 1
          }
        },
        {
          $sort: { totalEnrolled: -1 }
        },
        {
          $limit: 6
        }
      ];

      const result = await classesCollection.aggregate(pipeline).toArray();
      res.send(result);
    })


    // admin status
    app.get('/admin-stats', verifyJWT, verifyAdmin, async (req, res) => {
      const approvedClasses = ((await classesCollection.find({ status: 'approved' })).toArray()).length;
      const pendingClasses = ((await classesCollection.find({ status: 'pending' })).toArray()).length;
      const instructors = ((await userCollection.find({ role: 'instructor' })).toArray()).length;
      const totalClasses = (await classesCollection.find().toArray()).length;
      const totalEnrolled = (await enrolledCollection.find().toArray()).length;

      const result = {
        approvedClasses,
        pendingClasses,
        instructors,
        totalClasses,
        totalEnrolled
      }

      res.send(result);

    })

    // Get all Instructor

    app.get("/instructors", async (req, res) => {
      const result = await userCollection.find({ role: 'instructor' }).toArray();
      res.send(result);
    });

    app.get("/enrolled-classes/:email", verifyJWT, async (req, res) => {
      const email = req.params.email;
      const query = { userEail: email };
      const pipeline = [
        {
          $match: query
        },
        {
          $lookup: {
            from: 'classes',
            localField: 'classesId',
            foreignField: '_id',
            as: 'classes'
          }
        },
        {
          $unwind: "$classes"
        },
        {
          $lookup: {
            from: 'users',
            localField: "classes.instructorEmail",
            foreignField: "email",
            as: "instructor"
          }
        },
        {
          $project: {
            _id: 0,
            instructor: {
              $arrayElemAt: ["$instructor", 0]
            },
            classes: 1
          }
        }
      ];

      const result = await enrolledCollection.aggregate(pipeline).toArray();
      res.send(result);

    });


    // Appliend for Instructors
    app.post("/ass-instructor", async (req, res) => {
      const data = req.body;
      const result = await appliedCollection.insertOne(data);
      res.send(result);
    });

    app.get("/applied-instructors/:email", async (req, res) => {
      const email = req.params.email;
      const result = await appliedCollection.findOne({ email });
      res.send(result);
    });

    app.get("/applied-instructor/:email", async (req, res) => {
      const data = req.body;
      const result = await appliedCollection.insertOne(data);
      res.send(result);
    });




    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");

  } catch (err) {
    console.error(err);
  }
}

run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Running on port: http://localhost:${port}`)
})