const express = require('express')
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express()
const port = process.env.PORT || 5000

// middleware
app.use(cors())
app.use(express.json());

console.log(process.env.DB_USER);

// const uri = "mongodb+srv://<username>:<password>@cluster0.ctrkbrk.mongodb.net/?retryWrites=true&w=majority";
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ctrkbrk.mongodb.net/?retryWrites=true&w=majority`;


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

    const serviceCollection = client.db("pawrexDB").collection("service");
    const bookingCollection = client.db("pawrexDB").collection("bookings");
    
    // services
    app.get('/services', async(req, res) =>{
        const cursor = serviceCollection.find();
        const result = await cursor.toArray();
        res.send(result)
    })

    app.post('/services', async(req, res) =>{
        const service = req.body;
        const result = await serviceCollection.insertOne(service);
        console.log(result);
        res.send(result)
    })
    app.get('/services/:id', async(req, res) =>{
        const id = req.params.id;
         const query = {
        _id: new ObjectId(id),
      };
        const result =await serviceCollection.findOne( query );
        res.send(result)
    })
    app.put('/services/:id', async(req, res) =>{
        const id = req.params.id;
        const service = req.body;
        const filter = { _id: new ObjectId(id) };
        const options = { upsert: true };
        const updatedService = {
          $set: {
            service_name :service.service_name ,
            service_description: service.service_description, 
            service_image :service.service_image ,
            service_price : service.service_price ,
            times_taken :service.times_taken ,
            service_area :service.service_area ,
            // service_provider:service.service_provider
          },
        };
        const result = await serviceCollection.updateOne(
          filter,
          updatedService,
          options
        );
        res.send(result);
    })

    // book service
    app.post('/bookings', async(req, res) =>{
        const booking = req.body;
        const result = await bookingCollection.insertOne(booking);
        res.send(result)
    })

   app.get('/bookings', async (req, res) => {
  const userEmail = req.query.email; 

  const query = {
    BookedBy: userEmail,
  };

  try {
    const bookings = await bookingCollection.find(query).toArray();
    res.json(bookings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
    });

    app.put('/bookings', async (req, res) => {
      // const id = req.params.id;
      const updatedBooking = req.body;
      // const filter = { _id: new ObjectId(id) };
      const filter = req.query.email; 

      const options = { upsert: true };
      const updatedDoc = {
        $set: {
          status: updatedBooking.status
        },
      };
      const result = await bookingCollection.updateOne(filter, updatedDoc, options);
      res.send(result);
    })
  
    app.delete('/bookings/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await bookingCollection.deleteOne(query);
      res.send(result);
  })
    
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Hello World!')
  })
  
  app.listen(port, () => {
    console.log(`Pewrex app server listening on port ${port}`)
  })