const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion,ObjectId} = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.c1ponza.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
async function run() {
    try {
        await client.connect();
        const partsCollection = client.db('ComputerParts').collection('Parts');
        const orderCollection = client.db('ComputerParts').collection('Orders');

        app.get('/parts', async (req, res) => {
            const query = {};
            const cursor = partsCollection.find(query);
            const parts = await cursor.toArray();
            res.send(parts);
        })
        app.get('/order', async(req, res) =>{
            const email = req.query.email;
            const query = {email: email};
            const orders = await orderCollection.find(query).toArray();
            res.send(orders);
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