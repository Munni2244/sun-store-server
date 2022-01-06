const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const port = process.env.PORT ||4000;
const { MongoClient } = require('mongodb');
const ObjectId=require('mongodb').ObjectId;
const stripe= require('stripe')(process.env.STRIPE_KEY)

app.use(cors())
app.use(express.json())

const uri = `mongodb+srv://${ process.env.DB_USER}:${process.env.DB_PASS}@cluster0.crn6x.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

// console.log(uri);

async function run() {
  try {
    await client.connect();

    const database = client.db("SunStore");
    const productsCollection = database.collection("products");
    const ordersCollection = database.collection("orders");
    const reviewCollection = database.collection("reviews");
    const userCollection = database.collection("user_info");

// get all products
app.get('/products', async(req,res)=>{
    const cursor =await productsCollection.find({}).toArray();
    // console.log(cursor);
    res.send(cursor)
})

//get single product
app.get('/products/:id', async(req,res)=>{
    const id=req.params.id;
    const query={_id: ObjectId(id)};
    const cursor= await productsCollection.findOne(query);
    // console.log(cursor);
    res.send(cursor);

})

//post products
app.post('/products', async(req,res)=>{
  const doc=req.body;
  const result= await productsCollection.insertOne(doc);
  // console.log(result);
  res.send(result)
})

//get reviews
app.get('/reviews', async(req,res)=>{
  const cursor =await reviewCollection.find({}).toArray();
  // console.log(cursor);
  res.send(cursor)
})

//remove product
app.delete('/products/:id', async(req, res)=>{
  const id=req.params.id;
  const query= {_id: ObjectId(id)}
  const result=await productsCollection.deleteOne(query);
  // console.log(result);
  res.send('delete')
})

//post orders
app.post('/orders', async(req,res)=>{
    const doc=req.body;
    const result= await ordersCollection.insertOne(doc);
    // console.log(result);
    res.send(result)
})

// update my order
app.put('/orders/:id', async(req, res)=>{
  const id= req.params.id;
  const payment= req.body;
  const filter= {_id: ObjectId(id)};
  const updateDoc={
    $set:{
      payment: payment
    }
  }
  const result= await ordersCollection.updateOne(filter, updateDoc);
  res.send(result);
})

// get All orders
app.get('/allOrders', async(req,res)=>{
  const cursor=await ordersCollection.find({}).toArray();
  // console.log(cursor);
  res.send(cursor)
})

//get my order
app.get('/myOrders/:email', async(req,res)=>{
  const email=req.params.email;
  const cursor={email:email}
  const result= await ordersCollection.find(cursor).toArray();
  // console.log(result);
  res.send(result);
})

//get payment id
app.get('/payment/:id', async(req,res)=>{
  const paymentId= req.params.id;
  const query= {_id:ObjectId(paymentId)};
  const result= await ordersCollection.findOne(query);
  res.send(result);
})

//cancel  my order
app.delete('/orders/:id', async(req, res)=>{
  const id=req.params.id;
  const query= {_id: ObjectId(id)}
  const result=await ordersCollection.deleteOne(query);
  // console.log(result);
  res.send('delete')
})

//update status
app.put('/updateOrders/:id', async (req, res) => {
  const id = req.params.id;
  const updateMethod = req.body;
  const filter = { _id: ObjectId(id) };
  const result = await ordersCollection.updateOne(filter, {
    $set: {
      status: 'Approve'
    }
  })

  res.send(result)

})

//post review
app.post('/addReview', async(req,res)=>{
  const doc=req.body;
  const result= await reviewCollection.insertOne(doc);
  console.log(result);
  res.send(result)
})

//post user info
app.post('/addUserInfo', async (req, res) => {
  const docs = req.body;
  const result = await userCollection.insertOne(docs);
  // console.log(result);
  res.send(result)

})

// make addmin
app.put('/addAdmin', async (req, res) => {
  const user = req.body;
  console.log('put', req.headers);
  const filter = { email: user.email };
  const updateDoc = { $set: { role: 'admin' } };
  const doc = await userCollection.updateOne(filter, updateDoc)

  res.send(doc)


})

///check admin 
// app.get('/users/:email', async(req,res)=>{
//   const email= req.params.email;
//   const  query= {email: email};
//   const user= await userCollection.findOne(query);
//   let isAdmin= false;
//   if(user?.role){
//     isAdmin=true;
//   }
// // console.log(isAdimn);
//   res.send({admin: isAdmin})
// })

app.get("/checkAdmin/:email", async (req, res) => {
  const email = req.params.email;
  const query = { email: email };
  const result = await userCollection.findOne(query);
  res.send(result);
});

//payment stripe
app.post('/create-payment-intent', async(req,res)=>{
  const paymentInfo= req.body;
  const amount = paymentInfo.price * 100;
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount,
    currency: "usd",
   payment_method_types: ['card']
  });
res.send({
  clientSecret: paymentIntent.client_secret,
}  )

})



  } finally {
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send("Welcome to Sun store")
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})