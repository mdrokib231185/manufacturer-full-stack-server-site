const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
// const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId, ObjectID } = require("mongodb");
const jwt = require("jsonwebtoken");
const query = require("express/lib/middleware/query");

const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.USER_PASS}@cluster0.812m2.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

function verifyJWT(req, res, next) {
  // console.log('rokib');
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "UnAuthorized access" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "Forbidden access" });
    }
    req.decoded = decoded;
    next();
    console.log(decoded.foo); // bar
  });
}
async function run() {
  try {
    await client.connect();
    const productsCollection = client
      .db("assignment-12")
      .collection("products");
    const bookingCollection = client.db("assignment-12").collection("booking");
    const reviewCollection = client.db("assignment-12").collection("review");
    const userCollection = client.db("assignment-12").collection("users");
    const profileCollection = client.db("assignment-12").collection("profile");

    app.get("/products", async (req, res) => {
      const product = await productsCollection.find().toArray();
      res.send(product);
    });

    app.get("/review", async (req, res) => {
      const review = await reviewCollection.find().toArray();
      res.send(review);
    });


    app.get("/profile", async (req, res) => {
      const review = await profileCollection.find().toArray();
      res.send(review);
    });

  app.post("/review", async (req, res) => {
    const newProduct = req.body;
    const result = await reviewCollection.insertOne(newProduct);
    res.send(result);
  });
    // app.post("/create-payment-intent",  async (req, res) => {
    //   const service = req.body;
    //   const price = service.price;
    //   const amount = price * 100;
    //   const paymentIntent = await stripe.paymentIntents.create({
    //     amount: amount,
    //     currency: "usd",
    //     payment_method_types: ["card"],
    //   });
    //   res.send({ clientSecret: paymentIntent.client_secret });
    // });



    app.post("/products", async (req, res) => {
      const newProduct = req.body;
      const result = await productsCollection.insertOne(newProduct);
      res.send(result);
    });
  

    app.get("/user", verifyJWT, async (req, res) => {
      const user = await userCollection.find().toArray();
      res.send(user);
    });

    app.put("/user/:email", async (req, res) => {
      const user = req.body;
      const email = req.params.email;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN, {
        expiresIn: "1d",
      });
      res.send({ result, token });
    });
    app.put("/user/admin/:email", verifyJWT, async (req, res) => {
      const email = req.params.email;
      const requester = req.decoded.email;
      const requesterAccount = await userCollection.findOne({
        email: requester,
      });
      if (requesterAccount.role === "admin") {
        const filter = { email: email };
        const updateDoc = {
          $set: { role: "admin" },
        };
        const result = await userCollection.updateOne(filter, updateDoc);

        res.send(result);
      } else {
        res.status(403).send({ message: "forbidden access" });
      }
    });

    app.get('/admin/:email', async (req, res) => {
      const email = req.params.email
      const user = await userCollection.findOne({ email: email })
      const isAdmin = user.role === 'admin'
      res.send({admin : isAdmin})
})

    

    app.get("/booking", verifyJWT, async (req, res) => {
      const customer = req.query.customer;
      const authorization = req.headers.authorization;
      const decodedEmail = req.decoded.email;
      if (customer === decodedEmail) {
        const query = { customer: customer };
        const bookings = await bookingCollection.find(query).toArray();
        return res.send(bookings);
      } else {
        return res.status(403).send({ message: "forbidden access" });
      }
    });

    app.post("/booking", async (req, res) => {
      const booking = req.body;
      const result = await bookingCollection.insertOne(booking);
      res.send(result);
    });

    app.delete("/booking/:id", async (req, res) => {
     const id= req.params.id
     const query = { _id: ObjectId(id) }
      const result = await bookingCollection.deleteOne(query);
      res.send(result);
    });


    app.get("/booking/:id", async (req, res) => {
     const id= req.params.id
     const query = { _id: ObjectId(id) }
      const result = await bookingCollection.findOne(query);
      res.send(result);
    });

    app.get("/products/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const products = await productsCollection.findOne(query);
      res.send(products);
    });
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Assignment listening on port ${port}`);
});
