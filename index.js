const express = require('express')
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express()
const port = process.env.PORT || 5000

// middleware
app.use(cors({
  origin: [
      // 'http://localhost:5173',
      https://assignment11-70459.web.app/,
      https://assignment11-70459.firebaseapp.com/
     
  ],
  credentials: true
}));
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
  }
});


const tokenVerify = async(req, res, next) =>{
  const token = req?.cookies?.token;
  // console.log('token in the middleware', token);
  // no token available 
  if(!token){
      return res.status(401).send({message: 'unauthorized access'})
  }

  jwt.verify(token, process.env.SECRET, (err, decoded) =>{
      if(err){
          return res.status(401).send({message: 'unauthorized access'})
      }
      req.user = decoded;
      next();
  })
}
async function run() {
  try {
    await client.connect();

    const serviceCollection = client.db("pawrexDB").collection("service");
    const bookingCollection = client.db("pawrexDB").collection("bookings");

    app.post('/jwt', async(req, res) => {
      const body = req.body
      red.send(body)
     const token = jwt.sign(body, process.env.SECRET, { expiresIn: '1h' });
     res.cookie("token", token, 
     {
      httpOnly: true,
      secure: false,
      // send()
      // expires: 1hr
     }
     ) .send({ success: true });

      console.log('Received POST request:', req.body);
    
      // Send a response (modify this based on your needs)
      res.status(200).json({ message: 'POST request received successfully' });
    });

 
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
    app.delete('/services/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await serviceCollection.deleteOne(query);
      res.send(result);
    })

    app.put('/services/:_id', async(req, res) =>{
      const _id = req.params._id;
      const service = req.body;
      const filter = { _id: new ObjectId(_id) };
      const updatedDoc = {
        $set: {
          // status: booking.status,
          service_name :service.service_name ,
          service_description: service.service_description, 
          service_image :service.service_image ,
          service_price : service.service_price ,
          times_taken :service.times_taken ,
          service_area :service.service_area ,

        },
      };
      const result = await serviceCollection.updateOne(filter, updatedDoc);
      res.send(result);
  })
    
 // update booking
//     app.put('/services/:id', async(req, res) =>{
//       const id = req.params.id;
//       const service = req.body;
//       const filter = { _id: new ObjectId(id) };
//       const updatedDoc = {
//         $set: {
                // service_name :service.service_name ,
                // service_description: service.service_description, 
                // service_image :service.service_image ,
                // service_price : service.service_price ,
                // times_taken :service.times_taken ,
                // service_area :service.service_area ,

//         },
//       };
//   const result = await serviceCollection.updateOne(filter, updatedDoc);
//   res.send(result);
// })
    // book ur service
    app.post('/bookings', async(req, res) =>{
        const booking = req.body;
        const result = await bookingCollection.insertOne(booking);
        res.send(result)
    })
    // get your booking
        app.get('/bookings',tokenVerify, async (req, res) => {
        const userEmail = req.query.email; 
        if(req.user.email !== req.query.email){
          return res.status(403).send({message: 'forbidden access'})
      }
      let query = {};
      if (req.query?.email) {
        const query = {
            BookedBy: userEmail,
            
          };
      }
      const bookings = await bookingCollection.find(query).toArray();
          res.json(bookings);
        })
        // const query = {
        //   BookedBy: userEmail,
          
        // };

        // try {
        //   const bookings = await bookingCollection.find(query).toArray();
        //   res.json(bookings);
        // } catch (error) {
        //   console.error(error);
        //   res.status(500).json({ message: 'Internal server error' });
        // }
          // });
    // get your provided service email
   app.get('/myservices', async (req, res) => {
      const userEmail = req.query.email; 

      const query = {
        provider: userEmail, 
      };

      try {
        const bookings = await bookingCollection.find(query).toArray();
        res.json(bookings);
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
      }
        });
          // app.get('/myservice', async(res,req)=>{
          //   const user = req.query.email

          // })
        
        // user booking
        app.delete('/bookings/:id', async (req, res) => {
          const id = req.params.id;
          const query = { _id: new ObjectId(id) }
          const result = await bookingCollection.deleteOne(query);
          res.send(result);
        })
        // update booking
        app.put('/bookings/:id',tokenVerify, async(req, res) =>{
        const id = req.params.id;
        const booking = req.body;
        const filter = { _id: new ObjectId(id) };
        const updatedDoc = {
          $set: {
            // status: booking.status,
            date: booking.date,
            instruction : booking.instruction

          },
        };
        const result = await bookingCollection.updateOne(filter, updatedDoc);
        res.send(result);
    })
    app.get('/bookings/:id', async(req, res) =>{
        const id = req.params.id;
         const query = {
        _id: new ObjectId(id),  
      };
        const result =await bookingCollection.findOne( query );
        res.send(result)
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