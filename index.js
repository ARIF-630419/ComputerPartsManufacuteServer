const express = require('express');
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion,ObjectId} = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.c1ponza.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).send({ message: 'UnAuthorized access' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
      if (err) {
        return res.status(403).send({ message: 'Forbidden access' })
      }
      req.decoded = decoded;
      next();
    });
  }
async function run() {
    try {
        await client.connect();
        const partsCollection = client.db('ComputerParts').collection('Parts');
        const orderCollection = client.db('ComputerParts').collection('Orders');
        const userCollection = client.db('ComputerParts').collection('users');
        const reviewsCollection = client.db('ComputerParts').collection('reviews');
        const profileCollection = client.db('ComputerParts').collection('profile');


        // parts api
        app.get('/parts', async (req, res) => {
            const query = {};
            const cursor = partsCollection.find(query);
            const parts = await cursor.toArray();
            res.send(parts);
        })
        app.post('/parts', async (req, res) => {
            const newParts = req.body;
            const result = await partsCollection.insertOne(newParts);
            res.send(result);
        });
        app.delete('/parts/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await partsCollection.deleteOne(query);
            res.send(result);
        });

        // order api
        app.get("/allorder", async (req, res) => {
            const query = {};
            const cursor = orderCollection.find(query);
            const stores = await cursor.toArray();
            res.send(stores);
        })
        app.get('/order', verifyJWT, async(req, res) =>{
            const email = req.query.email;
            const decodedEmail = req.decoded.email;
            if(email===decodedEmail){
                const query = {email: email};
                const orders = await orderCollection.find(query).toArray();
                res.send(orders);
            }
            else {
                return res.status(403).send({ message: 'forbidden access' });
              }
            
          })
        app.post('/order', async (req, res) => {
            const orders = req.body;
            const result = await orderCollection.insertOne(orders);
            res.send({ success: true, result })
        })
       
        app.delete('/order/:id', async (req, res) => {
            const id = req.params.id;
            const query = {_id: ObjectId(id) };
            const result = await orderCollection.deleteOne(query);
            res.send(result);
        });

        // user api
        app.get('/user',verifyJWT,async (req, res) => {
            const users = await userCollection.find().toArray();
            res.send(users);
          });

          app.get('/admin/:email', async(req, res) =>{
            const email = req.params.email;
            const user = await userCollection.findOne({email: email});
            const isAdmin = user.role === 'admin';
            res.send({admin: isAdmin})
          })
          app.put('/user/admin/:email', verifyJWT,async (req, res) => {
            const email = req.params.email;
            const requester = req.decoded.email;
            const requesterAccount = await userCollection.findOne({ email: requester });
            if (requesterAccount.role === 'admin') {
              const filter = { email: email };
              const updateDoc = {
                $set: { role: 'admin' },
              };
              const result = await userCollection.updateOne(filter, updateDoc);
              res.send(result);
            }
            else{
              res.status(403).send({message: 'forbidden'});
            }
      
          })

           app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = {
              $set: user,
            };
            const result = await userCollection.updateOne(filter, updateDoc, options);
            const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
            res.send({ result, token });
          })


          // reviews api
          app.get("/reviews", async (req, res) => {
            const query = {};
            const cursor = reviewsCollection.find(query);
            const reviews = await cursor.toArray();
            res.send(reviews);
        })
          app.post('/reviews', async (req, res) => {
            const review = req.body;
            const result = await reviewsCollection.insertOne(review);
            res.send(result);
        });

        app.post('/MyProfile', async (req, res) => {
            const myProfile = req.body;
            const result = await profileCollection.insertOne(myProfile);
            res.send(result);
        })

    }
    finally {

    }
}

run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Hello From Compter parts Manufucture!')
})

app.listen(port, () => {
    console.log(`Compter parts Manufucture App listening on port ${port}`)
})