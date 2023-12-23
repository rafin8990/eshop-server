const express=require('express');
const cors=require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port =process.env.PORT || 5000;
const app=express();

app.use(express.json());
app.use(cors());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.nuouh7o.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });

async function run() {
  try {
    
    const productCollection= client.db('eshop').collection('products')
    const cartCollection=client.db('eshop').collection('cartItem')
    

    app.get('/products',async (req, res)=>{
        const result=await productCollection.find().toArray();
        res.send(result)
    })
    app.get('/product/:id', async (req, res) => {
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) };
        const result = await productCollection.findOne(filter);
        res.send(result);
    })

    app.post('/cart/add', async (req, res) => {
        const cartData = req.body;
      
        const productInCart = await cartCollection.findOne({
            productId: cartData.productId,
            color: cartData.color,
            size: cartData.size
        });
      
        if (productInCart) {
            productInCart.quantity += cartData.quantity;
            await cartCollection.updateOne({ _id: productInCart._id }, { $set: productInCart });
        } else {
            await cartCollection.insertOne(cartData);
        }
    
        res.json({ acknowledged: true });
    });


    app.get('/carts',async (req, res)=>{
        const result=await cartCollection.find().toArray();
        res.send(result)
    })

    app.delete('/cart/:id',async(req, res)=>{
        const id=req.params.id;
        const filter={_id: new ObjectId(id)}
        const result = await cartCollection.deleteOne(filter)
        res.send(result)
    })

    console.log(" You successfully connected to MongoDB!");
  } finally {
   
  }
}
run().catch(console.dir);


app.get('/', (req, res)=>{
    res.send('eshop server is running ')
});


app.listen(port,()=>{
    console.log(`eshop server is running on port ${port}`)
})