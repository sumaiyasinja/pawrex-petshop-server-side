const express = require("express");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(
  cors({
    origin: [
      // "http://localhost:5173",
      'https://assignment11-70459.web.app',
      'https://assignment11-70459.firebaseapp.com'
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

console.log(process.env.DB_USER);

// const uri = "mongodb+srv://<username>:<password>@cluster0.ctrkbrk.mongodb.net/?retryWrites=true&w=majority";
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ctrkbrk.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const tokenVerify = async (req, res, next) => {
  const token = req.cookies?.token;
  // console.log('Token verifying', token);

  if (!token) {
    return res.status(401).json({ message: "Unauthorized - Token missing" });
  }

  jwt.verify(token, process.env.SECRET, (err, decoded) => {
    if (err) {
      console.error("Token verification error:", err);
      return res.status(401).json({ message: "Unauthorized - Token invalid" });
    }

    req.user = decoded;
    console.log("Token verification successful");
    next();
  });
};

async function run() {
  try {
    // await client.connect();

    const serviceCollection = client.db("pawrexDB").collection("service");
    const bookingCollection = client.db("pawrexDB").collection("bookings");

    app.post("/jwt", async (req, res) => {
      const user = req.body;
      console.log("user from body", user);

      const token = jwt.sign(user, process.env.SECRET, { expiresIn: "1h" });

      // res.cookie("token", token, {
      //   httpOnly: true,
      //   secure: true,
      //   // samesite: 'none'
      // });
      res
      .cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', 
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',

    })
      res.send({ success: true });
    });

    // services
    app.get("/services", async (req, res) => {
      const cursor = serviceCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.post("/services", async (req, res) => {
      const service = req.body;
      const result = await serviceCollection.insertOne(service);
      res.send(result);
    });
    app.get("/services/:id", async (req, res) => {
      const id = req.params.id;
      const query = {
        _id: new ObjectId(id),
      };
      const result = await serviceCollection.findOne(query);
      res.send(result);
    });
    app.delete("/services/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await serviceCollection.deleteOne(query);
      res.send(result);
    });

    app.put("/services/:_id", async (req, res) => {
      const _id = req.params._id;
      const service = req.body;
      const filter = { _id: new ObjectId(_id) };
      const updatedDoc = {
        $set: {
          // status: booking.status,
          service_name: service.service_name,
          service_description: service.service_description,
          service_image: service.service_image,
          service_price: service.service_price,
          times_taken: service.times_taken,
          service_area: service.service_area,
        },
      };
      const result = await serviceCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });

    // book ur service
    app.post("/bookings", async (req, res) => {
      const booking = req.body;
      const result = await bookingCollection.insertOne(booking);
      res.send(result);
    });

    app.get("/bookings",tokenVerify, async (req, res) => {
      const userEmail = req.query.email;
      if (req?.user?.email !== userEmail) {
        return res.status(403).send({ message: "forbidden access use email password login not google" });
      }

      const query = {
        BookedBy: userEmail,
      };

      try {
        const bookings = await bookingCollection.find(query).toArray();
        res.json(bookings);
      } catch (error) {
        // console.error(error);
        res.status(500).json({ message: "Internal server error" });
      }
    });

    app.get("/myprod", tokenVerify,async (req, res) => {
    
      const user = req.query.email;
      if (req?.user?.email !== user) {
        return res.status(403).send({ message: "forbidden access use email password login not google" });
      }
      const query = {
        provider: user,
      };
      const result = await bookingCollection.find(query).toArray();
      res.send(result);
    });

    app.put("/myprod/:id", async (req, res) => {
      const booking = req.body;
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          status: booking.status,
        },
      };
      const result = await bookingCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });

    // user booking
    app.delete("/bookings/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await bookingCollection.deleteOne(query);
      res.send(result);
    });
    // update booking
    app.put("/bookings/:id", async (req, res) => {
      const id = req.params.id;
      const booking = req.body;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          // status: booking.status,
          date: booking.date,
          instruction: booking.instruction,
        },
      };
      const result = await bookingCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });
    app.get("/bookings/:id", async (req, res) => {
      const id = req.params.id;
      const query = {
        _id: new ObjectId(id),
      };
      const result = await bookingCollection.findOne(query);
      res.send(result);
    });
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Pewrex app server listening on port ${port}`);
});
